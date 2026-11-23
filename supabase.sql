-- Verb Quest – Supabase setup. Run once in Supabase: SQL Editor -> New query -> Run.
-- The browser never touches the table directly: RLS is on with no policies,
-- and all access goes through the two SECURITY DEFINER functions below.

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  room        text not null,
  first_name  text not null,
  last_name   text not null,
  points      integer not null,
  accuracy    numeric(5,1) not null,
  rank_title  text not null,
  duration_s  integer not null,
  details     jsonb not null default '{}'::jsonb
);

create index if not exists scores_room_created_idx on public.scores (room, created_at desc);

alter table public.scores enable row level security;
-- No policies on purpose: anon/authenticated cannot select/insert/update/delete directly.
revoke all on table public.scores from anon, authenticated;

-- Save one result (called by the game at the end).
create or replace function public.submit_score(
  p_room        text,
  p_first_name  text,
  p_last_name   text,
  p_points      integer,
  p_accuracy    numeric,
  p_rank_title  text,
  p_duration_s  integer,
  p_details     jsonb default '{}'::jsonb
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_recent integer;
begin
  p_room := upper(trim(p_room));
  p_first_name := trim(p_first_name);
  p_last_name := trim(p_last_name);

  if p_room !~ '^[A-Z0-9_-]{2,40}$' then raise exception 'invalid room'; end if;
  if char_length(p_first_name) not between 2 and 40 or char_length(p_last_name) not between 2 and 40 then
    raise exception 'invalid name';
  end if;
  -- Realistic maximum is ~20 000 points (77 tasks + speed round); anything above is not a real game.
  if p_points is null or p_points < 0 or p_points > 40000 then raise exception 'invalid points'; end if;
  if p_accuracy is null or p_accuracy < 0 or p_accuracy > 100 then raise exception 'invalid accuracy'; end if;
  if p_rank_title not in ('GOAT', 'Rizzler', 'Main Character', 'NPC', 'Skill issue') then raise exception 'invalid rank'; end if;
  -- A real game takes several minutes; reject instant submissions.
  if p_duration_s is null or p_duration_s < 180 or p_duration_s > 4 * 3600 then raise exception 'invalid duration'; end if;
  if pg_column_size(p_details) > 8000 then raise exception 'details too large'; end if;

  -- Flood protection: max 3 results per student per room in 10 minutes.
  select count(*) into v_recent
  from public.scores s
  where s.room = p_room
    and lower(s.first_name) = lower(p_first_name)
    and lower(s.last_name) = lower(p_last_name)
    and s.created_at > now() - interval '10 minutes';
  if v_recent >= 3 then raise exception 'too many submissions'; end if;

  insert into public.scores (room, first_name, last_name, points, accuracy, rank_title, duration_s, details)
  values (p_room, p_first_name, p_last_name, p_points, round(p_accuracy, 1), p_rank_title, p_duration_s, coalesce(p_details, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

-- Read the leaderboard of one room for one day (local Prague date).
-- Without the room code nobody can list the results.
create or replace function public.get_leaderboard(p_room text, p_day date)
returns table (
  first_name  text,
  last_name   text,
  points      integer,
  accuracy    numeric,
  rank_title  text,
  duration_s  integer,
  created_at  timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.first_name, s.last_name, s.points, s.accuracy, s.rank_title, s.duration_s, s.created_at
  from public.scores s
  where s.room = upper(trim(p_room))
    and (s.created_at at time zone 'Europe/Prague')::date = p_day
  order by s.points desc
  limit 1000;
$$;

revoke all on function public.submit_score(text, text, text, integer, numeric, text, integer, jsonb) from public;
revoke all on function public.get_leaderboard(text, date) from public;
grant execute on function public.submit_score(text, text, text, integer, numeric, text, integer, jsonb) to anon, authenticated;
grant execute on function public.get_leaderboard(text, date) to anon, authenticated;

-- Housekeeping (run manually, e.g. at the end of the school year):
-- delete from public.scores where created_at < now() - interval '1 year';
