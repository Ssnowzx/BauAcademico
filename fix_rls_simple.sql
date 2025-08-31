-- ========================================
-- SCRIPT SIMPLES PARA CORRIGIR POLÍTICAS RLS
-- ========================================
-- Execute este SQL no Supabase SQL Editor

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA DEBUG
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hours_log DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;

-- Storage policies
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on documents bucket" ON storage.objects;

-- 3. GARANTIR QUE O USUÁRIO ADMIN EXISTE
INSERT INTO public.users (id, username, password, is_admin)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'admin',
  '$2b$10$rOvHDzNiS9/1R8x8MkK7.OzN5zrP1NXv6zJ8cJ2M1lF5vP9Q4dN2K',
  true
) ON CONFLICT (id) DO UPDATE SET 
  username = 'admin',
  is_admin = true,
  password = '$2b$10$rOvHDzNiS9/1R8x8MkK7.OzN5zrP1NXv6zJ8cJ2M1lF5vP9Q4dN2K';

-- 4. GARANTIR QUE O BUCKET DE STORAGE EXISTE E É PÚBLICO
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. CRIAR POLÍTICAS DE STORAGE MAIS PERMISSIVAS
CREATE POLICY "Allow all operations on documents bucket" ON storage.objects
FOR ALL
TO authenticated, anon
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- 6. CORRIGIR CONSTRAINT DA CATEGORIA DOCUMENTS
-- O constraint atual só permite ('APC', 'ACE', 'RECIBO') mas o código usa 'RECIBOS'
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_category_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_category_check 
CHECK (category IN ('APC', 'ACE', 'RECIBO', 'RECIBOS'));

-- 7. ADICIONAR NOVOS CAMPOS NA TABELA DOCUMENTS
-- Adicionar campos para evento, horas e data
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS evento TEXT,
ADD COLUMN IF NOT EXISTS horas INTEGER,
ADD COLUMN IF NOT EXISTS data_evento DATE;

-- 8. CONFIGURAR BUCKET E POLÍTICAS PARA AVISOS
-- Garantir que o bucket 'avisos' existe e é público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avisos', 'avisos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remover políticas antigas de avisos
DROP POLICY IF EXISTS "aviso_images_select" ON storage.objects;
DROP POLICY IF EXISTS "aviso_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "aviso_images_update" ON storage.objects;
DROP POLICY IF EXISTS "aviso_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on avisos bucket" ON storage.objects;

-- Criar políticas permissivas para o bucket avisos
CREATE POLICY "Allow all operations on avisos bucket" ON storage.objects
FOR ALL
TO authenticated, anon
USING (bucket_id = 'avisos')
WITH CHECK (bucket_id = 'avisos');

-- ========================================
-- ESTADO: RLS DESABILITADO PARA FACILITAR DEBUG
-- ========================================
-- Agora o app deve funcionar sem erros RLS
-- Use o login: admin / admin123
-- ========================================
