-- TimeSync core schema. Every table has Row Level Security enabled.
-- Public (no-login) booking never touches tables directly: it goes through Edge Functions that
-- validate input, rate-limit, and use the service role.

create extension if not exists btree_gist;

-- ───────────────────────────── Profiles & teams ─────────────────────────────
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text unique not null check (username ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$'),
    display_name text not null default '',
    avatar_url text,
    timezone text not null default 'UTC',
    chronotype text not null default 'bear' check (chronotype in ('lion', 'bear', 'wolf', 'dolphin')),
    country_code text check (country_code ~ '^[A-Z]{2}$'),
    working_start numeric(4, 2) not null default 9 check (working_start between 0 and 24),
    working_end numeric(4, 2) not null default 17 check (working_end between 0 and 24),
    tier text not null default 'free' check (tier in ('free', 'pro', 'teams')),
    onboarded boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.teams (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(name) between 1 and 80),
    slug text unique not null check (slug ~ '^[a-z0-9-]{2,40}$'),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now()
);

create table public.team_members (
    team_id uuid references public.teams (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete cascade,
    role text not null default 'member' check (role in ('owner', 'admin', 'member')),
    primary key (team_id, user_id)
);

-- Helper used by policies. security definer avoids recursive RLS on team_members.
create or replace function public.is_team_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from team_members where team_id = t and user_id = auth.uid());
$$;

create or replace function public.shares_team_with(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select exists (
        select 1 from team_members a join team_members b on a.team_id = b.team_id
        where a.user_id = auth.uid() and b.user_id = other
    );
$$;

-- ───────────────────────────── Availability ─────────────────────────────
create table public.schedules (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    name text not null check (char_length(name) between 1 and 80),
    timezone text not null,
    weekly jsonb not null default '{}'::jsonb,
    overrides jsonb not null default '[]'::jsonb,
    is_default boolean not null default false,
    created_at timestamptz not null default now()
);
create unique index schedules_one_default on public.schedules (owner_id) where is_default;

-- ───────────────────────────── Event types ─────────────────────────────
create table public.event_types (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    team_id uuid references public.teams (id) on delete cascade,
    slug text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$'),
    title text not null check (char_length(title) between 1 and 120),
    description text check (char_length(description) <= 2000),
    kind text not null default 'one_on_one' check (kind in ('one_on_one', 'group', 'round_robin', 'collective')),
    duration_minutes int not null check (duration_minutes between 5 and 720),
    slot_interval_minutes int check (slot_interval_minutes between 5 and 720),
    buffer_before_minutes int not null default 0 check (buffer_before_minutes between 0 and 240),
    buffer_after_minutes int not null default 0 check (buffer_after_minutes between 0 and 240),
    minimum_notice_minutes int not null default 240 check (minimum_notice_minutes >= 0),
    max_per_day int check (max_per_day > 0),
    rolling_window_days int default 60 check (rolling_window_days between 1 and 365),
    seats int check (seats between 2 and 500),
    location jsonb not null default '{"kind":"google_meet"}'::jsonb,
    color text not null default '#7C5CFF',
    schedule_id uuid references public.schedules (id) on delete set null,
    questions jsonb not null default '[]'::jsonb,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    unique (owner_id, slug)
);

create table public.event_type_hosts (
    event_type_id uuid references public.event_types (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete cascade,
    priority int not null default 0,
    weight numeric not null default 1 check (weight > 0),
    primary key (event_type_id, user_id)
);

-- Free tier: one active event type (enforced in the database, not just the UI).
create or replace function public.enforce_event_type_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if new.active and (select tier from profiles where id = new.owner_id) = 'free'
       and (select count(*) from event_types where owner_id = new.owner_id and active and id <> new.id) >= 1 then
        raise exception 'Free plan includes one active event type. Upgrade to Pro for unlimited.' using errcode = 'P0001';
    end if;
    return new;
end $$;
create trigger event_type_limit before insert or update on public.event_types
    for each row execute function public.enforce_event_type_limit();

-- ───────────────────────────── Bookings ─────────────────────────────
create table public.bookings (
    id uuid primary key default gen_random_uuid(),
    event_type_id uuid not null references public.event_types (id) on delete cascade,
    host_id uuid not null references public.profiles (id) on delete cascade,
    invitee_name text not null check (char_length(invitee_name) between 1 and 120),
    invitee_email text not null check (char_length(invitee_email) <= 254),
    invitee_timezone text not null,
    start_at timestamptz not null,
    end_at timestamptz not null check (end_at > start_at),
    status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'rescheduled', 'no_show', 'completed')),
    is_group boolean not null default false,
    answers jsonb not null default '{}'::jsonb,
    meeting_url text,
    fairness_score int check (fairness_score between 0 and 100),
    external_event_ids jsonb not null default '{}'::jsonb,
    cancel_reason text,
    rescheduled_from uuid references public.bookings (id),
    created_at timestamptz not null default now(),
    -- Race-safe double-booking guard for 1:1 hosts.
    constraint no_double_booking exclude using gist (host_id with =, tstzrange(start_at, end_at) with &&)
        where (status = 'confirmed' and not is_group)
);
create index bookings_host_start on public.bookings (host_id, start_at);
create index bookings_event_start on public.bookings (event_type_id, start_at);

