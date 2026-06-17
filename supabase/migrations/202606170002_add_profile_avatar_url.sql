alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'avatars';

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'avatar_url' - 'picture' - 'image'
where raw_user_meta_data ? 'avatar_url'
  or raw_user_meta_data ? 'picture'
  or raw_user_meta_data ? 'image';
