-- Private safety data. Only the Qipi server uses its secret key to access these tables.
create table if not exists public.qipi_safety_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 3 and 40),
  created_at timestamptz not null default now()
);
create index if not exists qipi_safety_contacts_user on public.qipi_safety_contacts(user_id);

create table if not exists public.qipi_safety_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  position_at timestamptz,
  expires_at timestamptz not null,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  constraint valid_lat check (latitude is null or latitude between -90 and 90),
  constraint valid_lon check (longitude is null or longitude between -180 and 180)
);
create index if not exists qipi_safety_sessions_user on public.qipi_safety_sessions(user_id, created_at desc);

create table if not exists public.qipi_safety_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid,
  status text not null check (status in ('safe', 'arrived')),
  created_at timestamptz not null default now()
);
create index if not exists qipi_safety_checkins_user on public.qipi_safety_checkins(user_id, created_at desc);

alter table public.qipi_safety_contacts enable row level security;
alter table public.qipi_safety_sessions enable row level security;
alter table public.qipi_safety_checkins enable row level security;
revoke all on public.qipi_safety_contacts, public.qipi_safety_sessions, public.qipi_safety_checkins from anon, authenticated;
grant all on public.qipi_safety_contacts, public.qipi_safety_sessions, public.qipi_safety_checkins to service_role;
