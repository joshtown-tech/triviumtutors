-- Trivium Tutors: every request that reaches screening is stored here as a
-- backup record next to the email and Slack notifications. Run once in the
-- Supabase SQL editor.
--
-- Row level security is ON with no policies: the public anon key can read and
-- write nothing. Only the server, using the service role key, touches this table.

create table if not exists public.requests (
  id           text primary key,                 -- e.g. TT-VUD9V0HF, same id the customer sees
  created_at   timestamptz not null default now(),
  verdict      text not null check (verdict in ('qualified','review','declined','reject')),
  score        integer,
  reasons      text[] not null default '{}',
  summary      text,
  notified     boolean not null default false,   -- did the team get an email or Slack message
  service      text not null,
  subject      text not null,
  level        text not null,
  deadline     text,
  details      text not null,
  word_count   integer,
  style        text,
  name         text not null,
  email        text not null,
  country      text not null,
  timezone     text,
  contact_pref text not null,
  whatsapp     text
);

create index if not exists requests_created_idx on public.requests (created_at desc);
create index if not exists requests_verdict_idx on public.requests (verdict, created_at desc);

alter table public.requests enable row level security;
revoke all on public.requests from anon, authenticated;
