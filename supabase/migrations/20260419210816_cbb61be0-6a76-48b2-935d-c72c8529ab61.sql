-- 1) Añadir 'recepcion' a los enums (commit antes de usarlo)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recepcion';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'recepcion';