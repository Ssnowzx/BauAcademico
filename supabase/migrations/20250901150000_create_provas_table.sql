-- Migração: criar tabela 'provas' para armazenar provas e trabalhos, com RLS e políticas

-- 1) Criar tabela provas
CREATE TABLE IF NOT EXISTS public.provas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  materia text,
  nota numeric,
  tipo text,
  image_url text,
  observacao text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2) Habilitar Row Level Security
ALTER TABLE public.provas ENABLE ROW LEVEL SECURITY;

-- 3) Garantir função is_admin (idempotente)
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

-- 4) Políticas RLS para tabela provas
-- Usuários podem selecionar somente seus próprios registros
CREATE POLICY "Users can view own provas" ON public.provas
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Usuários autenticados podem inserir seus próprios registros
CREATE POLICY "Users can insert own provas" ON public.provas
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Usuários podem atualizar seus próprios registros
CREATE POLICY "Users can update own provas" ON public.provas
  FOR UPDATE USING (user_id = auth.uid()::uuid) WITH CHECK (user_id = auth.uid()::uuid);

-- Usuários podem deletar seus próprios registros
CREATE POLICY "Users can delete own provas" ON public.provas
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- Admins podem gerenciar todos os registros (SELECT/INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage provas" ON public.provas
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::uuid AND is_admin = true)
  );

-- 5) (Opcional) Índice para consultas por matéria
CREATE INDEX IF NOT EXISTS idx_provas_materia ON public.provas USING btree (lower(coalesce(materia, '')));

-- Observações:
-- - As imagens relacionadas às provas são armazenadas no bucket 'documents' (políticas do bucket já definidas em migrações anteriores).
-- - Após aplicar esta migração, atualize os tipos no cliente Supabase (se estiver usando gerador de tipos) e ajuste o frontend para reconhecer a nova tabela 'provas'.
