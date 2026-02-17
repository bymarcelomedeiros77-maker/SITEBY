-- Tabela de Devoluções
create table public.devolucoes (
  id uuid default gen_random_uuid() primary key,
  numero serial,
  pedido_id uuid references public.pedidos(id) not null,
  data_devolucao timestamp with time zone default timezone('utc'::text, now()) not null,
  status text not null check (status in ('PENDENTE', 'APROVADO', 'REJEITADO', 'CONCLUIDO')) default 'PENDENTE',
  motivo text,
  observacao text,
  usuario_id uuid references auth.users(id)
);

-- Itens da Devolução
create table public.devolucao_itens (
  id uuid default gen_random_uuid() primary key,
  devolucao_id uuid references public.devolucoes(id) on delete cascade not null,
  sku_id uuid references public.skus(id) not null,
  quantidade integer not null check (quantidade > 0)
);

-- RLS
alter table public.devolucoes enable row level security;
alter table public.devolucao_itens enable row level security;

create policy "Permitir acesso total a devolucoes" on public.devolucoes for all using (true) with check (true);
create policy "Permitir acesso total a devolucao_itens" on public.devolucao_itens for all using (true) with check (true);
