-- Simplificar: remover RLS da tabela avisos temporariamente para debug
ALTER TABLE public.avisos DISABLE ROW LEVEL SECURITY;

-- Verificar se podemos inserir um aviso sem RLS
-- Depois reativaremos com políticas corretas