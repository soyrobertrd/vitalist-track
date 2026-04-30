
-- Enums
DO $$ BEGIN
  CREATE TYPE public.origen_lead AS ENUM ('web','referido','redes','publicidad','otro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_lead AS ENUM ('nuevo','contactado','calificado','propuesta','ganado','perdido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.estado_campana AS ENUM ('borrador','activa','pausada','finalizada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.tipo_interaccion_crm AS ENUM ('llamada','email','reunion','whatsapp','nota');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Leads
CREATE TABLE public.leads_crm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  numero text UNIQUE,
  nombre text NOT NULL,
  telefono text,
  email text,
  origen origen_lead NOT NULL DEFAULT 'otro',
  estado estado_lead NOT NULL DEFAULT 'nuevo',
  valor_estimado numeric(12,2) DEFAULT 0,
  asignado_a uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads_crm ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage leads_crm" ON public.leads_crm
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER update_leads_crm_ts BEFORE UPDATE ON public.leads_crm
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generar_numero_lead()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_year text; v_count int;
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    v_year := to_char(now(), 'YYYY');
    SELECT COUNT(*) + 1 INTO v_count FROM public.leads_crm WHERE numero LIKE 'LEAD-' || v_year || '-%';
    NEW.numero := 'LEAD-' || v_year || '-' || LPAD(v_count::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_numero_lead BEFORE INSERT ON public.leads_crm
  FOR EACH ROW EXECUTE FUNCTION public.generar_numero_lead();

-- Campañas
CREATE TABLE public.campanas_marketing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'email',
  estado estado_campana NOT NULL DEFAULT 'borrador',
  fecha_inicio date,
  fecha_fin date,
  presupuesto numeric(12,2) DEFAULT 0,
  leads_generados integer DEFAULT 0,
  conversiones integer DEFAULT 0,
  descripcion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campanas_marketing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage campanas_marketing" ON public.campanas_marketing
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER update_campanas_marketing_ts BEFORE UPDATE ON public.campanas_marketing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Interacciones
CREATE TABLE public.interacciones_crm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads_crm(id) ON DELETE CASCADE NOT NULL,
  tipo tipo_interaccion_crm NOT NULL DEFAULT 'nota',
  descripcion text,
  fecha timestamptz NOT NULL DEFAULT now(),
  resultado text,
  siguiente_accion text,
  siguiente_fecha date,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interacciones_crm ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws members manage interacciones_crm" ON public.interacciones_crm
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leads_crm l
    WHERE l.id = interacciones_crm.lead_id
      AND public.is_workspace_member(auth.uid(), l.workspace_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.leads_crm l
    WHERE l.id = interacciones_crm.lead_id
      AND public.is_workspace_member(auth.uid(), l.workspace_id)
  ));
