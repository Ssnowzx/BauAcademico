-- Migration: adicionar coluna 'tipo' em public.provas e criar/ajustar policies para public.provas e storage.objects
-- ATENÇÃO: execute este arquivo no SQL Editor do Supabase com a opção "Run as owner" para aplicar políticas em storage.objects
-- Caso não execute como owner, as statements relacionadas a storage.objects podem falhar; os blocos DO $$ ... EXCEPTION capturam erros de permissão e emitem NOTICE.

-- ==================================================================
-- 1) Garantir colunas necessárias em public.provas
-- ==================================================================
ALTER TABLE public.provas
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS observacao text;

-- Habilitar RLS na tabela provas
ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas (idempotente)
DROP POLICY IF EXISTS "provas_insert_auth_user" ON public.provas;
DROP POLICY IF EXISTS "provas_select_owner" ON public.provas;
DROP POLICY IF EXISTS "provas_update_owner" ON public.provas;
DROP POLICY IF EXISTS "provas_delete_owner" ON public.provas;

-- Criar policies para public.provas (dono = user_id) com verificação extra
CREATE POLICY "provas_insert_auth_user" ON public.provas
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "provas_select_owner" ON public.provas
  FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "provas_update_owner" ON public.provas
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'authenticated' 
    AND auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "provas_delete_owner" ON public.provas
  FOR DELETE
  USING (
    auth.role() = 'authenticated' 
    AND auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- ==================================================================
-- 2) Storage: aplicar RLS e policies para bucket 'documents' (tenta com captura de erro se não for owner)
-- ==================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    -- Habilita RLS em storage.objects (pode requerer owner)
    BEGIN
      EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';
    EXCEPTION WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Skipping ALTER TABLE storage.objects: not owner (SQLSTATE 42501)';
    END;

    -- Remover policies antigas (se existirem)
    BEGIN
      EXECUTE 'DROP POLICY IF EXISTS "allow_insert_documents_bucket" ON storage.objects';
      EXECUTE 'DROP POLICY IF EXISTS "allow_select_documents_bucket" ON storage.objects';
      EXECUTE 'DROP POLICY IF EXISTS "allow_update_documents_by_owner" ON storage.objects';
      EXECUTE 'DROP POLICY IF EXISTS "allow_delete_documents_by_owner" ON storage.objects';
    EXCEPTION WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Skipping DROP POLICY on storage.objects: not owner (SQLSTATE 42501)';
    END;

    -- Criar policy para INSERT no bucket 'documents'
    BEGIN
      EXECUTE $sql$
        CREATE POLICY "allow_insert_documents_bucket" ON storage.objects
        FOR INSERT
        WITH CHECK (
          auth.role() = 'authenticated' 
          AND auth.uid() IS NOT NULL 
          AND bucket_id = 'documents' 
          AND owner = auth.uid()
        );
      $sql$;
    EXCEPTION WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Skipping CREATE POLICY allow_insert_documents_bucket: not owner (SQLSTATE 42501)';
    END;

    -- Criar policy para SELECT no bucket 'documents'
    BEGIN
      EXECUTE $sql$
        CREATE POLICY "allow_select_documents_bucket" ON storage.objects
        FOR SELECT
        USING (
          auth.role() = 'authenticated' 
          AND auth.uid() IS NOT NULL 
          AND bucket_id = 'documents' 
          AND owner = auth.uid()
        );
      $sql$;
    EXCEPTION WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Skipping CREATE POLICY allow_select_documents_bucket: not owner (SQLSTATE 42501)';
    END;

    -- Criar policy para UPDATE no bucket 'documents' (apenas pelo owner)
    BEGIN
      EXECUTE $sql$
        CREATE POLICY "allow_update_documents_by_owner" ON storage.objects
        FOR UPDATE
        USING (
          auth.role() = 'authenticated' 
          AND auth.uid() IS NOT NULL 
          AND bucket_id = 'documents' 
          AND owner = auth.uid()
        )
        WITH CHECK (true);
      $sql$;
    EXCEPTION WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Skipping CREATE POLICY allow_update_documents_by_owner: not owner (SQLSTATE 42501)';
    END;

    -- Criar policy para DELETE no bucket 'documents' (apenas pelo owner)
    BEGIN
      EXECUTE $sql$
        CREATE POLICY "allow_delete_documents_by_owner" ON storage.objects
        FOR DELETE
        USING (
          auth.role() = 'authenticated' 
          AND auth.uid() IS NOT NULL 
          AND bucket_id = 'documents' 
          AND owner = auth.uid()
        );
      $sql$;
    EXCEPTION WHEN SQLSTATE '42501' THEN
      RAISE NOTICE 'Skipping CREATE POLICY allow_delete_documents_by_owner: not owner (SQLSTATE 42501)';
    END;

  END IF;
END
$$;

-- ==================================================================
-- 3) Observações finais
-- ==================================================================
-- - Execute este arquivo com "Run as owner" no SQL Editor do Supabase para garantir que as policies de storage sejam aplicadas.
-- - Após aplicar a migration, vá em Dashboard → API → Refresh schema para atualizar o cache do PostgREST.
-- - Verifique se as colunas (tipo, image_url) aparecem no Table Editor antes de testar o cliente.
-- - Não exponha service_role keys no cliente; usuários devem usar a key pública + autenticação.

-- FIM
