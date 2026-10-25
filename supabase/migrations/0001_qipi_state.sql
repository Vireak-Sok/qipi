-- Qipi MVP persistence. Only the server-side Supabase secret key may access
-- this table. The version column enables compare-and-swap writes across
-- independent Vercel function instances.
create table if not exists public.qipi_state (
  id smallint primary key default 1 check (id = 1),
  version bigint not null default 0 check (version >= 0),
  data jsonb not null check (jsonb_typeof(data) = 'object')
);

alter table public.qipi_state enable row level security;
revoke all on public.qipi_state from anon, authenticated;
grant select, update on public.qipi_state to service_role;

insert into public.qipi_state (id, version, data)
values (
  1,
  0,
  jsonb_build_object(
    'trips', '[]'::jsonb,
    'joinRequests', '[]'::jsonb,
    'routeUpdates', '[]'::jsonb,
    'reports', '[]'::jsonb,
    'events', '[]'::jsonb
  )
)
on conflict (id) do nothing;
