-- Add currency_code to workspaces for multi-country invoicing
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'DOP';

-- Backfill existing workspaces based on country_code
UPDATE public.workspaces
SET currency_code = CASE
  WHEN country_code = 'DO' THEN 'DOP'
  WHEN country_code = 'US' THEN 'USD'
  WHEN country_code = 'MX' THEN 'MXN'
  WHEN country_code = 'CO' THEN 'COP'
  WHEN country_code = 'AR' THEN 'ARS'
  WHEN country_code = 'CL' THEN 'CLP'
  WHEN country_code = 'PE' THEN 'PEN'
  WHEN country_code = 'ES' THEN 'EUR'
  WHEN country_code = 'GT' THEN 'GTQ'
  WHEN country_code = 'PA' THEN 'USD'
  WHEN country_code = 'CR' THEN 'CRC'
  WHEN country_code = 'EC' THEN 'USD'
  WHEN country_code = 'SV' THEN 'USD'
  WHEN country_code = 'HN' THEN 'HNL'
  WHEN country_code = 'NI' THEN 'NIO'
  WHEN country_code = 'PY' THEN 'PYG'
  WHEN country_code = 'UY' THEN 'UYU'
  WHEN country_code = 'BO' THEN 'BOB'
  WHEN country_code = 'VE' THEN 'VES'
  WHEN country_code = 'PR' THEN 'USD'
  ELSE COALESCE(currency_code, 'DOP')
END
WHERE currency_code IS NULL OR currency_code = 'DOP';