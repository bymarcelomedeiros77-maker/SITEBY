-- Adiciona campos para integração com Vesti na tabela clientes
-- Execute este comando no SQL Editor do Supabase

ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS vesti_id TEXT, -- ID único do cliente na Vesti para vínculo
ADD COLUMN IF NOT EXISTS rg_ie TEXT, -- RG ou Inscrição Estadual
ADD COLUMN IF NOT EXISTS site TEXT,
ADD COLUMN IF NOT EXISTS data_cadastro_vesti TIMESTAMP WITH TIME ZONE;

-- Cria índice para busca rápida por vesti_id
CREATE INDEX IF NOT EXISTS idx_clientes_vesti_id ON clientes(vesti_id);
