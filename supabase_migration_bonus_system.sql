-- ====================================================================
-- MIGRATION: Add Bonus System Support
-- ====================================================================
-- Adds created_at to faccoes (if not exists) and creates bonus structure
-- ====================================================================

-- Step 1: Ensure created_at exists in faccoes table
-- (already exists in schema, but this ensures it's there)
ALTER TABLE faccoes 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Create bonifications table (for future bonus system)
CREATE TABLE IF NOT EXISTS faccao_bonifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faccao_id UUID NOT NULL REFERENCES faccoes(id) ON DELETE CASCADE,
    bonus_type TEXT NOT NULL, -- 'META_ACHIEVEMENT', 'QUALITY_EXCELLENCE', 'VOLUME_BONUS'
    amount DECIMAL(10, 2), -- Valor do bônus (se monetário)
    description TEXT, -- Descrição do bônus
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'PAID'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'CANCELLED'))
);

-- Step 3: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bonifications_faccao ON faccao_bonifications(faccao_id);
CREATE INDEX IF NOT EXISTS idx_bonifications_status ON faccao_bonifications(status);

-- Step 4: Enable RLS on bonifications table
ALTER TABLE faccao_bonifications ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies (permissive for now, refine later)
CREATE POLICY "Allow read on bonifications" ON faccao_bonifications FOR SELECT USING (true);
CREATE POLICY "Allow insert on bonifications" ON faccao_bonifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on bonifications" ON faccao_bonifications FOR UPDATE USING (true);

-- Step 6: Add comment
COMMENT ON TABLE faccao_bonifications IS 'Sistema de bonificações para facções que atingem metas de qualidade e volume';

-- ====================================================================
-- USAGE NOTES:
-- ====================================================================
-- Este sistema de bonificações está preparado mas ainda EM DESENVOLVIMENTO.
-- 
-- Funcionalidades futuras:
-- 1. Admin poderá configurar critérios de meta no painel
-- 2. Sistema calculará automaticamente se facção bateu meta
-- 3. Bonificações pendentes aparecerão para aprovação do admin
-- 4. Usuários verão apenas facções que bateram a meta (quando ativado)
--
-- Aguardando definição de regras de negócio para:
-- - Percentual de defeito alvo
-- - Volume mínimo de produção
-- - Valores de bonificação por tier
-- - Período de avaliação (mensal, trimestral, etc.)
-- ====================================================================
