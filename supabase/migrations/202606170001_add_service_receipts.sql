alter table public.service_records add column if not exists receipt_path text;
alter table public.service_records add column if not exists receipt_file_name text;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = excluded.public;

update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'avatars';

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
where id = 'receipts';

drop policy if exists "receipts_select_own" on storage.objects;
create policy "receipts_select_own" on storage.objects for select to authenticated using (
  bucket_id = 'receipts' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "receipts_insert_own" on storage.objects;
create policy "receipts_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "receipts_update_own" on storage.objects;
create policy "receipts_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'receipts' and (select auth.uid())::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'receipts' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "receipts_delete_own" on storage.objects;
create policy "receipts_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'receipts' and (select auth.uid())::text = (storage.foldername(name))[1]
);