-- Busy time mirrored from connected calendars (Google / Outlook).
create table public.busy_blocks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    start_at timestamptz not null,
    end_at timestamptz not null,
    source text not null check (source in ('google', 'outlook', 'manual')),
    external_id text,
    unique (user_id, source, external_id)
);
create index busy_blocks_user_start on public.busy_blocks (user_id, start_at);

create table public.calendar_connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    provider text not null check (provider in ('google', 'outlook')),
    account_email text not null,
    check_conflicts boolean not null default true,
    write_bookings boolean not null default true,
    last_synced_at timestamptz,
    created_at timestamptz not null default now(),
    unique (user_id, provider, account_email)
);

-- OAuth tokens: no policies at all, so only the service role (Edge Functions) can read them.
create table public.calendar_tokens (
    connection_id uuid primary key references public.calendar_connections (id) on delete cascade,
    access_token text not null,
    refresh_token text,
    expires_at timestamptz
);

-- ───────────────────────────── Polls ─────────────────────────────
create table public.polls (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    team_id uuid references public.teams (id) on delete cascade,
    title text not null check (char_length(title) between 1 and 120),
    duration_minutes int not null check (duration_minutes between 5 and 720),
    status text not null default 'open' check (status in ('open', 'closed', 'booked')),
    deadline timestamptz,
    winner_option_id uuid,
    created_at timestamptz not null default now()
);
create table public.poll_options (
    id uuid primary key default gen_random_uuid(),
    poll_id uuid not null references public.polls (id) on delete cascade,
    start_at timestamptz not null,
    end_at timestamptz not null check (end_at > start_at)
);
create table public.poll_votes (
    poll_id uuid not null references public.polls (id) on delete cascade,
    option_id uuid not null references public.poll_options (id) on delete cascade,
    voter_id uuid not null references public.profiles (id) on delete cascade,
    answer text not null check (answer in ('yes', 'maybe', 'no')),
    updated_at timestamptz not null default now(),
    primary key (option_id, voter_id)
);

-- ───────────────────────────── Routing, integrations, reminders ─────────────────────────────
create table public.routing_forms (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    team_id uuid references public.teams (id) on delete cascade,
    slug text not null,
    title text not null,
    questions jsonb not null default '[]'::jsonb,
    rules jsonb not null default '[]'::jsonb,
    fallback jsonb not null,
    unique (owner_id, slug)
);

create table public.webhooks (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles (id) on delete cascade,
    url text not null check (url ~ '^https://'),
    secret text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    events text[] not null default array['booking.created', 'booking.cancelled', 'booking.rescheduled'],
    active boolean not null default true,
    created_at timestamptz not null default now()
);

create table public.slack_links (
    slack_team_id text not null,
    slack_user_id text not null,
    user_id uuid not null references public.profiles (id) on delete cascade,
    primary key (slack_team_id, slack_user_id)
);

create table public.push_tokens (
    user_id uuid not null references public.profiles (id) on delete cascade,
    token text not null,
    primary key (user_id, token)
);

create table public.reminders (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.bookings (id) on delete cascade,
    kind text not null check (kind in ('reminder', 'follow_up')),
    channel text not null check (channel in ('email', 'push')),
    send_at timestamptz not null,
    sent_at timestamptz,
    error text
);
create index reminders_due on public.reminders (send_at) where sent_at is null;

-- Fixed-window rate limiting for Edge Functions (per user or per IP hash).
create table public.rate_limits (
    key text primary key,
    window_start timestamptz not null,
    count int not null
);

