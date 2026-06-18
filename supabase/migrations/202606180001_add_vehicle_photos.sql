alter table public.vehicles add column if not exists photo_url text;
alter table public.vehicles add column if not exists photo_path text;

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do update set public = excluded.public;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'vehicle-photos';

drop policy if exists "vehicle_photos_select_public" on storage.objects;
create policy "vehicle_photos_select_public" on storage.objects for select to public using (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle_photos_insert_own" on storage.objects;
create policy "vehicle_photos_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'vehicle-photos' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "vehicle_photos_update_own" on storage.objects;
create policy "vehicle_photos_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'vehicle-photos' and (select auth.uid())::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'vehicle-photos' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "vehicle_photos_delete_own" on storage.objects;
create policy "vehicle_photos_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'vehicle-photos' and (select auth.uid())::text = (storage.foldername(name))[1]
);
