-- Mobilare v1 schema
-- VAT-inclusive GBP; pay in full; service role writes via Edge Functions

create extension if not exists "pgcrypto";

create type public.service_type as enum (
  'courier',
  'medical',
  'legal',
  'warehouse',
  'removals',
  'estate'
);

create type public.booking_status as enum (
  'draft',
  'awaiting_payment',
  'paid',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled'
);

create type public.payment_status as enum (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'expired'
);

create type public.job_status as enum (
  'queued',
  'assigned',
  'en_route_pickup',
  'picked_up',
  'in_transit',
  'delivered',
  'failed'
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_email_idx on public.customers (lower(email));

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  service_type public.service_type not null,
  pickup_postcode text not null,
  dropoff_postcode text not null,
  package_notes text,
  currency text not null default 'GBP',
  amount_vat_inclusive_pence integer not null check (amount_vat_inclusive_pence > 0),
  distance_band text not null,
  eta_minutes integer not null,
  coverage_ok boolean not null default true,
  expires_at timestamptz not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text not null unique,
  tracking_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  quote_id uuid not null references public.quotes (id),
  customer_id uuid not null references public.customers (id),
  status public.booking_status not null default 'draft',
  service_type public.service_type not null,
  pickup_address text not null,
  dropoff_address text not null,
  pickup_postcode text not null,
  dropoff_postcode text not null,
  notes text,
  amount_vat_inclusive_pence integer not null,
  currency text not null default 'GBP',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_status_idx on public.bookings (status);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_pence integer not null,
  currency text not null default 'GBP',
  status public.payment_status not null default 'pending',
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  status public.job_status not null default 'queued',
  driver_name text,
  eta_minutes integer,
  last_lat double precision,
  last_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.proof_of_delivery (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  photo_url text,
  signature_meta jsonb not null default '{}'::jsonb,
  lat double precision,
  lng double precision,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_updated_at before update on public.customers
for each row execute function public.set_updated_at();

create trigger bookings_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

create trigger jobs_updated_at before update on public.jobs
for each row execute function public.set_updated_at();

create or replace function public.generate_booking_ref()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := 'MB-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.bookings where booking_ref = candidate);
  end loop;
  return candidate;
end;
$$;

grant execute on function public.generate_booking_ref() to service_role;

alter table public.customers enable row level security;
alter table public.quotes enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.jobs enable row level security;
alter table public.proof_of_delivery enable row level security;

-- No anon/authenticated policies: public access only via Edge Functions (service role).
-- Dashboard / service_role bypasses RLS.
