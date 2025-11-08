-- Crear trigger para auto-crear perfil cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar perfil básico con datos del usuario
  INSERT INTO public.profiles (id, nombre, apellido, email, cedula)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'cedula', '')
  );
  
  -- Asignar rol por defecto (medico)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'medico');
  
  RETURN NEW;
END;
$$;

-- Crear trigger que ejecuta la función cuando se crea un usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();