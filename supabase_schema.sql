-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. PERMISSÕES E SEGURANÇA (Habilitando RLS para proteção total)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS faccoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cortes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS defect_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS logs ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Segurança (Row Level Security)
-- Permitir leitura pública para usuários autenticados (ou anon para este app simples, mas com RLS ativo)
-- NOTA: Em produção real, refine estas políticas para restringir por user_id.

CREATE POLICY "Allow public read on faccoes" ON faccoes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on faccoes" ON faccoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on faccoes" ON faccoes FOR UPDATE USING (true);

CREATE POLICY "Allow public read on cortes" ON cortes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on cortes" ON cortes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on cortes" ON cortes FOR UPDATE USING (true);

CREATE POLICY "Allow public read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read on defect_types" ON defect_types FOR SELECT USING (true);
CREATE POLICY "Allow public read on metas" ON metas FOR SELECT USING (true);
CREATE POLICY "Allow public read on logs" ON logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on logs" ON logs FOR INSERT WITH CHECK (true);

-- 1. Tabela USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    avatar TEXT,
    password TEXT, -- Note: In production, use Supabase Auth instead of storing passwords directly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela FACCOES
CREATE TABLE IF NOT EXISTS faccoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ATIVO',
    phone TEXT,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIMPEZA DE DUPLICATAS (Executar antes de criar a constraint)
DELETE FROM faccoes
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (partition BY name ORDER BY created_at ASC) as rnum
        FROM faccoes
    ) t
    WHERE t.rnum > 1
);

-- Adicionar Constraint de Unicidade (Para garantir que não duplique mais)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'faccoes_name_key') THEN
        ALTER TABLE faccoes ADD CONSTRAINT faccoes_name_key UNIQUE (name);
    END IF;
END $$;

-- 3. Tabela CORTES
CREATE TABLE IF NOT EXISTS cortes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referencia TEXT NOT NULL,
    faccao_id UUID REFERENCES faccoes(id),
    data_envio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_recebimento TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL,
    qtd_total_enviada INTEGER NOT NULL DEFAULT 0,
    qtd_total_recebida INTEGER DEFAULT 0,
    qtd_total_defeitos INTEGER DEFAULT 0,
    observacoes_envio TEXT,
    observacoes_recebimento TEXT,
    itens JSONB DEFAULT '[]'::jsonb, -- Armazena a lista de cores e grade
    defeitos_por_tipo JSONB DEFAULT '{}'::jsonb, -- Armazena o contador de defeitos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ... (User Insertions remain same) ...

-- Facções (Inserindo com proteção contra duplicatas)
INSERT INTO faccoes (name, status, phone, observations) VALUES
('Flávia', 'ATIVO', '', ''),
('Joelma', 'ATIVO', '', ''),
('Gabrielly', 'ATIVO', '', ''),
('Carla', 'ATIVO', '', ''),
('Vitória', 'ATIVO', '', ''),
('Clecia', 'ATIVO', '', ''),
('Kelly', 'ATIVO', '', ''),
('Giselly', 'ATIVO', '', ''),
('Edvania', 'ATIVO', '', ''),
('Mayra', 'ATIVO', '', ''),
('Elaine', 'ATIVO', '', ''),
('Daiane', 'ATIVO', '', ''),
('Bruna', 'ATIVO', '', ''),
('Aparecida', 'ATIVO', '', ''),
('Dulce', 'INATIVO', '', '')
ON CONFLICT (name) DO NOTHING;

-- Defeitos
-- 4. Tabela DEFECT_TYPES (Se não existir, crie aqui ou verifique se já foi criada acima. Vou assumir que falta a criação se não estiver no bloco inicial)
CREATE TABLE IF NOT EXISTS defect_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIMPEZA DE DUPLICATAS EM DEFEITOS (Executar antes de criar a constraint)
DELETE FROM defect_types
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (partition BY name ORDER BY created_at ASC) as rnum
        FROM defect_types
    ) t
    WHERE t.rnum > 1
);

-- Adicionar Constraint de Unicidade em defect_types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'defect_types_name_key') THEN
        ALTER TABLE defect_types ADD CONSTRAINT defect_types_name_key UNIQUE (name);
    END IF;
END $$;

-- Defeitos (Inserindo com proteção)
INSERT INTO defect_types (name, category) VALUES
('Costura torta', 'COSTURA'),
('Ponto estourado', 'COSTURA'),
('Ponto folgado (interlock)', 'COSTURA'),
('Costura aberta lateral', 'COSTURA'),
('Costura solta no abanhado', 'COSTURA'),
('Costura Solta cintura', 'COSTURA'),
('Pico de costura na frente', 'COSTURA'),
('Encontro de custuras (ziper)', 'COSTURA'),
('Acabamento da custura mal feito', 'ACABAMENTO'),
('Abanhado', 'ACABAMENTO'),
('Remate do ziper', 'ACABAMENTO'),
('Recorte do bolso', 'ACABAMENTO'),
('Presponto', 'ACABAMENTO'),
('Presponto Elastico', 'ACABAMENTO'),
('Foro sem Interlork', 'ACABAMENTO'),
('Sem Foro', 'ACABAMENTO'),
('Com cola para refazer', 'ACABAMENTO'),
('Tamanho fora do padrao', 'MEDIDAS'),
('Lateral estourado (interlock)', 'ESTRUTURA'),
('Cós estourado ou comido', 'ESTRUTURA'),
('Frente estourado', 'ESTRUTURA'),
('Prega no ziper (final)', 'ESTRUTURA'),
('Ziper ondulado', 'ESTRUTURA'),
('Prega na cintura', 'ESTRUTURA'),
('Pregas', 'ESTRUTURA'),
('Gola', 'ESTRUTURA'),
('Defeito na Manga', 'ESTRUTURA'),
('Mancha no tecido', 'TECIDO'),
('Peça cortada (pelo)', 'TECIDO'),
('Falha no tecido para refazer', 'TECIDO'),
('Defeito no tecido', 'TECIDO'),
('Tecidos misturados', 'TECIDO'),
('Elastecs', 'AVIAMENTOS'),
('Sem Elastico', 'AVIAMENTOS')
ON CONFLICT (name) DO NOTHING;

-- Meta Padrão
INSERT INTO metas (name, max_defect_percentage, is_active)
VALUES ('Padrão 2024', 5, TRUE);
