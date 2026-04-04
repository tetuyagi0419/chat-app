-- ============================================================
-- Supabase SQL Editor に貼り付けて実行してください
-- ============================================================

-- ユーザープロフィール（Supabase Auth と連携）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- チャットルーム
create table public.rooms (
  id text primary key,
  name text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- メッセージ
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id text references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- インデックス（メッセージ取得の高速化）
create index messages_room_id_created_at_idx on public.messages(room_id, created_at);

-- ============================================================
-- Row Level Security（RLS）
-- ============================================================

alter table public.profiles enable row level security;
alter table public.rooms    enable row level security;
alter table public.messages enable row level security;

-- プロフィール
create policy "プロフィールは誰でも閲覧可" on public.profiles
  for select using (true);

create policy "自分のプロフィールのみ編集可" on public.profiles
  for all using (auth.uid() = id);

-- ルーム
create policy "ルームはログイン済みユーザーが閲覧可" on public.rooms
  for select using (auth.role() = 'authenticated');

-- メッセージ
create policy "メッセージはログイン済みユーザーが閲覧可" on public.messages
  for select using (auth.role() = 'authenticated');

create policy "ログイン済みユーザーはメッセージ送信可" on public.messages
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- Supabase Realtime の有効化
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 初期データ（デフォルトルーム）
-- ============================================================
insert into public.rooms (id, name) values ('general', 'ゼネラル');

-- ============================================================
-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
