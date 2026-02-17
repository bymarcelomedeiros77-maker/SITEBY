-- Habilita extensão UUID se não estiver habilitada
create extension if not exists "uuid-ossp";

-- 1. Clientes
create table if not exists clientes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  cidade text,
  contato text,
  status text default 'ATIVO', -- 'ATIVO', 'INATIVO'
  observacao text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Produtos / Referências
create table if not exists produtos (
  id uuid default uuid_generate_v4() primary key,
  referencia text not null unique,
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Cores
create table if not exists cores (
  id uuid default uuid_generate_v4() primary key,
  nome text not null unique
);

-- 4. Tamanhos
create table if not exists tamanhos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null unique, -- P, M, G, GG
  ordem integer default 0
);

-- 5. SKUs (Itens de Estoque)
create table if not exists skus (
  id uuid default uuid_generate_v4() primary key,
  produto_id uuid references produtos(id) on delete cascade,
  cor_id uuid references cores(id) on delete restrict,
  tamanho_id uuid references tamanhos(id) on delete restrict,
  
  -- Saldos de Estoque
  saldo_disponivel integer default 0,
  saldo_reservado integer default 0,
  saldo_fisico integer default 0,
  
  -- Parâmetros
  estoque_minimo integer default 0,
  estoque_alvo integer default 0,
  
  unique(produto_id, cor_id, tamanho_id)
);

-- 6. Pedidos (Internos)
create table if not exists pedidos (
  id uuid default uuid_generate_v4() primary key,
  numero serial, -- Número legível auto-incremento
  cliente_id uuid references clientes(id) on delete restrict,
  data_pedido timestamp with time zone default timezone('utc'::text, now()),
  status text default 'ABERTO', -- 'ABERTO', 'SEPARANDO', 'EXPEDIDO', 'CANCELADO'
  status_pagamento text default 'PENDENTE', -- 'PENDENTE', 'PAGO', 'PARCIAL'
  observacao text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Itens do Pedido
create table if not exists pedido_itens (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references pedidos(id) on delete cascade,
  sku_id uuid references skus(id) on delete restrict,
  quantidade integer not null check (quantidade > 0)
);

-- 8. Movimentações de Estoque (Log)
create table if not exists movimentacoes_estoque (
  id uuid default uuid_generate_v4() primary key,
  sku_id uuid references skus(id) on delete restrict,
  tipo text not null, -- 'ENTRADA_COMPRA', 'ENTRADA_PRODUCAO', 'SAIDA_VENDA', 'AJUSTE', 'RESERVA', 'LIBERACAO_RESERVA'
  quantidade integer not null,
  data_movimentacao timestamp with time zone default timezone('utc'::text, now()),
  referencia_documento text,
  observacao text,
  usuario_id uuid -- Referência opcional ao usuário que realizou a ação
);

-- Dados Iniciais (Tamanhos)
insert into tamanhos (nome, ordem) values 
('PP', 10), ('P', 20), ('M', 30), ('G', 40), ('GG', 50), ('XG', 60), ('UN', 99)
on conflict(nome) do nothing;

-- Dados Iniciais (Cores - Exemplos)
insert into cores (nome) values 
('PRETO'), ('BRANCO'), ('OFF-WHITE'), ('AZUL MARINHO'), ('VERMELHO'), ('NUDE'), ('ROSA')
on conflict(nome) do nothing;
