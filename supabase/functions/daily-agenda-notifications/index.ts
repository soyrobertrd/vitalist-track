import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
        console.log(message)
        
        // Here you would integrate with your notification system
        // For now, we're just logging it
        // You could send emails, SMS, push notifications, etc.
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
