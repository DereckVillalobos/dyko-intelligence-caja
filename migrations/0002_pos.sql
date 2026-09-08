create table if not exists products (
  id serial primary key,
  barcode text not null unique,
  name text not null,
  category text not null default 'General',
  price integer not null,
  stock integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists sales (
  id serial primary key,
  ticket text not null unique,
  subtotal integer not null,
  total integer not null,
  payment_method text not null,
  tendered integer not null default 0,
  change_due integer not null default 0,
  cashier text not null default 'Caja',
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id serial primary key,
  sale_id integer not null references sales (id) on delete cascade,
  product_id integer,
  barcode text not null,
  name text not null,
  qty integer not null,
  unit_price integer not null,
  line_total integer not null
);

create table if not exists store_settings (
  key text primary key,
  value text not null
);

create index if not exists products_barcode_idx on products (barcode);
create index if not exists products_category_idx on products (category);
create index if not exists sales_created_at_idx on sales (created_at desc);
create index if not exists sale_items_sale_id_idx on sale_items (sale_id);
