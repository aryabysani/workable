-- WorkAble — Merchandise Marketplace module (additive).
-- Centres list products their students make; recruiters/companies place bulk
-- orders; centres accept/decline/fulfil. Existing recruitment tables untouched.

-- ---------------------------------------------------------------------------
-- products: belong to a school/centre
-- ---------------------------------------------------------------------------
create table public.products (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  name         text not null,
  image        text,
  description  text,
  category     text not null default 'Crafts',
  unit_price   numeric(12,2) not null check (unit_price > 0),
  min_qty      int not null default 1 check (min_qty > 0),
  max_qty      int not null check (max_qty >= min_qty),
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index products_school_id_idx on public.products(school_id);
create index products_category_idx on public.products(category);
create index products_available_idx on public.products(is_available);

create trigger trg_products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- merch_orders: a recruiter buys a product from a centre
-- ---------------------------------------------------------------------------
create table public.merch_orders (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  school_id        uuid not null references public.schools(id) on delete cascade,
  recruiter_id     uuid not null references public.recruiters(id) on delete cascade,
  quantity         int not null check (quantity > 0),
  unit_price       numeric(12,2) not null,        -- snapshot at order time
  total_price      numeric(12,2) not null,        -- quantity * unit_price (trigger)
  status           text not null default 'pending'
                     check (status in ('pending','accepted','declined','fulfilled')),
  delivery_details text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint total_is_consistent check (total_price = round(unit_price * quantity, 2))
);
create index merch_orders_school_id_idx on public.merch_orders(school_id);
create index merch_orders_recruiter_id_idx on public.merch_orders(recruiter_id);
create index merch_orders_product_id_idx on public.merch_orders(product_id);
create index merch_orders_status_idx on public.merch_orders(status);

-- On insert: pull authoritative price + owner from the product, validate the
-- quantity against the product's min/max, and require the product be available.
create or replace function public.prepare_merch_order()
returns trigger
language plpgsql
as $$
declare p public.products;
begin
  select * into p from public.products where id = new.product_id;
  if not found then
    raise exception 'Product % does not exist', new.product_id;
  end if;
  if not p.is_available then
    raise exception 'Product is not currently available for ordering';
  end if;
  if new.quantity < p.min_qty or new.quantity > p.max_qty then
    raise exception 'Quantity % is outside the allowed range (% – %)',
      new.quantity, p.min_qty, p.max_qty;
  end if;
  new.school_id  := p.school_id;
  new.unit_price := p.unit_price;
  new.total_price := round(p.unit_price * new.quantity, 2);
  return new;
end;
$$;

create trigger trg_prepare_merch_order
  before insert on public.merch_orders
  for each row execute function public.prepare_merch_order();

-- Enforce the status lifecycle on update:
--   pending -> accepted | declined
--   accepted -> fulfilled
create or replace function public.enforce_merch_status()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if new.status = old.status then
    return new;
  end if;
  if old.status = 'pending' and new.status in ('accepted','declined') then
    return new;
  elsif old.status = 'accepted' and new.status = 'fulfilled' then
    return new;
  else
    raise exception 'Invalid order status change: % -> %', old.status, new.status;
  end if;
end;
$$;

create trigger trg_enforce_merch_status
  before update on public.merch_orders
  for each row execute function public.enforce_merch_status();

-- ---------------------------------------------------------------------------
-- Grants (parity with the rest of the schema; RLS still constrains access)
-- ---------------------------------------------------------------------------
grant all on public.products to anon, authenticated, service_role;
grant all on public.merch_orders to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.products     enable row level security;
alter table public.merch_orders enable row level security;

-- products: a centre manages its own; recruiters browse available ones; admin
-- sees all. Individuals get no access (intentionally excluded).
create policy products_select on public.products
  for select using (
    school_id = auth.uid()
    or public.is_admin()
    or (is_available and public.my_role() = 'recruiter')
  );

create policy products_insert_own on public.products
  for insert with check (school_id = auth.uid() and public.my_role() = 'school');

create policy products_update_own on public.products
  for update using (school_id = auth.uid() or public.is_admin())
  with check (school_id = auth.uid() or public.is_admin());

create policy products_delete_own on public.products
  for delete using (school_id = auth.uid() or public.is_admin());

-- merch_orders: the owning centre and the buying recruiter see their orders;
-- admin sees all. Individuals are excluded entirely.
create policy merch_orders_select on public.merch_orders
  for select using (
    school_id = auth.uid()
    or recruiter_id = auth.uid()
    or public.is_admin()
  );

-- only an approved recruiter may place an order, for themselves
create policy merch_orders_insert_own on public.merch_orders
  for insert with check (
    recruiter_id = auth.uid() and public.is_approved_recruiter()
  );

-- the owning centre (or admin) drives the status lifecycle
create policy merch_orders_update_owner on public.merch_orders
  for update using (school_id = auth.uid() or public.is_admin())
  with check (school_id = auth.uid() or public.is_admin());

create policy merch_orders_delete_admin on public.merch_orders
  for delete using (public.is_admin());
