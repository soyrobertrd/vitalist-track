-- Add country_code (ISO 3166-1 alpha-2) and timezone (IANA tz) to workspaces and profiles
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS timezone text;

-- Default existing workspaces to Dominican Republic (current behavior)
UPDATE public.workspaces
SET country_code = COALESCE(country_code, 'DO'),
    timezone = COALESCE(timezone, 'America/Santo_Domingo')
WHERE country_code IS NULL OR timezone IS NULL;

COMMENT ON COLUMN public.workspaces.country_code IS 'ISO 3166-1 alpha-2 country code, used for phone validation defaults';
COMMENT ON COLUMN public.workspaces.timezone IS 'IANA timezone name (e.g. America/Santo_Domingo)';
COMMENT ON COLUMN public.profiles.country_code IS 'User personal country override (optional)';
COMMENT ON COLUMN public.profiles.timezone IS 'User personal timezone override (optional)';