-- SCRIPT DE RESET DE ESTOQUE E PEDIDOS
-- Execute no SQL Editor do Supabase para zerar os dados de movimentação e saldos.

-- 1. Remover itens e pedidos
TRUNCATE TABLE pedido_itens CASCADE;
TRUNCATE TABLE pedidos CASCADE;

-- 2. Remover movimentações e históricos
TRUNCATE TABLE movimentacoes_estoque CASCADE;
TRUNCATE TABLE devolucoes CASCADE;
TRUNCATE TABLE devolucao_itens CASCADE;
TRUNCATE TABLE ordens_producao CASCADE;

-- 3. Zerar saldos dos SKUs
UPDATE skus SET 
  saldo_disponivel = 0, 
  saldo_reservado = 0, 
  saldo_fisico = 0;

-- 4. Opcional: Resetar sequências de números (se houver serials)
-- ALTER SEQUENCE pedidos_numero_seq RESTART WITH 1;
-- ALTER SEQUENCE ordens_producao_numero_seq RESTART WITH 1;
-- ALTER SEQUENCE devolucoes_numero_seq RESTART WITH 1;
