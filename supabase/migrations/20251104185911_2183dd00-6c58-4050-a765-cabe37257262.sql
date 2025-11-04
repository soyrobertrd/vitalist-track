-- Agregar campo sexo a pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sexo TEXT;

-- Agregar campo foto_url a pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Agregar campo foto_url a profiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS foto_url TEXT;