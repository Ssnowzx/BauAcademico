-- Script para testar se a migração de múltiplos arquivos foi aplicada

-- 1. Verificar se a coluna files existe
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'avisos' 
AND table_schema = 'public'
AND column_name = 'files';

-- 2. Verificar estrutura completa da tabela avisos
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'avisos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar alguns dados de teste
SELECT 
    id,
    title,
    files,
    jsonb_array_length(COALESCE(files, '[]'::jsonb)) as files_count
FROM public.avisos 
ORDER BY created_at DESC 
LIMIT 5;
