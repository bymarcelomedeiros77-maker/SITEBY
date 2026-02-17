-- Migração para criar tabela de Fichas Técnicas
-- Execute este comando no SQL Editor do seu Supabase

CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('FICHA_CORTE', 'FICHA_TECNICA', 'APONTAMENTO')),
    conteudo JSONB DEFAULT '[]'::jsonb, -- Armazena os dados do Excel convertido em JSON
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Segurança)
ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificadas para este caso de uso)
CREATE POLICY "Allow public read on fichas_tecnicas" ON fichas_tecnicas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on fichas_tecnicas" ON fichas_tecnicas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on fichas_tecnicas" ON fichas_tecnicas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on fichas_tecnicas" ON fichas_tecnicas FOR DELETE USING (true);
