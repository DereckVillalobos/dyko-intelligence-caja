alter table employees add column if not exists must_set_pin boolean not null default false;
alter table employees add column if not exists pin_reset_requested boolean not null default false;

create table if not exists cash_closes (
  id serial primary key,
  day_key text not null unique,
  employee_id integer not null references employees (id),
  expected_cash integer not null,
  counted_cash integer not null,
  difference integer not null,
  float_amount integer not null default 0,
  card_total integer not null,
  sinpe_total integer not null,
  sales_count integer not null,
  sales_total integer not null,
  note text,
  created_at timestamptz not null default now()
);

insert into store_settings (key, value) values ('dailyGoal', '0'), ('cashFloat', '0')
on conflict (key) do nothing;
