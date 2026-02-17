-- Tabela de Ordens de Produção (OPs)
create table public.ordens_producao (
  id uuid default gen_random_uuid() primary key,
  numero serial, -- Número sequencial da OP
  sku_id uuid references public.skus(id) on delete cascade not null,
  quantidade integer not null check (quantidade > 0),
  status text not null check (status in ('PLANEJADO', 'CORTE', 'COSTURA', 'ACABAMENTO', 'FINALIZADO', 'CANCELADO')) default 'PLANEJADO',
  
  data_criacao timestamp with time zone default timezone('utc'::text, now()) not null,
  data_inicio timestamp with time zone,
  data_fim timestamp with time zone,
  
  responsavel text, -- Pode ser vinculado a usuario_id se tiver auth
  observacao text
);

-- Políticas RLS (Row Level Security) - Simples para permitir tudo por enquanto
alter table public.ordens_producao enable row level security;

create policy "Permitir acesso total a ordens_producao"
on public.ordens_producao
for all
using (true)
with check (true);
