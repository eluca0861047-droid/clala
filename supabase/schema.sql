-- =======================================================
-- 피아노학원 보강/정규 시간표 예약 시스템 (Supabase SQL Schema)
-- Supabase 대시보드 -> SQL Editor에 복사하여 붙여넣고 [RUN] 하세요.
-- =======================================================

-- 1. 학생 테이블 (students)
create table if not exists public.students (
  id text primary key,
  name text not null,
  grade text default '',
  phone text default '',
  makeup_tickets integer default 0,
  regular_slots jsonb default '[]'::jsonb,
  avatar_bg text default 'bg-blue-100 text-blue-700',
  access_code text unique,
  created_at timestamptz default now()
);

-- 2. 보강/특강/상담 예약 테이블 (bookings)
create table if not exists public.bookings (
  id text primary key,
  date text not null,          -- YYYY-MM-DD
  time text not null,          -- HH:mm
  duration integer default 30, -- 30 | 60
  type text not null,          -- 'makeup' | 'special' | 'counseling'
  student_id text not null,
  student_name text not null,
  counseling_type text,
  memo text,
  created_at timestamptz default now()
);

-- 3. 결석 신청 테이블 (absences)
create table if not exists public.absences (
  id text primary key,
  student_id text not null,
  student_name text not null,
  date text not null,          -- YYYY-MM-DD
  time text not null,          -- HH:mm
  reason text,
  created_at timestamptz default now()
);

-- 4. 슬롯 잠금 / 휴식 테이블 (slot_locks)
create table if not exists public.slot_locks (
  id text primary key,
  date text,                   -- 특정 날짜(비어있으면 매일 반복)
  time text not null,          -- HH:mm
  is_recurring_daily boolean default false,
  reason text default '',
  created_at timestamptz default now()
);

-- 5. 활동/알림 피드 로그 테이블 (activity_logs)
create table if not exists public.activity_logs (
  id text primary key,
  type text not null,          -- 'booking' | 'cancel' | 'absence' | 'admin' | 'ticket'
  message text not null,
  timestamp text not null,
  student_name text,
  created_at timestamptz default now()
);

-- =======================================================
-- 인덱스 설정 (조회 성능 최적화)
-- =======================================================
create index if not exists idx_bookings_date on public.bookings (date);
create index if not exists idx_bookings_student on public.bookings (student_id);
create index if not exists idx_absences_date on public.absences (date);
create index if not exists idx_activity_logs_created on public.activity_logs (created_at desc);

-- =======================================================
-- Row Level Security (RLS) 및 공개 권한 허용
-- 학부모 링크 및 원장님 접속을 위해 anon 역할에 대해 CRUD 허용
-- =======================================================
alter table public.students enable row level security;
alter table public.bookings enable row level security;
alter table public.absences enable row level security;
alter table public.slot_locks enable row level security;
alter table public.activity_logs enable row level security;

-- students 정책
drop policy if exists "Enable all for students" on public.students;
create policy "Enable all for students" on public.students for all using (true) with check (true);

-- bookings 정책
drop policy if exists "Enable all for bookings" on public.bookings;
create policy "Enable all for bookings" on public.bookings for all using (true) with check (true);

-- absences 정책
drop policy if exists "Enable all for absences" on public.absences;
create policy "Enable all for absences" on public.absences for all using (true) with check (true);

-- slot_locks 정책
drop policy if exists "Enable all for slot_locks" on public.slot_locks;
create policy "Enable all for slot_locks" on public.slot_locks for all using (true) with check (true);

-- activity_logs 정책
drop policy if exists "Enable all for activity_logs" on public.activity_logs;
create policy "Enable all for activity_logs" on public.activity_logs for all using (true) with check (true);

-- =======================================================
-- 실시간(Realtime) 변경 알림 활성화
-- 학부모가 예약 시 원장님 화면에 새로고침 없이 즉시 반영되도록 설정
-- =======================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'students') then
    alter publication supabase_realtime add table public.students;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bookings') then
    alter publication supabase_realtime add table public.bookings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'absences') then
    alter publication supabase_realtime add table public.absences;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'slot_locks') then
    alter publication supabase_realtime add table public.slot_locks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'activity_logs') then
    alter publication supabase_realtime add table public.activity_logs;
  end if;
end $$;
