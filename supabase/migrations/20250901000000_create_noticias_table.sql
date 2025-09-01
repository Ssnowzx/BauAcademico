-- Migração: criar tabela noticias e configurar RLS

-- 1) Criar tabela noticias
CREATE TABLE IF NOT EXISTS public.noticias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2) Habilitar RLS na tabela noticias
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

-- 3) Garantir função is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = user_id AND u.is_admin = true
  );
END;
$$;

-- 4) Políticas RLS para tabela noticias
CREATE POLICY "Public read access to noticias" ON public.noticias
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert into noticias" ON public.noticias
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update noticias" ON public.noticias
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete noticias" ON public.noticias
  FOR DELETE USING (public.is_admin());

-- 5) Configurar políticas de storage para bucket 'noticias'
-- Habilitar RLS em storage.objects se necessário
DO $$
BEGIN
  ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN SQLSTATE '42501' THEN
  NULL; -- Ignora se não tiver permissão
END;
$$;

-- Remover políticas antigas do bucket noticias
DROP POLICY IF EXISTS "Public view noticias objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload noticias objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update noticias objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete noticias objects" ON storage.objects;
DROP POLICY IF EXISTS "Temp allow auth inserts noticias" ON storage.objects;

-- Criar políticas de storage para bucket noticias
CREATE POLICY "Public view noticias objects" ON storage.objects
  FOR SELECT USING (bucket_id = 'noticias');

CREATE POLICY "Admins can upload noticias objects" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'noticias' AND public.is_admin());

CREATE POLICY "Admins can update noticias objects" ON storage.objects
  FOR UPDATE USING (bucket_id = 'noticias' AND public.is_admin());

CREATE POLICY "Admins can delete noticias objects" ON storage.objects
  FOR DELETE USING (bucket_id = 'noticias' AND public.is_admin());
