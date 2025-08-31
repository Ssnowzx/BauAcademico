-- ========================================
-- SCRIPT PARA MANTER O ESTADO ATUAL DO BANCO EXATAMENTE COMO ESTÁ
-- ========================================
-- IMPORTANTE: Execute este SQL no Supabase SQL Editor

-- 1. TABELA USERS - MANTER POLÍTICAS ORIGINAIS
-- As políticas originais da primeira migração são:
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Recriar as políticas ORIGINAIS (não as novas que você propôs)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (id = auth.uid()::uuid);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (id = auth.uid()::uuid);

-- 2. TABELA DOCUMENTS - MANTER POLÍTICAS ORIGINAIS
-- As políticas originais da primeira migração são:
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

-- Recriar as políticas ORIGINAIS (não as novas que você propôs)
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- 3. TABELA AVISOS - ESTADO ATUAL (RLS DESABILITADO)
-- De acordo com a última migração, o RLS está desabilitado
ALTER TABLE public.avisos DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas de avisos (pois RLS está desabilitado)
DROP POLICY IF EXISTS "avisos_select_all" ON public.avisos;
DROP POLICY IF EXISTS "avisos_insert_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_update_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_delete_admin" ON public.avisos;
DROP POLICY IF EXISTS "Anyone can view avisos" ON public.avisos;
DROP POLICY IF EXISTS "Only admins can insert avisos" ON public.avisos;
DROP POLICY IF EXISTS "Only admins can update avisos" ON public.avisos;
DROP POLICY IF EXISTS "Only admins can delete avisos" ON public.avisos;

-- 4. GARANTIR QUE USUÁRIO ADMIN EXISTE COM ID FIXO
-- (Como definido nas migrações recentes)
UPDATE public.users 
SET id = '00000000-0000-0000-0000-000000000001'
WHERE username = 'admin' AND id != '00000000-0000-0000-0000-000000000001';

INSERT INTO public.users (id, username, password, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  '$2b$10$rOvHDzNiS9/1R8x8MkK7.OzN5zrP1NXv6zJ8cJ2M1lF5vP9Q4dN2K',
  true
) ON CONFLICT (id) DO UPDATE SET 
  username = 'admin',
  is_admin = true;

-- Remover duplicatas se existirem
DELETE FROM public.users 
WHERE username = 'admin' AND id != '00000000-0000-0000-0000-000000000001';

-- 5. GARANTIR QUE USUÁRIO ADMIN EXISTE NO AUTH
-- (Versão simplificada compatível com esquema atual do Supabase)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmed_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  '00000000-0000-0000-0000-000000000001@proofchest.local',
  crypt('00000000-0000-0000-0000-000000000001', gen_salt('bf')),
  NOW(),
  '{}',
  '{"user_id": "00000000-0000-0000-0000-000000000001"}',
  FALSE,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  confirmed_at = EXCLUDED.confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 6. STORAGE POLICIES - MANTER POLÍTICAS ORIGINAIS
-- Garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Remover todas as policies possíveis de storage
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Recriar as políticas ORIGINAIS de storage
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. GARANTIR QUE RLS ESTÁ HABILITADO NAS TABELAS CORRETAS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours_log ENABLE ROW LEVEL SECURITY;
-- avisos já está DISABLE conforme estado atual

-- 8. VERIFICAR SE A FUNÇÃO is_admin EXISTE (CONFORME MIGRAÇÃO ANTERIOR)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Se não há usuário autenticado, retornar false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o usuário é admin
  RETURN EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = user_id AND u.is_admin = true
  );
END;
$$;

-- ========================================
-- ESTADO RESTAURADO: EXATAMENTE COMO ESTÁ ATUALMENTE
-- ========================================
-- - Tabela avisos: RLS DESABILITADO (sem políticas)
-- - Tabelas users/documents: Políticas originais simples
-- - Admin com ID fixo: '00000000-0000-0000-0000-000000000001'
-- - Storage com políticas originais
-- ========================================
