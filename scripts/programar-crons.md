# Programación de crons (pg_cron) — Fase 4

> ⚠️ **Estos comandos NO se ejecutan automáticamente.** Cuando estés listo, copia y pega el SQL en el editor SQL del backend (Lovable Cloud → SQL Editor). El proyecto ya tiene `pg_cron` y `pg_net` disponibles en Supabase.

## Variables a reemplazar

```
PROJECT_REF = qkjjyiymzaouqslzbxrp
ANON_KEY    = <tomar de .env: VITE_SUPABASE_PUBLISHABLE_KEY>
```

## 1. Detección de accesos sospechosos — cada hora

```sql
select cron.schedule(
  'auditoria-deteccion-cron',
  '0 * * * *',
  $$
  select net.http_post(
    url:='https://qkjjyiymzaouqslzbxrp.supabase.co/functions/v1/auditoria-deteccion-cron',
    headers:='{"Content-Type":"application/json","apikey":"ANON_KEY","Authorization":"Bearer ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

## 2. Recordatorios automáticos — cada 30 minutos

```sql
select cron.schedule(
  'recordatorios-automaticos-cron',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://qkjjyiymzaouqslzbxrp.supabase.co/functions/v1/recordatorios-automaticos-cron?horas=24',
    headers:='{"Content-Type":"application/json","apikey":"ANON_KEY","Authorization":"Bearer ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

## 3. Política de retención / anonimización — diaria 03:00

```sql
select cron.schedule(
  'aplicar-retencion-cron',
  '0 3 * * *',
  $$
  select net.http_post(
    url:='https://qkjjyiymzaouqslzbxrp.supabase.co/functions/v1/aplicar-retencion-cron',
    headers:='{"Content-Type":"application/json","apikey":"ANON_KEY","Authorization":"Bearer ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

## Comprobar y desactivar

```sql
-- Ver jobs activos
select jobid, schedule, jobname from cron.job;

-- Desactivar un job
select cron.unschedule('auditoria-deteccion-cron');
```

## Monitoreo

El **Panel de Salud del Sistema** (Auditoría → pestaña *Salud*) muestra la última ejecución de cada cron, además de permitir disparar la ejecución manual desde la UI.
