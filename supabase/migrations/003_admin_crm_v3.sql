-- Mobilare Admin CRM 2027 (adapted for existing bookings schema)
-- Safe alongside 001_init customers/bookings + 002_profiles_roles

do $$ begin
  create type public.admin_role as enum ('admin','ops','dispatcher','finance','readonly');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role public.admin_role not null default 'ops',
  name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin(req public.admin_role[])
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid()
      and is_active = true
      and role = any(req)
  );
$$;

drop policy if exists "admins manage" on public.admin_users;
create policy "admins manage" on public.admin_users
  for all using (public.is_admin(array['admin']::public.admin_role[]));

drop policy if exists "self read" on public.admin_users;
create policy "self read" on public.admin_users
  for select using (auth.uid() = id);

-- Extend existing customers (do not recreate)
alter table public.customers add column if not exists company_name text;
alter table public.customers add column if not exists tags text[] default '{}';
alter table public.customers add column if not exists lifetime_value numeric default 0;
alter table public.customers add column if not exists total_jobs int default 0;
alter table public.customers add column if not exists last_job_at timestamptz;
alter table public.customers add column if not exists deleted_at timestamptz;

-- Backfill company_name from company when present
update public.customers
set company_name = company
where company_name is null and company is not null;

create index if not exists idx_customers_phone on public.customers (phone);
create index if not exists idx_customers_tags on public.customers using gin (tags);

drop policy if exists "admin ops customers" on public.customers;
create policy "admin ops customers" on public.customers
  for all using (public.is_admin(array['admin','ops','dispatcher','finance']::public.admin_role[]));

do $$ begin
  create type public.shipment_status as enum (
    'raw','contacted','quoted','booked','dispatched','in_transit',
    'out_for_delivery','delivered','exception','cancelled','invoiced'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id),
  booking_id uuid references public.bookings (id),
  status public.shipment_status default 'raw',
  pickup_postcode text,
  dropoff_postcode text,
  service_type text,
  price numeric,
  cost numeric,
  driver_id uuid,
  eta timestamptz,
  pod_url text,
  created_at timestamptz not null default now()
);

alter table public.shipments enable row level security;
drop policy if exists "shipments access" on public.shipments;
create policy "shipments access" on public.shipments
  for all using (public.is_admin(array['admin','ops','dispatcher']::public.admin_role[]));

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  channel text,
  customer_id uuid references public.customers (id),
  shipment_id uuid references public.shipments (id),
  title text,
  status text default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete cascade,
  admin_id uuid references public.admin_users (id),
  is_bot boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete cascade,
  sender_type text,
  sender_id uuid,
  body text,
  attachments jsonb default '[]'::jsonb,
  ai_suggested boolean default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
drop policy if exists "admin can read all convos" on public.conversations;
create policy "admin can read all convos" on public.conversations
  for all using (public.is_admin(array['admin','ops','dispatcher']::public.admin_role[]));
drop policy if exists "admin can read all messages" on public.messages;
create policy "admin can read all messages" on public.messages
  for all using (public.is_admin(array['admin','ops','dispatcher']::public.admin_role[]));

create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id),
  channel text,
  template_key text,
  payload jsonb,
  status text default 'queued',
  attempts int default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_outbound_status on public.outbound_messages (status);

create table if not exists public.audit_logs (
  id bigserial primary key,
  table_name text,
  row_id uuid,
  action text,
  old_data jsonb,
  new_data jsonb,
  actor uuid references public.admin_users (id),
  created_at timestamptz not null default now()
);

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
when undefined_object then null;
when others then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
when undefined_object then null;
when others then null;
end $$;
