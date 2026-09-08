create table if not exists employees (
  id serial primary key,
  name text not null,
  pin_hash text not null,
  pin_salt text not null,
  role text not null default 'cajero',
  device_token text unique,
  active boolean not null default true,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

alter table sales add column if not exists employee_id integer references employees (id);

create index if not exists employees_active_idx on employees (active);
create index if not exists sales_employee_id_idx on sales (employee_id);
