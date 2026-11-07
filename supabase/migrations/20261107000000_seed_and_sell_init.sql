-- Seed & Sell — initial schema
-- Derived from the React app's Supabase calls (profiles, listings, chat_rooms, chat_messages).

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  phone_number text,
  location     text,
  user_role    text check (user_role in ('farmer', 'buyer')),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Seller names are shown on listing pages and in chat, so profiles are world-readable.
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists public.listings (
  id                 uuid primary key default gen_random_uuid(),
  farmer_id          uuid not null references public.profiles (id) on delete cascade,
  category           text not null check (category in ('produce', 'inputs', 'services')),
  sub_category       text,
  product_name       text not null,
  price              numeric(12, 2),
  quantity_available numeric(12, 2),
  location           text,
  description        text,
  main_image_url     text,
  created_at         timestamptz not null default now()
);

create index if not exists listings_farmer_id_idx  on public.listings (farmer_id);
create index if not exists listings_category_idx   on public.listings (category);
create index if not exists listings_created_at_idx on public.listings (created_at desc);

alter table public.listings enable row level security;

drop policy if exists "listings are viewable by everyone" on public.listings;
create policy "listings are viewable by everyone"
  on public.listings for select
  using (true);

-- The dashboard's update/delete calls rely on RLS to scope rows to the owner.
drop policy if exists "farmers can insert their own listings" on public.listings;
create policy "farmers can insert their own listings"
  on public.listings for insert
  with check (auth.uid() = farmer_id);

drop policy if exists "farmers can update their own listings" on public.listings;
create policy "farmers can update their own listings"
  on public.listings for update
  using (auth.uid() = farmer_id)
  with check (auth.uid() = farmer_id);

drop policy if exists "farmers can delete their own listings" on public.listings;
create policy "farmers can delete their own listings"
  on public.listings for delete
  using (auth.uid() = farmer_id);

-- ============================================================
-- CHAT ROOMS
-- ============================================================
create table if not exists public.chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  buyer_id   uuid not null references public.profiles (id) on delete cascade,
  farmer_id  uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chat_rooms_distinct_participants check (buyer_id <> farmer_id),
  constraint chat_rooms_unique_pair unique (buyer_id, farmer_id)
);

create index if not exists chat_rooms_buyer_id_idx  on public.chat_rooms (buyer_id);
create index if not exists chat_rooms_farmer_id_idx on public.chat_rooms (farmer_id);

alter table public.chat_rooms enable row level security;

drop policy if exists "participants can view their rooms" on public.chat_rooms;
create policy "participants can view their rooms"
  on public.chat_rooms for select
  using (auth.uid() in (buyer_id, farmer_id));

drop policy if exists "participants can create rooms" on public.chat_rooms;
create policy "participants can create rooms"
  on public.chat_rooms for insert
  with check (auth.uid() in (buyer_id, farmer_id));

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid not null references public.chat_rooms (id) on delete cascade,
  sender_id       uuid not null references public.profiles (id) on delete cascade,
  message_content text not null,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists chat_messages_room_id_created_at_idx
  on public.chat_messages (room_id, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "participants can read room messages" on public.chat_messages;
create policy "participants can read room messages"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = chat_messages.room_id
        and auth.uid() in (r.buyer_id, r.farmer_id)
    )
  );

drop policy if exists "participants can send messages as themselves" on public.chat_messages;
create policy "participants can send messages as themselves"
  on public.chat_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chat_rooms r
      where r.id = chat_messages.room_id
        and auth.uid() in (r.buyer_id, r.farmer_id)
    )
  );

-- Reading a conversation flips is_read on the other person's messages,
-- so this update is scoped to the room rather than to the sender.
drop policy if exists "participants can mark room messages read" on public.chat_messages;
create policy "participants can mark room messages read"
  on public.chat_messages for update
  using (
    exists (
      select 1 from public.chat_rooms r
      where r.id = chat_messages.room_id
        and auth.uid() in (r.buyer_id, r.farmer_id)
    )
  )
  with check (
    exists (
      select 1 from public.chat_rooms r
      where r.id = chat_messages.room_id
        and auth.uid() in (r.buyer_id, r.farmer_id)
    )
  );

-- Realtime: the Messages page subscribes to INSERTs on chat_messages.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- ============================================================
-- STORAGE — product images
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product_images',
  'product_images',
  true,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product_images');

drop policy if exists "authenticated users can upload product images" on storage.objects;
create policy "authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product_images');

drop policy if exists "owners can update their product images" on storage.objects;
create policy "owners can update their product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product_images' and owner = auth.uid());

drop policy if exists "owners can delete their product images" on storage.objects;
create policy "owners can delete their product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product_images' and owner = auth.uid());
