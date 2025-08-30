-- Primeiro, vamos verificar qual é o ID do usuário admin atual
UPDATE public.users 
SET id = '00000000-0000-0000-0000-000000000001'
WHERE username = 'admin' AND id != '00000000-0000-0000-0000-000000000001';

-- Garantir que existe um usuário admin com ID fixo
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

-- Alternativa: criar políticas mais simples que não dependem de UUIDs específicos
DROP POLICY IF EXISTS "avisos_insert_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_update_admin" ON public.avisos;
DROP POLICY IF EXISTS "avisos_delete_admin" ON public.avisos;

-- Políticas RLS mais robustas
CREATE POLICY "avisos_insert_admin" ON public.avisos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "avisos_update_admin" ON public.avisos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "avisos_delete_admin" ON public.avisos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );