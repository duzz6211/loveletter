-- =========================================================================
-- yunyeong.com — 테이블 · RLS · Storage 정책
-- Supabase SQL Editor에 그대로 붙여 실행한다. 여러 번 실행해도 안전하다.
--
-- 전제
--   1. Authentication > Users 에 윤영 전용 계정이 하나 있다.
--      그 계정의 비밀번호가 "처음 만난 날"의 YYYYMMDD 값이다.
--   2. Authentication > Providers > Email 에서 "Allow new users to sign up"
--      을 꺼 둔다. anon key 는 브라우저에 공개되므로 가입이 열려 있으면
--      누구나 계정을 만들 수 있다(만들어도 아래 정책 때문에 아무것도 못 읽지만,
--      계정 목록을 더럽히고 메일 발송 한도를 먹는다).
--
-- ⚠ 실행 전에 딱 한 군데만 고친다 — 아래 OWNER_EMAIL 자리.
-- =========================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()


-- =========================================================================
-- 0. 소유자 판별
--
-- 모든 정책은 "윤영 계정으로 로그인한 세션만 읽을 수 있다"로 통일한다.
-- auth.users 를 읽어야 하므로 security definer 로 만들고, search_path 를
-- 고정해 검색 경로 바꿔치기를 막는다. 실행 권한은 authenticated 에게만 준다.
--
-- 이메일을 안 바꿨거나 오타가 나면 함수는 항상 false 를 돌려준다.
-- 즉 "다 막힘"으로 실패한다(열려버리지 않는다). 아래 9번에서 확인할 수 있다.
-- =========================================================================

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select auth.uid() is not null
     and auth.uid() = (
       select id from auth.users
        where email = 'REPLACE_WITH_YUNYEONG_EMAIL'   -- ← 여기만 고친다
        limit 1
     );
$$;

revoke all on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;


-- =========================================================================
-- 1. 테이블 — 방 여섯 개가 각각 읽어 가는 자리
--    컬럼 이름은 src/data/content.js 의 COLLECTIONS 와 1:1로 맞춘다.
--    한쪽만 바꾸면 화면이 조용히 빈칸이 되므로 같이 고쳐야 한다.
-- =========================================================================

-- /our-story ---------------------------------------------------------------
create table if not exists public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  title       text not null,
  body        text,
  created_at  timestamptz not null default now()
);

-- /about-yunyeong ----------------------------------------------------------
create table if not exists public.about_facts (
  id        uuid primary key default gen_random_uuid(),
  category  text not null,
  label     text not null,
  body      text,
  position  int  not null default 0
);

-- /messages ----------------------------------------------------------------
create table if not exists public.messages (
  id    bigint generated always as identity primary key,
  body  text not null,
  tone  text not null default 'love'
);

-- /future ------------------------------------------------------------------
-- 제목과 열람 예정일은 항상 보인다. 본문은 다른 테이블에 두고, 열람 시각이
-- 지나야 내려가도록 RLS로 막는다. 본문이 애초에 브라우저까지 오지 않으므로
-- 개발자 도구로 미리 볼 수 없다 — 이 분리가 이 방의 핵심이다.
create table if not exists public.future_letters (
  id      uuid primary key default gen_random_uuid(),
  title   text not null,
  open_at timestamptz not null
);

create table if not exists public.future_letter_bodies (
  letter_id uuid primary key references public.future_letters(id) on delete cascade,
  body      text not null
);

-- /places ------------------------------------------------------------------
create table if not exists public.places (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  visited_on date,
  note       text,
  photo_path text          -- private-media 버킷 안의 경로. 없으면 null.
);

-- /secret ------------------------------------------------------------------
create table if not exists public.secret_notes (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  media_path text,         -- private-media 버킷 안의 경로. 없으면 null.
  position   int not null default 0
);


-- =========================================================================
-- 2. 정렬용 인덱스
--    화면마다 order by 가 정해져 있다(src/data/content.js). 행이 몇 십 개라
--    없어도 돌지만, 정렬 컬럼에 인덱스를 두는 편이 정직하다.
-- =========================================================================

create index if not exists timeline_events_occurred_on_idx on public.timeline_events (occurred_on);
create index if not exists about_facts_position_idx        on public.about_facts (position);
create index if not exists future_letters_open_at_idx      on public.future_letters (open_at);
create index if not exists places_visited_on_idx           on public.places (visited_on);
create index if not exists secret_notes_position_idx       on public.secret_notes (position);


-- =========================================================================
-- 3. 권한 — anon 에게서는 테이블 자체를 걷어낸다
--
-- RLS만으로도 anon 은 0행을 받는다. 하지만 실수로 RLS를 끄는 순간 전부
-- 새어 나가므로, 잠금을 두 겹으로 둔다. 쓰기 권한은 누구에게도 주지 않는다
-- (내용은 대시보드나 service_role 로만 넣는다. service_role 은 RLS를 우회한다).
-- =========================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'timeline_events', 'about_facts', 'messages',
    'future_letters', 'future_letter_bodies', 'places', 'secret_notes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;


