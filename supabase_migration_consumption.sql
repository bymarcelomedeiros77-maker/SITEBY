CREATE TABLE IF NOT EXISTS public.regras_consumo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referencia TEXT NOT NULL,
    tamanho_id UUID REFERENCES public.tamanhos(id),
    consumo_unitario NUMERIC NOT NULL DEFAULT 0,
    tecido_nome TEXT,
    tecido_composicao TEXT,
    tecido_largura TEXT,
    tecido_fornecedor TEXT,
    tecido_custo NUMERIC DEFAULT 0,
    acessorios TEXT,
    usuario_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups by reference
CREATE INDEX IF NOT EXISTS idx_regras_consumo_referencia ON public.regras_consumo(referencia);

-- Enable RLS
ALTER TABLE public.regras_consumo ENABLE ROW LEVEL SECURITY;

-- Simple policy for authenticated users
CREATE POLICY "Allow all actions for authenticated users" ON public.regras_consumo
    FOR ALL USING (auth.role() = 'authenticated');
