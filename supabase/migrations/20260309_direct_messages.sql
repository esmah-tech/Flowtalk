-- Direct messages table
create table if not exists direct_messages (
  id          uuid        primary key default gen_random_uuid(),
  sender_id   uuid        references profiles(id) on delete cascade not null,
  receiver_id uuid        references profiles(id) on delete cascade not null,
  content     text        not null default '',
  file_url    text,
  file_name   text,
  created_at  timestamptz default now() not null
);

alter table direct_messages enable row level security;

create policy "Users can view DMs they are part of"
  on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send DMs as themselves"
  on direct_messages for insert
  with check (auth.uid() = sender_id);

-- Index for fast pair queries
create index if not exists dm_pair_idx
  on direct_messages (sender_id, receiver_id, created_at);
create index if not exists dm_receiver_idx
  on direct_messages (receiver_id, created_at);
