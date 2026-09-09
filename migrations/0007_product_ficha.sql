alter table products add column if not exists cabys text not null default '';
alter table products add column if not exists iva_rate integer not null default 13;
alter table products add column if not exists cost integer not null default 0;
alter table products add column if not exists unit text not null default 'unidad';
alter table products add column if not exists min_stock integer not null default 5;
alter table products add column if not exists supplier text not null default '';
alter table products add column if not exists expires_on date;

create index if not exists products_expires_idx on products (expires_on);
