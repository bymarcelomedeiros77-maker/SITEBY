-- Migração para adicionar campo de arquivo (Base64)
-- Execute este comando no SQL Editor do seu Supabase

ALTER TABLE fichas_tecnicas
ADD COLUMN IF NOT EXISTS arquivo_data TEXT; -- Armazena o Base64 do arquivo
