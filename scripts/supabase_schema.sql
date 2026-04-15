-- Запусти это в Supabase → SQL Editor

create table if not exists orders (
  id           bigserial primary key,
  crm_id       integer unique not null,
  number       text,
  status       text,
  first_name   text,
  last_name    text,
  phone        text,
  email        text,
  city         text,
  utm_source   text,
  total_price  integer,
  items_count  integer,
  items_json   text,
  created_at   timestamptz default now()
);

-- Включить Row Level Security (RLS) для публичного чтения
alter table orders enable row level security;

create policy "Public read"
  on orders for select
  using (true);

-- Индексы для быстрых запросов
create index on orders (utm_source);
create index on orders (city);
create index on orders (total_price);
create index on orders (created_at);
