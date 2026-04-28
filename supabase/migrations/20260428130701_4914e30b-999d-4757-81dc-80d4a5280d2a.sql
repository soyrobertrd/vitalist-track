REVOKE EXECUTE ON FUNCTION public.detectar_accesos_sospechosos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.detectar_accesos_sospechosos(uuid) TO authenticated;