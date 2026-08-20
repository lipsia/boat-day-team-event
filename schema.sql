-- ============================================================
-- Lipsia Digital — Team Event
-- Im Supabase SQL-Editor einmal komplett ausführen.
-- ============================================================

-- ---------- Essenswünsche ----------
create table if not exists public.wishes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item       text not null check (char_length(trim(item)) between 1 and 80),
  amount     text not null check (char_length(trim(amount)) between 1 and 40),
  author     text not null check (char_length(trim(author)) between 1 and 60)
);

-- ---------- Mitfahrgelegenheiten ----------
create table if not exists public.rides (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind       text not null check (kind in ('offer', 'need')),
  author     text not null check (char_length(trim(author)) between 1 and 60),
  seats      int  not null default 1 check (seats between 1 and 20),
  pickup     text not null check (char_length(trim(pickup)) between 1 and 120),
  note       text check (note is null or char_length(note) <= 140)
);

-- ---------- Zugriff ----------
-- Row Level Security an, dann bewusst öffnen: jeder mit dem Link darf
-- lesen, eintragen und löschen. Kein Login nötig — passend für eine
-- interne Team-Seite, die nicht verlinkt/indexiert wird.

alter table public.wishes enable row level security;
alter table public.rides  enable row level security;

drop policy if exists "wishes public read"   on public.wishes;
drop policy if exists "wishes public insert" on public.wishes;
drop policy if exists "wishes public delete" on public.wishes;

create policy "wishes public read"   on public.wishes for select using (true);
create policy "wishes public insert" on public.wishes for insert with check (true);
create policy "wishes public delete" on public.wishes for delete using (true);

drop policy if exists "rides public read"   on public.rides;
drop policy if exists "rides public insert" on public.rides;
drop policy if exists "rides public delete" on public.rides;

create policy "rides public read"   on public.rides for select using (true);
create policy "rides public insert" on public.rides for insert with check (true);
create policy "rides public delete" on public.rides for delete using (true);
