-- Crear tabla de auditoría para unificaciones de pacientes
CREATE TABLE IF NOT EXISTS public.auditoria_unificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_principal_id uuid NOT NULL,
  pacientes_eliminados_ids uuid[] NOT NULL,
  datos_unificados jsonb NOT NULL DEFAULT '{}'::jsonb,
  realizado_por uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.auditoria_unificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins can view audit log"
ON public.auditoria_unificaciones
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert audit log"
ON public.auditoria_unificaciones
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Índices para mejorar rendimiento
CREATE INDEX idx_auditoria_paciente_principal ON public.auditoria_unificaciones(paciente_principal_id);
CREATE INDEX idx_auditoria_realizado_por ON public.auditoria_unificaciones(realizado_por);
CREATE INDEX idx_auditoria_created_at ON public.auditoria_unificaciones(created_at DESC);