import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { resolveWorkspaceLocale, formatDateInTz, formatTimeInTz } from '../_shared/locale.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all active professionals (with workspace_id for TZ resolution)
    const { data: professionals, error: profError } = await supabase
      .from('personal_salud')
      .select('id, nombre, apellido, email_contacto, user_id, workspace_id')
      .eq('activo', true)

    if (profError) throw profError

    // Cache locales por workspace para no resolver N veces
    const localeCache = new Map<string, { timezone: string; locale: string }>()
    async function getLocale(wsId: string | null) {
      const key = wsId || "__default__"
      if (localeCache.has(key)) return localeCache.get(key)!
      const loc = await resolveWorkspaceLocale(supabase, wsId)
      localeCache.set(key, loc)
      return loc
    }

    for (const prof of professionals || []) {
      const { timezone, locale } = await getLocale(prof.workspace_id)

      // Determinar el "hoy" en la TZ del workspace
      const now = new Date()
      // Construimos un día completo en la TZ local del workspace
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
      const yyyy = tzDate.getFullYear()
      const mm = String(tzDate.getMonth() + 1).padStart(2, '0')
      const dd = String(tzDate.getDate()).padStart(2, '0')
      // Usamos el día del workspace en UTC range aproximado (para queries por fecha completa funciona en la mayoría de casos)
      const startOfDay = new Date(`${yyyy}-${mm}-${dd}T00:00:00`)
      const endOfDay = new Date(`${yyyy}-${mm}-${dd}T23:59:59`)

      const { data: calls } = await supabase
        .from('registro_llamadas')
        .select(`
          id,
          fecha_agendada,
          pacientes:paciente_id (nombre, apellido, cedula)
        `)
        .eq('profesional_id', prof.id)
        .in('estado', ['agendada', 'pendiente'])
        .gte('fecha_agendada', startOfDay.toISOString())
        .lt('fecha_agendada', endOfDay.toISOString())
        .order('fecha_agendada', { ascending: true })

      const { data: visits } = await supabase
        .from('control_visitas')
        .select(`
          id,
          fecha_hora_visita,
          tipo_visita,
          pacientes:paciente_id (nombre, apellido, cedula)
        `)
        .eq('profesional_id', prof.id)
        .eq('estado', 'pendiente')
        .gte('fecha_hora_visita', startOfDay.toISOString())
        .lt('fecha_hora_visita', endOfDay.toISOString())
        .order('fecha_hora_visita', { ascending: true })

      const fechaTexto = formatDateInTz(now, timezone, locale)

      if ((calls && calls.length > 0) || (visits && visits.length > 0)) {
        console.log(`Sending notification to ${prof.nombre} ${prof.apellido} (TZ: ${timezone})`)

        const emailTo = prof.email_contacto
        if (!emailTo) {
          console.log(`No email address for ${prof.nombre} ${prof.apellido}`)
          continue
        }

        try {
          await resend.emails.send({
            from: 'Sistema de Salud <notifications@resend.dev>',
            to: [emailTo],
            subject: `Agenda del día ${fechaTexto}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #217BF4;">Hola ${prof.nombre} ${prof.apellido}</h2>
                <p style="color: #666;">Aquí está tu agenda para ${fechaTexto}:</p>

                ${calls && calls.length > 0 ? `
                  <div style="margin: 20px 0;">
                    <h3 style="color: #217BF4;">📞 Llamadas (${calls.length}):</h3>
                    <ul style="list-style: none; padding: 0;">
                      ${calls.map((call: any, index: number) => {
                        const time = formatTimeInTz(new Date(call.fecha_agendada), timezone, locale)
                        return `<li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 5px;">
                          ${index + 1}. ${time} - ${call.pacientes?.nombre} ${call.pacientes?.apellido}
                        </li>`
                      }).join('')}
                    </ul>
                  </div>
                ` : ''}

                ${visits && visits.length > 0 ? `
                  <div style="margin: 20px 0;">
                    <h3 style="color: #217BF4;">🏥 Visitas (${visits.length}):</h3>
                    <ul style="list-style: none; padding: 0;">
                      ${visits.map((visit: any, index: number) => {
                        const time = formatTimeInTz(new Date(visit.fecha_hora_visita), timezone, locale)
                        const tipo = visit.tipo_visita === 'domicilio' ? '🏠 Domicilio' : '🏥 Consultorio'
                        return `<li style="padding: 10px; background: #f5f5f5; margin: 5px 0; border-radius: 5px;">
                          ${index + 1}. ${time} ${tipo} - ${visit.pacientes?.nombre} ${visit.pacientes?.apellido}
                        </li>`
                      }).join('')}
                    </ul>
                  </div>
                ` : ''}

                <p style="color: #999; margin-top: 30px; font-size: 12px;">
                  Mensaje automático del Sistema de Seguimiento de Pacientes
                </p>
              </div>
            `,
          })
          console.log(`Email sent to ${emailTo}`)
        } catch (error) {
          console.error(`Failed to send email to ${emailTo}:`, error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily agenda notifications processed',
        professionalsNotified: professionals?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error) {
    console.error('Error processing notifications:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
