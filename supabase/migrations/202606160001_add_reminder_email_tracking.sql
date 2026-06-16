alter table public.reminders add column if not exists reminder_email_sent_at timestamptz;
alter table public.reminders add column if not exists reminder_email_last_status text;

create index if not exists reminders_email_due_idx
  on public.reminders using btree (is_completed, reminder_email_sent_at, due_date);
