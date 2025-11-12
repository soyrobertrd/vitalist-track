-- Script para agendar visitas masivas basadas en la próxima llamada programada
-- Reglas:
-- - Si próxima llamada es antes del 10 de diciembre 2024: +20 días
-- - Si próxima llamada es entre 10 dic 2024 y 1 ene 2025: +25 días  
-- - Si próxima llamada es desde 2 ene 2025: +30 días
-- - Todas las visitas asignadas a Juana Reyes Feliz

-- Primero, obtener el ID de Juana Reyes Feliz
DO $$
DECLARE
  juana_id UUID;
  paciente_record RECORD;
  fecha_visita TIMESTAMP;
  dias_agregar INTEGER;
BEGIN
  -- Obtener ID de Juana Reyes Feliz
  SELECT id INTO juana_id
  FROM personal_salud
  WHERE LOWER(nombre) = 'juana' 
    AND LOWER(apellido) LIKE '%reyes%feliz%'
  LIMIT 1;

  IF juana_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró a Juana Reyes Feliz en el sistema';
  END IF;

  RAISE NOTICE 'Juana Reyes Feliz ID: %', juana_id;

  -- Iterar sobre pacientes con próxima llamada programada
  FOR paciente_record IN
    SELECT 
      rl.paciente_id,
      rl.fecha_agendada,
      p.nombre,
      p.apellido
    FROM registro_llamadas rl
    INNER JOIN pacientes p ON p.id = rl.paciente_id
    WHERE rl.estado IN ('agendada', 'pendiente')
      AND rl.fecha_agendada IS NOT NULL
      AND p.status_px = 'activo'
      -- Excluir pacientes que ya tienen visita pendiente
      AND NOT EXISTS (
        SELECT 1 
        FROM control_visitas cv 
        WHERE cv.paciente_id = rl.paciente_id 
          AND cv.estado = 'pendiente'
      )
    ORDER BY rl.fecha_agendada
  LOOP
    -- Determinar días a agregar según la fecha de la llamada
    IF paciente_record.fecha_agendada < '2024-12-10'::DATE THEN
      dias_agregar := 20;
    ELSIF paciente_record.fecha_agendada >= '2024-12-10'::DATE 
      AND paciente_record.fecha_agendada < '2025-01-02'::DATE THEN
      dias_agregar := 25;
    ELSE
      dias_agregar := 30;
    END IF;

    -- Calcular fecha de la visita (llamada + días)
    fecha_visita := paciente_record.fecha_agendada + (dias_agregar || ' days')::INTERVAL;

    -- Insertar la visita
    INSERT INTO control_visitas (
      paciente_id,
      profesional_id,
      fecha_hora_visita,
      tipo_visita,
      motivo_visita,
      estado
    ) VALUES (
      paciente_record.paciente_id,
      juana_id,
      fecha_visita,
      'domicilio',
      'Visita programada automáticamente - Seguimiento post-llamada',
      'pendiente'
    );

    RAISE NOTICE 'Visita agendada para % %: Llamada el %, Visita el % (+% días)', 
      paciente_record.nombre,
      paciente_record.apellido,
      paciente_record.fecha_agendada::DATE,
      fecha_visita::DATE,
      dias_agregar;
  END LOOP;

  RAISE NOTICE 'Proceso completado exitosamente';
END $$;
