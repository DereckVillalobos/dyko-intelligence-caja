create table if not exists inventory_events (
  id serial primary key,
  employee_id integer not null references employees (id),
  product_id integer references products (id),
  product_name text not null,
  kind text not null,
  qty integer not null default 0,
  reason text,
  note text,
  price_before integer,
  price_after integer,
  stock_before integer,
  stock_after integer,
  created_at timestamptz not null default now()
);

create index if not exists inventory_events_created_idx on inventory_events (created_at desc);
create index if not exists inventory_events_employee_idx on inventory_events (employee_id, created_at desc);