create or replace function public.hit_rate_limit(p_key text, p_window_seconds int, p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare current_count int;
begin
    insert into rate_limits as r (key, window_start, count) values (p_key, now(), 1)
    on conflict (key) do update set
        count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
    returning count into current_count;
    return current_count <= p_max;
end $$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;

-- ───────────────────────────── New-user bootstrap ─────────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare base text; candidate text; n int := 0;
begin
    base := lower(regexp_replace(coalesce(split_part(new.email, '@', 1), 'user'), '[^a-z0-9]+', '-', 'g'));
    base := trim(both '-' from left(base, 30));
    if char_length(base) < 3 then base := 'user-' || base; end if;
    candidate := base;
    while exists (select 1 from profiles where username = candidate) loop
        n := n + 1;
        candidate := base || '-' || n;
    end loop;
    insert into profiles (id, username, display_name, avatar_url)
    values (new.id, candidate, coalesce(new.raw_user_meta_data ->> 'full_name', ''), new.raw_user_meta_data ->> 'avatar_url');
    insert into schedules (owner_id, name, timezone, weekly, is_default)
    values (new.id, 'Working hours', 'UTC',
        '{"1":[{"start":"09:00","end":"17:00"}],"2":[{"start":"09:00","end":"17:00"}],"3":[{"start":"09:00","end":"17:00"}],"4":[{"start":"09:00","end":"17:00"}],"5":[{"start":"09:00","end":"17:00"}]}',
        true);
    return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ───────────────────────────── Row Level Security ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.schedules enable row level security;
alter table public.event_types enable row level security;
alter table public.event_type_hosts enable row level security;
alter table public.bookings enable row level security;
alter table public.busy_blocks enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.calendar_tokens enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.routing_forms enable row level security;
alter table public.webhooks enable row level security;
alter table public.slack_links enable row level security;
alter table public.push_tokens enable row level security;
alter table public.reminders enable row level security;
alter table public.rate_limits enable row level security;

create policy "own or teammate profile" on public.profiles for select using (id = auth.uid() or public.shares_team_with(id));
-- Users may edit their profile but never their own billing tier (set by the billing webhook).
create policy "update own profile" on public.profiles for update using (id = auth.uid())
    with check (id = auth.uid() and tier = (select p.tier from public.profiles p where p.id = auth.uid()));

create policy "members read team" on public.teams for select using (public.is_team_member(id));
create policy "create team" on public.teams for insert with check (owner_id = auth.uid());
create policy "owner edits team" on public.teams for update using (owner_id = auth.uid());
create policy "owner deletes team" on public.teams for delete using (owner_id = auth.uid());

create policy "members read membership" on public.team_members for select using (public.is_team_member(team_id));
create policy "owner manages membership" on public.team_members for all
    using (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()))
    with check (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));

create policy "own schedules" on public.schedules for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own or team event types" on public.event_types for select
    using (owner_id = auth.uid() or (team_id is not null and public.is_team_member(team_id)));
create policy "manage own event types" on public.event_types for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "read hosts" on public.event_type_hosts for select
    using (exists (select 1 from public.event_types e where e.id = event_type_id and (e.owner_id = auth.uid() or (e.team_id is not null and public.is_team_member(e.team_id)))));
create policy "owner manages hosts" on public.event_type_hosts for all
    using (exists (select 1 from public.event_types e where e.id = event_type_id and e.owner_id = auth.uid()))
    with check (exists (select 1 from public.event_types e where e.id = event_type_id and e.owner_id = auth.uid()));

-- Hosts see and update their bookings; creation goes through the public-booking function.
create policy "host reads bookings" on public.bookings for select using (host_id = auth.uid());
create policy "host updates bookings" on public.bookings for update using (host_id = auth.uid()) with check (host_id = auth.uid());

create policy "own busy" on public.busy_blocks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own connections read" on public.calendar_connections for select using (user_id = auth.uid());
create policy "own connections update" on public.calendar_connections for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own connections delete" on public.calendar_connections for delete using (user_id = auth.uid());
-- calendar_tokens, rate_limits, reminders: intentionally no policies (service role only).

create policy "poll visible to owner and team" on public.polls for select
    using (owner_id = auth.uid() or (team_id is not null and public.is_team_member(team_id)));
create policy "owner manages poll" on public.polls for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "poll options visible" on public.poll_options for select
    using (exists (select 1 from public.polls p where p.id = poll_id and (p.owner_id = auth.uid() or (p.team_id is not null and public.is_team_member(p.team_id)))));
create policy "owner manages options" on public.poll_options for all
    using (exists (select 1 from public.polls p where p.id = poll_id and p.owner_id = auth.uid()))
    with check (exists (select 1 from public.polls p where p.id = poll_id and p.owner_id = auth.uid()));
create policy "votes visible" on public.poll_votes for select
    using (exists (select 1 from public.polls p where p.id = poll_id and (p.owner_id = auth.uid() or (p.team_id is not null and public.is_team_member(p.team_id)))));
create policy "vote as self on open polls" on public.poll_votes for all
    using (voter_id = auth.uid())
    with check (voter_id = auth.uid() and exists (
        select 1 from public.polls p where p.id = poll_id and p.status = 'open'
        and (p.owner_id = auth.uid() or (p.team_id is not null and public.is_team_member(p.team_id)))));

create policy "own routing forms" on public.routing_forms for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own webhooks" on public.webhooks for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own slack links" on public.slack_links for select using (user_id = auth.uid());
create policy "own slack links delete" on public.slack_links for delete using (user_id = auth.uid());
create policy "own push tokens" on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime: hosts get live booking updates.
alter publication supabase_realtime add table public.bookings, public.poll_votes;
