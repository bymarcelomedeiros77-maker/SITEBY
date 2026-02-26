-- 1. Criar tabela de Coleções
CREATE TABLE IF NOT EXISTS colecoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    ativa BOOLEAN DEFAULT true,
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar coluna data_cadastro à tabela de clientes (se não existir)
-- Nota: O campo createdAt no frontend mapeia para created_at ou data_cadastro
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Criar tabela de Compras por Campanha (Lançamentos)
CREATE TABLE IF NOT EXISTS compras_campanha (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    colecao_id UUID REFERENCES colecoes(id) ON DELETE CASCADE,
    referencia TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0,
    opcoes JSONB, -- Para cores e tamanhos ex: {"cores": ["Azul"], "tamanhos": ["P", "M"]}
    valor_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    data_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS (Opcional, mas recomendado)
ALTER TABLE colecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_campanha ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas básicas de acesso (ajuste conforme necessário)
CREATE POLICY "Allow all for authenticated users on colecoes" ON colecoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users on compras_campanha" ON compras_campanha FOR ALL TO authenticated USING (true);

-- 6. Inserir uma coleção de exemplo (opcional)
-- INSERT INTO colecoes (nome, ativa) VALUES ('Lançamento Inverno 2024', true);

-- 7. Adicionar suporte a múltiplas imagens no catálogo de produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS imagens text[] DEFAULT '{}';
