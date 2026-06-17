create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  source_type text,
  source_id uuid,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists notifications_source_unique_idx
  on public.notifications (user_id, source_type, source_id, type);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists notifications_user_created_idx on public.notifications using btree (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications using btree (user_id, read_at, deleted_at);
