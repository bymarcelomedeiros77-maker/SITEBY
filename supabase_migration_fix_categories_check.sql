-- Migração para corrigir a constraint de categorias de clientes
-- Execute este comando no SQL Editor do seu Supabase para permitir as novas categorias

-- 1. Remover a constraint antiga (se existir)
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_categoria_check;

-- 2. Garantir que os dados atuais não quebrem a nova constraint
-- (Caso existam dados que não batem com os novos valores, eles serão resetados para 'CLIENTE_NOVO')
UPDATE clientes 
SET categoria = 'CLIENTE_NOVO' 
WHERE categoria NOT IN ('DIAMANTE', 'OURO', 'PRATA', 'BRONZE', 'INATIVO_90', 'INATIVO_8M', 'NUNCA_COMPROU', 'CLIENTE_NOVO', 'VAREJO');

-- 3. Adicionar a nova constraint com todos os valores suportados
ALTER TABLE clientes 
ADD CONSTRAINT clientes_categoria_check 
CHECK (categoria IN ('DIAMANTE', 'OURO', 'PRATA', 'BRONZE', 'INATIVO_90', 'INATIVO_8M', 'NUNCA_COMPROU', 'CLIENTE_NOVO', 'VAREJO'));

-- 4. Garantir que o valor padrão da coluna seja 'CLIENTE_NOVO'
ALTER TABLE clientes ALTER COLUMN categoria SET DEFAULT 'CLIENTE_NOVO';

-- 5. Comentário Informativo
COMMENT ON COLUMN clientes.categoria IS 'Categorias permitidas: DIAMANTE, OURO, PRATA, BRONZE, INATIVO_90, INATIVO_8M, NUNCA_COMPROU, CLIENTE_NOVO, VAREJO';
