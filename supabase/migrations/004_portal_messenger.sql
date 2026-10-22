-- Tri-portal messenger: Customer ↔ CRM ↔ Driver (RoadAngel-style UX, Supabase transport)
-- Extends conversations / messages from 003_admin_crm_v3.sql

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------
alter table public.conversations
  add column if not exists kind text not null default 'support',
  add column if not exists customer_profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists driver_profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists booking_id uuid references public.bookings (id) on delete set null,
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_preview text,
  add column if not exists created_by uuid references public.profiles (id) on delete set null;

comment on column public.conversations.kind is 'support | driver_ops | job | internal';

create index if not exists conversations_kind_idx on public.conversations (kind);
create index if not exists conversations_customer_profile_idx on public.conversations (customer_profile_id);
create index if not exists conversations_driver_profile_idx on public.conversations (driver_profile_id);
create index if not exists conversations_last_message_idx on public.conversations (last_message_at desc nulls last);

alter table public.conversation_participants
  add column if not exists profile_id uuid references public.profiles (id) on delete cascade,
  add column if not exists face text,
  add column if not exists last_read_at timestamptz;

-- One participant row per face per conversation
delete from public.conversation_participants a
  using public.conversation_participants b
 where a.id > b.id
   and a.conversation_id = b.conversation_id
   and a.face is not distinct from b.face
   and a.face is not null;

create unique index if not exists conversation_participants_unique_face
  on public.conversation_participants (conversation_id, face);

alter table public.messages
  add column if not exists sender_face text,
  add column if not exists sender_profile_id uuid references public.profiles (id) on delete set null;

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.admin_users
      where id = auth.uid() and is_active = true
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    );
$$;

create or replace function public.can_access_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_portal_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = p_conversation_id
        and (
          c.customer_profile_id = auth.uid()
          or c.driver_profile_id = auth.uid()
          or c.created_by = auth.uid()
        )
    )
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = p_conversation_id
        and cp.profile_id = auth.uid()
    );
$$;

-- Keep conversation preview in sync
create or replace function public.tg_messages_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    last_message_preview = left(new.body, 160),
    status = coalesce(nullif(status, ''), 'open')
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.tg_messages_touch_conversation();

-- ---------------------------------------------------------------------------
-- Open / ensure threads
-- ---------------------------------------------------------------------------
create or replace function public.open_support_thread(p_subject text default 'Support', p_context text default null)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.conversations;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select full_name into v_name from public.profiles where id = v_uid;

  select c.* into v_row
  from public.conversations c
  where c.kind = 'support'
    and c.customer_profile_id = v_uid
    and coalesce(c.status, 'open') <> 'closed'
  order by c.last_message_at desc nulls last, c.created_at desc
  limit 1;

  if v_row.id is null then
    insert into public.conversations (
      type, channel, kind, title, status,
      customer_profile_id, created_by, last_message_at
    ) values (
      'support', 'in_app', 'support',
      coalesce(nullif(trim(p_subject), ''), 'Support'),
      'open', v_uid, v_uid, now()
    )
    returning * into v_row;

    insert into public.conversation_participants (conversation_id, profile_id, face, last_read_at)
    values
      (v_row.id, v_uid, 'customer', now()),
      (v_row.id, null, 'crm', null);

    insert into public.messages (conversation_id, sender_type, sender_face, sender_id, sender_profile_id, body)
    values (
      v_row.id, 'system', 'system', null, null,
      coalesce(nullif(trim(p_context), ''), 'Support thread opened. CRM will reply here.')
    );
  end if;

  return v_row;
end;
$$;

create or replace function public.open_driver_thread(p_subject text default 'Driver desk', p_context text default null)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.conversations;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select c.* into v_row
  from public.conversations c
  where c.kind = 'driver_ops'
    and c.driver_profile_id = v_uid
    and coalesce(c.status, 'open') <> 'closed'
  order by c.last_message_at desc nulls last, c.created_at desc
  limit 1;

  if v_row.id is null then
    insert into public.conversations (
      type, channel, kind, title, status,
      driver_profile_id, created_by, last_message_at
    ) values (
      'driver_ops', 'in_app', 'driver_ops',
      coalesce(nullif(trim(p_subject), ''), 'Driver desk'),
      'open', v_uid, v_uid, now()
    )
    returning * into v_row;

    insert into public.conversation_participants (conversation_id, profile_id, face, last_read_at)
    values
      (v_row.id, v_uid, 'driver', now()),
      (v_row.id, null, 'crm', null);

    insert into public.messages (conversation_id, sender_type, sender_face, sender_id, sender_profile_id, body)
    values (
      v_row.id, 'system', 'system', null, null,
      coalesce(nullif(trim(p_context), ''), 'Driver ops thread opened. Dispatch / CRM will reply here.')
    );
  end if;

  return v_row;
