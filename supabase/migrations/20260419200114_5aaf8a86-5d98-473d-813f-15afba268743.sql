
-- Tabla de plantillas de WhatsApp
CREATE TABLE public.plantillas_whatsapp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  categoria text NOT NULL DEFAULT 'custom',
  contenido text NOT NULL,
  destinatario_default text NOT NULL DEFAULT 'paciente',
  variables jsonb DEFAULT '[]'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plantillas_whatsapp_categoria_check CHECK (categoria IN ('recordatorio_cita','confirmacion_cita','cobro_pendiente','visita_en_camino','custom')),
  CONSTRAINT plantillas_whatsapp_destinatario_check CHECK (destinatario_default IN ('paciente','cuidador','ambos'))
);

-- Trigger updated_at
CREATE TRIGGER trg_plantillas_whatsapp_updated
  BEFORE UPDATE ON public.plantillas_whatsapp
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.plantillas_whatsapp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plantillas_wa_select_authenticated"
  ON public.plantillas_whatsapp FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "plantillas_wa_insert_admin_coord"
  ON public.plantillas_whatsapp FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "plantillas_wa_update_admin_coord"
  ON public.plantillas_whatsapp FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

CREATE POLICY "plantillas_wa_delete_admin_coord"
  ON public.plantillas_whatsapp FOR DELETE
  TO authenticated
  USING (public.is_admin_or_coordinador(auth.uid()));

-- Seed de plantillas iniciales
INSERT INTO public.plantillas_whatsapp (nombre, descripcion, categoria, contenido, destinatario_default, variables) VALUES
('Recordatorio de cita',
 'Mensaje enviado el día previo a la cita',
 'recordatorio_cita',
 'Hola {{paciente_nombre}} 👋, le recordamos su cita {{tipo_visita}} para el *{{fecha}}* a las *{{hora}}* con {{profesional_nombre}}. Por favor responda *SÍ* para confirmar o *NO* si necesita reagendar. ¡Gracias!',
 'paciente',
 '["paciente_nombre","tipo_visita","fecha","hora","profesional_nombre"]'::jsonb),

('Confirmación de cita',
 'Confirmación inmediata cuando se agenda una nueva cita',
 'confirmacion_cita',
 '✅ Cita confirmada\n\nHola {{paciente_nombre}}, su cita {{tipo_visita}} ha sido agendada:\n\n📅 *{{fecha}}*\n🕐 *{{hora}}*\n👨‍⚕️ {{profesional_nombre}}\n\nSi necesita cambios, contáctenos. ¡Lo esperamos!',
 'paciente',
 '["paciente_nombre","tipo_visita","fecha","hora","profesional_nombre"]'::jsonb),

('Cobro pendiente',
 'Aviso de factura pendiente o vencida',
 'cobro_pendiente',
 'Hola {{paciente_nombre}}, le recordamos que tiene una factura pendiente:\n\n🧾 Factura: *{{numero_factura}}*\n💰 Monto: *RD${{monto}}*\n📅 Vence: {{fecha_vencimiento}}\n\nPuede comunicarse con nosotros para coordinar el pago. ¡Gracias!',
 'paciente',
 '["paciente_nombre","numero_factura","monto","fecha_vencimiento"]'::jsonb),

('Visita en camino',
 'Aviso del profesional cuando sale rumbo al domicilio',
 'visita_en_camino',
 '🚗 ¡En camino!\n\nHola {{paciente_nombre}}, soy {{profesional_nombre}}. Salí hacia su domicilio y llego en aproximadamente *{{tiempo_estimado}} minutos*. ¡Nos vemos pronto!',
 'paciente',
 '["paciente_nombre","profesional_nombre","tiempo_estimado"]'::jsonb);