-- =========================================================================
-- 4. RLS — 기본은 전부 차단, 소유자 세션에만 select 를 연다
-- =========================================================================

drop policy if exists "owner reads timeline" on public.timeline_events;
create policy "owner reads timeline" on public.timeline_events
  for select to authenticated using (public.is_owner());

drop policy if exists "owner reads about" on public.about_facts;
create policy "owner reads about" on public.about_facts
  for select to authenticated using (public.is_owner());

drop policy if exists "owner reads messages" on public.messages;
create policy "owner reads messages" on public.messages
  for select to authenticated using (public.is_owner());

drop policy if exists "owner reads letters" on public.future_letters;
create policy "owner reads letters" on public.future_letters
  for select to authenticated using (public.is_owner());

-- 이 방의 핵심 한 줄: 본문은 열람 시각이 지난 편지에만 내려간다.
-- 시계는 서버(now())의 것이다. 브라우저 시간을 바꿔도 앞당길 수 없다.
drop policy if exists "owner reads opened bodies" on public.future_letter_bodies;
create policy "owner reads opened bodies" on public.future_letter_bodies
  for select to authenticated using (
    public.is_owner()
    and exists (
      select 1 from public.future_letters l
       where l.id = future_letter_bodies.letter_id
         and l.open_at <= now()
    )
  );

drop policy if exists "owner reads places" on public.places;
create policy "owner reads places" on public.places
  for select to authenticated using (public.is_owner());

drop policy if exists "owner reads secrets" on public.secret_notes;
create policy "owner reads secrets" on public.secret_notes
  for select to authenticated using (public.is_owner());


-- =========================================================================
-- 5. Storage — 비공개 버킷
--    사진·영상은 여기 올리고, 테이블에는 경로만 적는다.
--    화면은 createSignedUrl() 로 30분짜리 임시 주소를 받아 쓴다
--    (src/lib/content.js). 버킷이 public 이면 이 서명이 무의미해진다.
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('private-media', 'private-media', false)
on conflict (id) do nothing;

drop policy if exists "owner reads private media" on storage.objects;
create policy "owner reads private media" on storage.objects
  for select to authenticated
  using (bucket_id = 'private-media' and public.is_owner());

-- 업로드는 대시보드 또는 service_role 로만 한다.
-- 클라이언트에 insert/update/delete 정책을 열지 않는다.


-- =========================================================================
-- 6. 확인 — 아래 세 줄을 SQL Editor에서 그대로 실행해 본다
-- =========================================================================

-- (1) 이메일을 실제로 바꿨는가. false 여야 한다.
select prosrc like '%REPLACE_WITH_YUNYEONG_EMAIL%' as "아직 안 바꿈"
  from pg_proc where proname = 'is_owner';

-- (2) 그 이메일의 계정이 실제로 있는가. 1이어야 한다.
--     (아래 이메일도 같이 바꿔서 실행한다)
-- select count(*) as "계정 수" from auth.users where email = 'REPLACE_WITH_YUNYEONG_EMAIL';

-- (3) 익명 세션에서는 아예 권한이 없어야 한다.
--     3번에서 anon 의 테이블 권한을 걷어냈으므로, 아래는 0행이 아니라
--     "permission denied for table timeline_events" 로 실패하는 게 정상이다.
--     0이 나오면 RLS만 걸리고 권한은 남아 있다는 뜻이고,
--     0보다 큰 수가 나오면 RLS가 안 걸린 것이다 — 둘 다 다시 봐야 한다.
set role anon;
select count(*) as "anon 이 보는 행" from public.timeline_events;
reset role;


-- =========================================================================
-- 7. (선택) 샘플 행 — /places 복도를 실제로 걸어 보고 싶을 때만
--
-- ⚠ 기본은 주석 처리해 둔다. 이걸 넣으면 화면은 "정상적으로 데이터를 받은"
--    상태가 되어 안내 문구가 사라지고, 대괄호 문구가 진짜 기록인 것처럼
--    걸린다. 구조만 보고 싶다면 넣지 말고 빈 테이블로 두는 편이 낫다
--    (비어 있으면 화면이 "아직 비어 있어요"라고 알려준다).
--
--    넣었다가 지우려면:  delete from public.places where name like '[%]';
-- =========================================================================

-- insert into public.places (name, visited_on, note, photo_path)
-- select * from (values
--     ('[첫 번째 장소]',   date '2024-01-01', '[이 장소의 기억]', 'places/01.jpg'),
--     ('[두 번째 장소]',   date '2024-03-16', '[이 장소의 기억]', 'places/02.jpg'),
--     ('[세 번째 장소]',   date '2024-05-04', '[이 장소의 기억]', null),
--     ('[네 번째 장소]',   date '2024-07-27', '[이 장소의 기억]', 'places/04.jpg'),
--     ('[다섯 번째 장소]', date '2024-10-12', '[이 장소의 기억]', null),
--     ('[여섯 번째 장소]', date '2024-12-24', '[이 장소의 기억]', 'places/06.jpg')
--   ) as sample(name, visited_on, note, photo_path)
--  where not exists (select 1 from public.places);
