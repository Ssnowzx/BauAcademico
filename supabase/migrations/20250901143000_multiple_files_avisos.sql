-- Migração para suporte a múltiplos arquivos nos avisos
-- Execute no SQL Editor do Supabase

-- 1. Adicionar coluna para múltiplos arquivos (JSON array)
ALTER TABLE public.avisos ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- 2. Migrar dados existentes de file_* para o novo formato files
UPDATE public.avisos 
SET files = CASE 
  WHEN file_url IS NOT NULL THEN 
    jsonb_build_array(
      jsonb_build_object(
        'url', file_url,
        'name', COALESCE(file_name, 'arquivo'),
        'type', COALESCE(file_type, 'application/pdf'),
        'size', COALESCE(file_size, 0)
      )
    )
  ELSE 
    '[]'::jsonb 
END
WHERE files = '[]'::jsonb;

-- 3. Opcional: Remover colunas antigas após confirmar que a migração funcionou
-- (Descomente estas linhas depois de testar)
-- ALTER TABLE public.avisos DROP COLUMN IF EXISTS file_url;
-- ALTER TABLE public.avisos DROP COLUMN IF EXISTS file_name;
-- ALTER TABLE public.avisos DROP COLUMN IF EXISTS file_type;
-- ALTER TABLE public.avisos DROP COLUMN IF EXISTS file_size;

-- 4. Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'avisos' AND table_schema = 'public'
ORDER BY ordinal_position;