end;
$$;

create or replace function public.send_portal_message(p_conversation_id uuid, p_body text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_face text;
  v_role public.user_role;
  v_msg public.messages;
  v_body text := trim(p_body);
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if v_body is null or length(v_body) = 0 then
    raise exception 'Empty message';
  end if;
  if not public.can_access_conversation(p_conversation_id) then
    raise exception 'Forbidden';
  end if;

  if public.is_portal_admin() then
    v_face := 'crm';
  else
    select role into v_role from public.profiles where id = v_uid;
    if v_role = 'driver' then
      v_face := 'driver';
    else
      v_face := 'customer';
    end if;
  end if;

  insert into public.messages (
    conversation_id, sender_type, sender_face, sender_id, sender_profile_id, body
  ) values (
    p_conversation_id, v_face, v_face, v_uid, v_uid, v_body
  )
  returning * into v_msg;

  insert into public.conversation_participants (conversation_id, profile_id, face, last_read_at)
  values (p_conversation_id, v_uid, v_face, now())
  on conflict (conversation_id, face) do update
    set last_read_at = now(),
        profile_id = coalesce(public.conversation_participants.profile_id, excluded.profile_id);

  return v_msg;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_face text;
  v_role public.user_role;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if not public.can_access_conversation(p_conversation_id) then
    raise exception 'Forbidden';
  end if;

  if public.is_portal_admin() then
    v_face := 'crm';
  else
    select role into v_role from public.profiles where id = v_uid;
    v_face := case when v_role = 'driver' then 'driver' else 'customer' end;
  end if;

  insert into public.conversation_participants (conversation_id, profile_id, face, last_read_at)
  values (p_conversation_id, v_uid, v_face, now())
  on conflict (conversation_id, face) do update
    set last_read_at = now(),
        profile_id = coalesce(public.conversation_participants.profile_id, excluded.profile_id);

  update public.messages
  set read_at = coalesce(read_at, now())
  where conversation_id = p_conversation_id
    and coalesce(sender_face, sender_type) is distinct from v_face
    and read_at is null;
end;
$$;

grant execute on function public.open_support_thread(text, text) to authenticated;
grant execute on function public.open_driver_thread(text, text) to authenticated;
grant execute on function public.send_portal_message(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.can_access_conversation(uuid) to authenticated;
grant execute on function public.is_portal_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — replace admin-only policies with portal-aware access
-- ---------------------------------------------------------------------------
drop policy if exists "admin can read all convos" on public.conversations;
drop policy if exists "admin can read all messages" on public.messages;
drop policy if exists "conversations_portal_select" on public.conversations;
drop policy if exists "conversations_portal_insert" on public.conversations;
drop policy if exists "conversations_portal_update" on public.conversations;
drop policy if exists "messages_portal_select" on public.messages;
drop policy if exists "messages_portal_insert" on public.messages;
drop policy if exists "participants_portal_select" on public.conversation_participants;
drop policy if exists "participants_portal_all" on public.conversation_participants;

create policy "conversations_portal_select" on public.conversations
  for select using (
    public.is_portal_admin()
    or customer_profile_id = auth.uid()
    or driver_profile_id = auth.uid()
    or created_by = auth.uid()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversations.id and cp.profile_id = auth.uid()
    )
  );

create policy "conversations_portal_insert" on public.conversations
  for insert with check (
    public.is_portal_admin()
    or created_by = auth.uid()
    or customer_profile_id = auth.uid()
    or driver_profile_id = auth.uid()
  );

create policy "conversations_portal_update" on public.conversations
  for update using (
    public.is_portal_admin()
    or customer_profile_id = auth.uid()
    or driver_profile_id = auth.uid()
  );

create policy "messages_portal_select" on public.messages
  for select using (public.can_access_conversation(conversation_id));

create policy "messages_portal_insert" on public.messages
  for insert with check (
    public.can_access_conversation(conversation_id)
    and (sender_profile_id = auth.uid() or public.is_portal_admin() or sender_type = 'system')
  );

create policy "participants_portal_select" on public.conversation_participants
  for select using (public.can_access_conversation(conversation_id));

create policy "participants_portal_all" on public.conversation_participants
  for all using (
    public.is_portal_admin()
    or profile_id = auth.uid()
    or public.can_access_conversation(conversation_id)
  );

-- Realtime (idempotent)
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; when undefined_object then null; when others then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null; when undefined_object then null; when others then null;
end $$;
