-- Add new zones to the zona_distrito enum type
ALTER TYPE zona_distrito ADD VALUE IF NOT EXISTS 'San Luis';
ALTER TYPE zona_distrito ADD VALUE IF NOT EXISTS 'Los Alcarrizos';
ALTER TYPE zona_distrito ADD VALUE IF NOT EXISTS 'Boca Chica';