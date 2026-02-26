-- =============================================
-- SQL PARA SUPABASE — By Marcelo Medeiros ERP
-- Execute no SQL Editor do Supabase
-- =============================================

-- -----------------------------------------------
-- TABELA: financial_entries (Módulo Financeiro)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('ENTRADA', 'SAIDA')),
  descricao text NOT NULL,
  valor numeric(12, 2) NOT NULL CHECK (valor > 0),
  categoria text NOT NULL DEFAULT 'OUTRO' CHECK (categoria IN ('VENDA', 'FACCAO', 'INSUMO', 'DESPESA', 'OUTRO')),
  data date NOT NULL,
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- RLS (Segurança por usuário autenticado)
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem ver lançamentos" ON public.financial_entries;
CREATE POLICY "Usuários autenticados podem ver lançamentos"
  ON public.financial_entries FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir lançamentos" ON public.financial_entries;
CREATE POLICY "Usuários autenticados podem inserir lançamentos"
  ON public.financial_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar lançamentos" ON public.financial_entries;
CREATE POLICY "Usuários autenticados podem deletar lançamentos"
  ON public.financial_entries FOR DELETE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar lançamentos" ON public.financial_entries;
CREATE POLICY "Usuários autenticados podem atualizar lançamentos"
  ON public.financial_entries FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Índice para busca por data
CREATE INDEX IF NOT EXISTS idx_financial_entries_data ON public.financial_entries (data DESC);
CREATE INDEX IF NOT EXISTS idx_financial_entries_tipo ON public.financial_entries (tipo);

-- -----------------------------------------------
-- TABELA: suppliers (Módulo Fornecedores)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cnpj_cpf text,
  contato text,
  email text,
  cidade text,
  estado text,
  produto text,
  observacao text,
  avaliacao integer DEFAULT 5 CHECK (avaliacao BETWEEN 1 AND 5),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários autenticados podem ver fornecedores" ON public.suppliers;
CREATE POLICY "Usuários autenticados podem ver fornecedores"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem inserir fornecedores" ON public.suppliers;
CREATE POLICY "Usuários autenticados podem inserir fornecedores"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fornecedores" ON public.suppliers;
CREATE POLICY "Usuários autenticados podem atualizar fornecedores"
  ON public.suppliers FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários autenticados podem deletar fornecedores" ON public.suppliers;
CREATE POLICY "Usuários autenticados podem deletar fornecedores"
  ON public.suppliers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_suppliers_nome ON public.suppliers (nome);
CREATE INDEX IF NOT EXISTS idx_suppliers_ativo ON public.suppliers (ativo);

-- -----------------------------------------------
-- TABELA: colecoes (Módulo Campanhas)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.colecoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  data_inicio date,
  data_termino date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.colecoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total colecoes" ON public.colecoes;
CREATE POLICY "Acesso total colecoes" ON public.colecoes FOR ALL USING (auth.role() = 'authenticated');

-- -----------------------------------------------
-- TABELA: compras_campanha (Módulo Campanhas)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.compras_campanha (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE,
  colecao_id uuid REFERENCES public.colecoes(id) ON DELETE CASCADE,
  referencia text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0,
  valor_total numeric(12, 2) DEFAULT 0,
  data_compra date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.compras_campanha ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total compras_campanha" ON public.compras_campanha;
CREATE POLICY "Acesso total compras_campanha" ON public.compras_campanha FOR ALL USING (auth.role() = 'authenticated');

-- -----------------------------------------------
-- EVOLUÇÃO DE TABELAS EXISTENTES
-- -----------------------------------------------

-- Adicionar valor_por_peca em cortes se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cortes' AND column_name='valor_por_peca') THEN
    ALTER TABLE public.cortes ADD COLUMN valor_por_peca numeric(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Adicionar meta_vendas em colecoes se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='colecoes' AND column_name='meta_vendas') THEN
    ALTER TABLE public.colecoes ADD COLUMN meta_vendas numeric(12, 2) DEFAULT 0;
  END IF;
END $$;

-- -----------------------------------------------
-- VERIFICAÇÃO FINAL
-- -----------------------------------------------
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('financial_entries', 'suppliers', 'colecoes', 'compras_campanha', 'cortes')
ORDER BY table_name;
