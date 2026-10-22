-- Live driver GPS for track map + CRM dispatch

alter table public.jobs
  add column if not exists driver_profile_id uuid references public.profiles (id) on delete set null;

create index if not exists jobs_driver_profile_idx on public.jobs (driver_profile_id);

create table if not exists public.driver_locations (
  driver_profile_id uuid primary key references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy_m double precision,
  heading double precision,
  speed_mps double precision,
  updated_at timestamptz not null default now()
);

alter table public.driver_locations enable row level security;

drop policy if exists "driver_locations_select" on public.driver_locations;
create policy "driver_locations_select" on public.driver_locations
  for select using (
    driver_profile_id = auth.uid()
    or public.is_portal_admin()
  );

drop policy if exists "driver_locations_upsert_own" on public.driver_locations;
create policy "driver_locations_upsert_own" on public.driver_locations
  for all using (driver_profile_id = auth.uid())
  with check (driver_profile_id = auth.uid());

create or replace function public.publish_driver_location(
  p_lat double precision,
  p_lng double precision,
  p_accuracy_m double precision default null,
  p_heading double precision default null,
  p_speed_mps double precision default null,
  p_job_id uuid default null
)
returns public.driver_locations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.driver_locations;
  v_role public.user_role;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_lat is null or p_lng is null then
    raise exception 'lat/lng required';
  end if;
  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'Invalid coordinates';
  end if;

  select role into v_role from public.profiles where id = v_uid;
  if v_role is distinct from 'driver' and not public.is_portal_admin() then
    raise exception 'Drivers only';
  end if;

  insert into public.driver_locations (
    driver_profile_id, lat, lng, accuracy_m, heading, speed_mps, updated_at
  ) values (
    v_uid, p_lat, p_lng, p_accuracy_m, p_heading, p_speed_mps, now()
  )
  on conflict (driver_profile_id) do update set
    lat = excluded.lat,
    lng = excluded.lng,
    accuracy_m = excluded.accuracy_m,
    heading = excluded.heading,
    speed_mps = excluded.speed_mps,
    updated_at = now()
  returning * into v_row;

  -- Mirror onto active job(s) so public /track can show driver pin
  if p_job_id is not null then
    update public.jobs
    set last_lat = p_lat, last_lng = p_lng, updated_at = now(),
        driver_profile_id = coalesce(driver_profile_id, v_uid)
    where id = p_job_id
      and (driver_profile_id = v_uid or driver_profile_id is null or public.is_portal_admin());
  else
    update public.jobs
    set last_lat = p_lat, last_lng = p_lng, updated_at = now()
    where driver_profile_id = v_uid
      and status in ('assigned', 'en_route_pickup', 'picked_up', 'in_transit');
  end if;

  return v_row;
end;
$$;

grant execute on function public.publish_driver_location(
  double precision, double precision, double precision, double precision, double precision, uuid
) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.driver_locations;
exception when duplicate_object then null; when undefined_object then null; when others then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.jobs;
exception when duplicate_object then null; when undefined_object then null; when others then null;
end $$;
