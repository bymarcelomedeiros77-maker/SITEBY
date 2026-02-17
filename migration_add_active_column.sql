-- Adiciona a coluna 'active' na tabela 'users' para permitir bloqueio de acesso
-- Execute este comando no SQL Editor do Supabase

ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Opcional: Atualizar usuários existentes para estarem ativos por padrão
UPDATE users SET active = TRUE WHERE active IS NULL;
