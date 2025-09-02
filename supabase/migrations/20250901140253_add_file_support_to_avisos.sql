-- Adicionar suporte a arquivos (PDF, TXT) na tabela avisos
ALTER TABLE public.avisos ADD COLUMN file_url TEXT;
ALTER TABLE public.avisos ADD COLUMN file_name TEXT;
ALTER TABLE public.avisos ADD COLUMN file_type TEXT;
ALTER TABLE public.avisos ADD COLUMN file_size INTEGER;
