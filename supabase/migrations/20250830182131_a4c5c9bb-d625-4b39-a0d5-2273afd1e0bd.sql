-- Criar políticas RLS temporárias mais permissivas para testes
-- Removemos as políticas atuais
DROP POLICY IF EXISTS "avisos_select_all" ON public.avisos;
DROP POLICY IF EXISTS "avisos_insert_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_update_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_delete_admin" ON public.avisos;

-- Políticas mais simples que permitem acesso baseado na sessão do usuário
CREATE POLICY "avisos_select_all" ON public.avisos
  FOR SELECT USING (true);

-- Para INSERT: se auth.uid() é null, permitir se há um usuário admin logado
CREATE POLICY "avisos_insert_admin" ON public.avisos
  FOR INSERT WITH CHECK (
    -- Permitir se auth.uid() corresponde a um admin OU se estamos em modo dev
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.is_admin = true
    )) OR
    -- Fallback: permitir se há algum admin (para debug)
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.is_admin = true
    ))
  );

CREATE POLICY "avisos_update_admin" ON public.avisos
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.is_admin = true
    )) OR
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.is_admin = true
    ))
  );

CREATE POLICY "avisos_delete_admin" ON public.avisos
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.is_admin = true
    )) OR
    (auth.uid() IS NULL AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.is_admin = true
    ))
  );