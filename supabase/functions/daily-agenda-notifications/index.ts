import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get all active professionals
    const { data: professionals, error: profError } = await supabase
      .from('personal_salud')
      .select('id, nombre, apellido, email_contacto, user_id')
      .eq('activo', true)

    if (profError) throw profError

    for (const prof of professionals || []) {
      // Get today's calls for this professional
      const { data: calls, error: callsError } = await supabase
        .from('registro_llamadas')
        .select(`
          id,
          fecha_agendada,
          pacientes:paciente_id (nombre, apellido, cedula)
        `)
        .eq('profesional_id', prof.id)
        .in('estado', ['agendada', 'pendiente'])
        .gte('fecha_agendada', today.toISOString())
        .lt('fecha_agendada', tomorrow.toISOString())
        .order('fecha_agendada', { ascending: true })

      // Get today's visits for this professional
      const { data: visits, error: visitsError } = await supabase
        .from('control_visitas')
        .select(`
          id,
          fecha_hora_visita,
          tipo_visita,
          pacientes:paciente_id (nombre, apellido, cedula)
        `)
        .eq('profesional_id', prof.id)
        .eq('estado', 'pendiente')
        .gte('fecha_hora_visita', today.toISOString())
        .lt('fecha_hora_visita', tomorrow.toISOString())
        .order('fecha_hora_visita', { ascending: true })

      // Create notification message
      let message = `Agenda del día ${today.toLocaleDateString('es-DO')}\n\n`
      
      if (calls && calls.length > 0) {
        message += `📞 Llamadas programadas (${calls.length}):\n`
        calls.forEach((call: any, index: number) => {
          const time = new Date(call.fecha_agendada).toLocaleTimeString('es-DO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          message += `${index + 1}. ${time} - ${call.pacientes?.nombre} ${call.pacientes?.apellido}\n`
        })
        message += '\n'
      }

      if (visits && visits.length > 0) {
        message += `🏥 Visitas programadas (${visits.length}):\n`
        visits.forEach((visit: any, index: number) => {
          const time = new Date(visit.fecha_hora_visita).toLocaleTimeString('es-DO', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          const tipo = visit.tipo_visita === 'domicilio' ? '🏠' : '🏥'
          message += `${index + 1}. ${time} ${tipo} - ${visit.pacientes?.nombre} ${visit.pacientes?.apellido}\n`
        })
      }

      // Only send notification if there are calls or visits
      if ((calls && calls.length > 0) || (visits && visits.length > 0)) {
        console.log(`Sending notification to ${prof.nombre} ${prof.apellido}`)
        
        const emailTo = prof.email_contacto || prof.user_id ? `${prof.user_id}@temp.com` : null;
        
        if (emailTo) {
          try {
            await resend.emails.send({
              from: 'Sistema de Salud <notifications@resend.dev>',
              to: [emailTo],
              subject: `Agenda del día ${today.toLocaleDateString('es-DO')}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #217BF4;">Hola ${prof.nombre} ${prof.apellido}</h2>
                  <p style="color: #666;">Aquí está tu agenda para el día de hoy:</p>
                  
                  ${calls && calls.length > 0 ? `
                    <div style="margin: 20px 0;">
                      <h3 style="color: #217BF4;">📞 Llamadas programadas (${calls.length}):</h3>
                      <ul style="list-style: none; padding: 0;">
                        ${calls.map((call: any, index: number) => {
                          const time = new Date(call.fecha_agendada).toLocaleTimeString('es-DO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          return `<li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 5px;">
                            ${index + 1}. ${time} - ${call.pacientes?.nombre} ${call.pacientes?.apellido}
                          </li>`;
                        }).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  
                  ${visits && visits.length > 0 ? `
                    <div style="margin: 20px 0;">
                      <h3 style="color: #217BF4;">🏥 Visitas programadas (${visits.length}):</h3>
                      <ul style="list-style: none; padding: 0;">
                        ${visits.map((visit: any, index: number) => {
                          const time = new Date(visit.fecha_hora_visita).toLocaleTimeString('es-DO', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          });
                          const tipo = visit.tipo_visita === 'domicilio' ? '🏠 Domicilio' : '🏥 Consultorio';
                          return `<li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 5px;">
                            ${index + 1}. ${time} ${tipo} - ${visit.pacientes?.nombre} ${visit.pacientes?.apellido}
                          </li>`;
                        }).join('')}
                      </ul>
                    </div>
                  ` : ''}
                  
                  <p style="color: #999; margin-top: 30px; font-size: 12px;">
                    Este es un mensaje automático del Sistema de Seguimiento de Pacientes
                  </p>
                </div>
              `,
            });
            console.log(`Email sent successfully to ${emailTo}`);
          } catch (error) {
            console.error(`Failed to send email to ${emailTo}:`, error);
          }
        } else {
          console.log(`No email address available for ${prof.nombre} ${prof.apellido}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily agenda notifications processed',
        professionalsNotified: professionals?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing notifications:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
