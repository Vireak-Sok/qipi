create table if not exists public.qipi_conversations (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint qipi_conversations_distinct_users check (user_low < user_high),
  constraint qipi_conversations_pair_unique unique (user_low, user_high)
);

create index if not exists qipi_conversations_user_low_updated on public.qipi_conversations (user_low, updated_at desc);
create index if not exists qipi_conversations_user_high_updated on public.qipi_conversations (user_high, updated_at desc);

create table if not exists public.qipi_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.qipi_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint qipi_messages_not_empty check (length(trim(body)) > 0)
);

create index if not exists qipi_messages_conversation_created on public.qipi_messages (conversation_id, created_at desc, id desc);
create index if not exists qipi_messages_unread on public.qipi_messages (conversation_id, read_at) where read_at is null;

create or replace function public.qipi_touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.qipi_conversations set updated_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists qipi_message_updates_conversation on public.qipi_messages;
create trigger qipi_message_updates_conversation
  after insert on public.qipi_messages
  for each row execute function public.qipi_touch_conversation_on_message();

alter table public.qipi_conversations enable row level security;
alter table public.qipi_messages enable row level security;
revoke all on public.qipi_conversations, public.qipi_messages from anon;
grant select, insert on public.qipi_conversations to authenticated;
grant select, insert on public.qipi_messages to authenticated;
grant update (read_at) on public.qipi_messages to authenticated;
grant all on public.qipi_conversations, public.qipi_messages to service_role;

create policy "conversation members can read their conversations"
  on public.qipi_conversations for select to authenticated
  using (auth.uid() = user_low or auth.uid() = user_high);
create policy "conversation members can create a direct conversation"
  on public.qipi_conversations for insert to authenticated
  with check ((auth.uid() = user_low or auth.uid() = user_high) and user_low < user_high);
create policy "conversation members can read messages"
  on public.qipi_messages for select to authenticated
  using (exists (
    select 1 from public.qipi_conversations c
    where c.id = conversation_id and (auth.uid() = c.user_low or auth.uid() = c.user_high)
  ));
create policy "conversation members can send as themselves"
  on public.qipi_messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (
    select 1 from public.qipi_conversations c
    where c.id = conversation_id and (auth.uid() = c.user_low or auth.uid() = c.user_high)
  ));
create policy "conversation members can mark messages read"
  on public.qipi_messages for update to authenticated
  using (exists (
    select 1 from public.qipi_conversations c
    where c.id = conversation_id and (auth.uid() = c.user_low or auth.uid() = c.user_high)
  ) and sender_id <> auth.uid())
  with check (exists (
    select 1 from public.qipi_conversations c
    where c.id = conversation_id and (auth.uid() = c.user_low or auth.uid() = c.user_high)
  ) and sender_id <> auth.uid());
