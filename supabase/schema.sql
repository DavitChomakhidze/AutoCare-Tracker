create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text;

-- Remove oversized avatar data from auth metadata. Profile photos should live in
-- Storage and only a small URL should be kept in public.profiles.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'avatar_url' - 'picture' - 'image'
where raw_user_meta_data ? 'avatar_url'
  or raw_user_meta_data ? 'picture'
  or raw_user_meta_data ? 'image';

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  manufacturer_id text,
  model_id text,
  manufacturer text not null,
  model text not null,
  production_year integer not null,
  license_plate text not null,
  current_mileage integer not null default 0,
  vin text,
  fuel_type text not null,
  transmission text,
  engine_size text,
  color text,
  date_added date not null default current_date,
  last_service text not null default 'No service records yet',
  next_reminder text not null default 'No reminder set',
  status text not null default 'healthy' check (status in ('healthy', 'needs-attention')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  service_date date not null,
  vehicle_name_snapshot text,
  plate_snapshot text,
  service_type text not null,
  category text not null,
  mileage integer not null,
  workshop text not null default 'Not specified',
  labor_cost numeric(12,2) not null default 0,
  parts_cost numeric(12,2) not null default 0,
  additional_cost numeric(12,2) not null default 0,
  total_cost numeric(12,2) not null default 0,
  status text not null default 'completed' check (status in ('completed', 'scheduled')),
  notes text not null default 'No notes added.',
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null,
  reminder_type text not null default 'General Maintenance',
  due_date date,
  due_mileage integer,
  notes text,
  is_completed boolean not null default false,
  completed_at timestamptz,
  legacy_status text check (legacy_status is null or legacy_status in ('overdue', 'due-soon', 'upcoming', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is not null or due_mileage is not null)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

drop trigger if exists service_records_set_updated_at on public.service_records;
create trigger service_records_set_updated_at before update on public.service_records for each row execute function public.set_updated_at();

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_records enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public" on storage.objects for select to public using (bucket_id = 'avatars');
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects for insert to authenticated with check (
  bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects for update to authenticated using (
  bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]
);
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars' and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own" on public.vehicles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own" on public.vehicles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own" on public.vehicles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own" on public.vehicles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "service_records_select_own" on public.service_records;
create policy "service_records_select_own" on public.service_records for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "service_records_insert_own" on public.service_records;
create policy "service_records_insert_own" on public.service_records for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "service_records_update_own" on public.service_records;
create policy "service_records_update_own" on public.service_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "service_records_delete_own" on public.service_records;
create policy "service_records_delete_own" on public.service_records for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "reminders_select_own" on public.reminders;
create policy "reminders_select_own" on public.reminders for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "reminders_insert_own" on public.reminders;
create policy "reminders_insert_own" on public.reminders for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "reminders_update_own" on public.reminders;
create policy "reminders_update_own" on public.reminders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "reminders_delete_own" on public.reminders;
create policy "reminders_delete_own" on public.reminders for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists vehicles_user_id_idx on public.vehicles using btree (user_id);
create index if not exists vehicles_created_at_idx on public.vehicles using btree (created_at);
create index if not exists service_records_user_id_idx on public.service_records using btree (user_id);
create index if not exists service_records_vehicle_id_idx on public.service_records using btree (vehicle_id);
create index if not exists service_records_service_date_idx on public.service_records using btree (service_date);
create index if not exists reminders_user_id_idx on public.reminders using btree (user_id);
create index if not exists reminders_vehicle_id_idx on public.reminders using btree (vehicle_id);
create index if not exists reminders_due_date_idx on public.reminders using btree (due_date);
create index if not exists reminders_due_mileage_idx on public.reminders using btree (due_mileage);
