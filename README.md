# yunyeong.com

윤영 한 사람을 위한 개인 아카이브.
열 개의 벽을 지나고 처음 만난 날을 맞혀야 안쪽 기록에 닿을 수 있다.

**React 18 + Vite + React Router + Supabase Auth.**

---

## 1. 빠른 시작

```bash
npm install
cp .env.example .env     # 값 채우기 (아래 3번 참고)
npm run dev              # http://localhost:5173
```

Supabase 값을 아직 넣지 않아도 **미궁 열 개 벽은 그대로 동작하고, 테스트 모드로
아카이브까지 들어가 볼 수 있다.** (아래 1-1 참고)

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | `dist/` 로 프로덕션 빌드 |
| `npm run preview` | 빌드 결과를 SPA fallback 포함해 미리보기 |

> WSL에서 쓴다면 `nvm` 이 로드된 셸에서 실행한다. `which node` 가
> `/mnt/c/...` 를 가리키면 윈도우 node를 쓰고 있는 것이라 네이티브 바이너리가
> 어긋난다. `source ~/.nvm/nvm.sh` 후 다시 실행하면 된다.

### 1-1. 테스트 모드 (Supabase 키 없이 확인하기)

인증 키가 아직 없어도 **미궁 → 마지막 봉인 → 아카이브** 흐름 전체를 따라가 볼 수 있다.

- Supabase 환경변수가 비어 있으면 **자동으로 켜진다.** 따로 설정할 게 없다.
- 마지막 봉인은 `YYYY.MM.DD` 형식만 맞으면 **아무 날짜로나** 열린다.
  `VITE_DEMO_DATE=20230415` 처럼 특정 날짜만 통과시키고 싶으면 `.env` 에 넣는다.
- 미궁 오른쪽 아래 **`테스트 · 마지막 봉인으로 건너뛰기`** 버튼으로 열 개 벽을 건너뛴다.
- 화면 왼쪽 아래에 테스트 모드 안내가 뜨고, 각 방은 `src/data/content.js` 의
  placeholder 구조만 보여준다. 미래 편지의 남은 시간 표시가 실제로 어떻게 도는지
  볼 수 있도록, placeholder 편지의 열람 시각만 지금을 기준으로 잡아 둔다.

```bash
VITE_DEMO_MODE=true    # 강제로 켜기
VITE_DEMO_MODE=false   # 강제로 끄기 (Supabase 인증만 사용)
```

이 모드에서 만드는 세션은 **브라우저 안에서만 존재하는 가짜 세션**(`sessionStorage`,
탭을 닫으면 사라짐)이다. 서버가 검증한 것이 아니므로 실제 비공개 데이터는 붙지 않는다.
Supabase 값을 채우는 순간 자동으로 꺼지고 원래의 서버 인증으로 돌아간다.

---

## 2. 구조

```
src/
├── main.jsx                       BrowserRouter + SessionProvider
├── App.jsx                        라우트 정의
├── data/
│   ├── maze.js                    ← 열 개의 벽 질문·문구·타이밍. 문구 수정은 여기서
│   ├── rooms.js                   ← 문 여섯 개와 방. 벽 색·천장 메모·벽 소품은 여기서
│   └── content.js                 테이블 정의 + placeholder
├── lib/
│   ├── supabase.js                클라이언트 단일 진입점 (VITE_* 만 읽는다)
│   ├── auth.js                    날짜 정규화 · 시도 제한 · 로그인/로그아웃
│   ├── content.js                 보호 콘텐츠 데이터 접근 계층
│   └── useCollection.js           목록 하나를 불러오는 공통 훅 (+ refetch)
├── session/SessionProvider.jsx     앱 전체가 공유하는 하나의 세션 상태
├── routes/RequireAuth.jsx          보호 라우트 가드
├── components/
│   ├── maze/
│   │   ├── Maze.jsx               미궁 공간 전체
│   │   ├── useMazeMachine.js      진행 상태 기계 + 카메라
│   │   ├── WallPanel.jsx          확대된 벽판
│   │   └── EscapeAnswers.jsx      열 번째 벽의 도망치는 "아니오"
│   ├── room/
│   │   ├── DoorHall.jsx           로비 — 여섯 개의 문이 늘어선 복도
│   │   ├── RoomShell.jsx          방 한 칸 (벽·바닥·천장·매단 메모·나가는 문)
│   │   ├── useDoorTransition.js   문 열림 → 카메라 접근 → 다음 화면
│   │   ├── GalleryWalk.jsx        전시 복도 — 한 걸음씩 걸어 들어간다
│   │   └── FuseTimer.jsx          미래 편지의 남은 시간 표시창
│   ├── Gate.jsx                   마지막 날짜 인증
│   ├── ArchiveLayout.jsx          인증 이후 공통 셸 + 얇은 HUD
│   └── AuthVeil / DataNotice / Empty / PrivateMedia
├── pages/                         로비 1개 + 방 6개
└── styles/
    ├── tokens.css                 색·타이포·리듬 토큰
    ├── maze.css                   미궁
    ├── rooms.css                  공간 공용 부품(벽·바닥·천장·카메라) + 로비
    ├── room-shell.css             방 한 칸의 뼈대
    ├── room-features.css          방마다 다른 설치물
    └── archive.css                방 안에서 공통으로 쓰는 조각(버튼·사진 자리)
```

### 문을 열고 들어가는 구조

인증 이후 화면은 문서가 아니라 **공간**이다.

- `/archive` 는 카드 목록이 아니라 **여섯 개의 문이 늘어선 복도(로비)** 다.
  문을 누르면 문짝이 열리고 → 카메라가 그 문으로 다가가고 → 빛이 차오른 뒤
  방에 도착한다. 방에서는 오른쪽 아래의 문으로 복도에 돌아온다.
- 방마다 좌우 벽·바닥·천장이 있고, 천장에는 메모지가 매달려 흔들리고
  벽에는 액자·선반·시계가 걸린다. 문구와 소품은 전부 `src/data/rooms.js` 에 있다.
- 화면이 좁아지면 벽 바깥 여백이 없으므로 소품은 접히고 메모는 두 장만 남는다.
  `prefers-reduced-motion` 을 켠 사용자에게는 흔들림과 대기 시간을 모두 줄인다.

방마다 다른 설치물은 이렇다.

| 방 | 설치물 |
|---|---|
| 우리의 이야기 | 벽을 가로지르는 실에 테이프로 붙인 종이들 |
| 윤영 사용설명서 | 코르크판에 압정으로 꽂은 카드 |
| 오늘의 말 | 천장에서 쪽지 한 장이 내려오고, 바꾸면 올라갔다 새로 내려온다 |
| 미래 편지 | 벽에 걸린 시한 장치 — 남은 시간이 초 단위로 줄고 심지가 타 들어간다 |
| 함께 간 곳 | 전시 복도 — 방향키·휠·드래그로 한 걸음씩 걸으며 좌우 벽의 사진을 본다 |
| 비밀 공간 | 봉인된 봉투 — 누르면 덮개가 젖혀지고 편지가 펼쳐진다 |

라우트는 확장자 없는 실제 경로다.

| 경로 | 내용 | 접근 |
|---|---|---|
| `/` | 미궁 10개 벽 + 마지막 날짜 인증 | 공개 |
| `/archive` | 로비 — 여섯 개의 문 | 인증 필요 |
| `/our-story` | 연애 타임라인 | 인증 필요 |
| `/about-yunyeong` | 윤영 사용설명서 | 인증 필요 |
| `/messages` | 무작위 메시지 | 인증 필요 |
| `/future` | 미래 편지 | 인증 필요 |
| `/places` | 함께 간 곳 (전시 복도) | 인증 필요 |
| `/secret` | 비밀 공간 | 인증 필요 |

---

## 3. Supabase 준비

### 3-1. 프로젝트와 계정

1. Supabase에서 프로젝트를 만든다.
2. **Authentication → Providers → Email** 에서 이메일 로그인만 켜고,
   **"Confirm email"은 끈다**(가입 확인 메일을 쓰지 않는다).
   **"Enable sign-ups"도 끈다** — 계정은 하나만 있으면 된다.
3. **Authentication → Users → Add user** 로 윤영 전용 계정을 하나 만든다.
   - Email: 윤영이 쓸 식별용 주소 (실제로 메일을 받을 필요는 없다)
   - Password: **처음 만난 날짜를 `YYYYMMDD` 8자리로** (예: 2023년 5월 17일 → `20230517`)
   - Auto Confirm User: 켠다

> 이 비밀번호는 저장소 어디에도 남기지 않는다. Supabase 대시보드에서만 설정한다.

### 3-2. 테이블과 정책

`supabase/schema.sql` 을 SQL Editor에 붙여 넣는다.
실행 전에 파일 안의 `REPLACE_WITH_YUNYEONG_EMAIL` 을 3-1에서 만든 계정 이메일로 바꾼다.

스크립트가 하는 일:

- 7개 테이블 생성 (`timeline_events`, `about_facts`, `messages`,
  `future_letters`, `future_letter_bodies`, `places`, `secret_notes`)
- 전 테이블 **RLS 활성화**. 기본은 전부 차단이고, 윤영 계정 세션에만 `select` 를 연다.
- **미래 편지 본문은 `open_at <= now()` 인 것만 내려간다.** 정책 조건에 들어 있어
  브라우저에서 우회할 수 없다. 제목과 열람 예정일은 항상 보인다.
- 비공개 Storage 버킷 `private-media` 생성 + 소유자 전용 읽기 정책

쓰기 정책은 만들지 않는다. 내용은 대시보드나 service role 키를 쓰는 로컬
스크립트로만 넣는다. 브라우저 번들에는 읽기 권한만 있다.

### 3-3. 환경변수

Vite는 **`VITE_` 로 시작하는 값만** 번들에 넣는다.

| 변수 | 공개 여부 | 설명 |
|---|---|---|
| `VITE_SUPABASE_URL` | 공개 가능 | 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | 공개 가능 | anon / publishable key |
| `VITE_YUNYEONG_EMAIL` | 공개 가능 | 인증 계정 식별자 |

`.env` 는 `.gitignore` 에 있다. **service role key와 처음 만난 날짜에는 절대
`VITE_` 접두사를 붙이지 않는다** — 붙이는 순간 번들에 그대로 박힌다.

---

## 4. 인증과 접근 제어

### 흐름

```
열 번째 문 통과
  → 날짜 입력 (YYYY.MM.DD)
  → 숫자만 뽑아 YYYYMMDD 로 정규화
  → supabase.auth.signInWithPassword({ email: VITE_YUNYEONG_EMAIL, password: 정규화값 })
  → 성공하면 Supabase가 access token / refresh token 발급
  → /archive 로 이동
```

- 정답 날짜는 **프론트엔드 어디에도 없다.** 맞는지 판단하는 주체는 Supabase다.
- `isLoggedIn=true` 같은 로컬스토리지 값은 인증 근거로 쓰지 않는다.
  세션 판단은 `supabase.auth.getSession()` 과 `onAuthStateChange` 뿐이다.
- 세션 저장·복원과 토큰 자동 갱신은 Supabase 클라이언트에 맡긴다
  (`persistSession`, `autoRefreshToken`). 자체 JWT 발급 로직은 없다.

### 보호 라우트

`SessionProvider` 가 `status` 를 세 상태로 들고 있다.

```
loading        확인 중  → RequireAuth 가 AuthVeil 만 렌더링
authenticated  세션 있음 → 자식(보호 콘텐츠)을 마운트
anonymous      세션 없음 → <Navigate to="/" replace />
```

**확인이 끝나기 전에는 보호 컴포넌트가 아예 마운트되지 않는다.** CSS로 가리는
것이 아니라 React 트리에 존재하지 않으므로, DOM에도 남지 않는다.
주소창에 `/secret` 을 직접 쳐도, 새로고침해도 같다.

이미 인증된 사람이 `/` 로 들어오면 `App.jsx` 의 `MazeRoute` 가 바로
`/archive` 로 보낸다. 미궁을 다시 통과할 필요가 없다.

> 정적 HTML과 번들은 누구나 받아볼 수 있다. 그래서 편지·사진 같은 실제 내용은
> 번들에 넣지 않고 인증 후 Supabase에서 가져온다. 마지막 방어선은 프론트엔드가
> 아니라 RLS다.

### 날짜 인증의 한계와 보완

날짜는 조합 수가 적어 강한 비밀번호가 아니다. 지금 걸어 둔 방어는 이렇다.

- 매 시도 최소 600ms 지연 (응답 시간으로 정답을 유추하지 못하게 맞춘다)
- 5회 실패 시 60초 잠금
- 형식 오류와 오답을 **같은 문구**로 처리해 단서를 남기지 않는다
- 인증 폼 `<input>` 에 `name` 을 두지 않아, 스크립트가 실패해도 날짜가
  URL 쿼리로 새지 않는다
- Supabase 자체의 서버 측 인증 요청 제한

더 강하게 막아야 하면 `src/lib/auth.js` 만 손대면 된다. 화면 코드는 그대로 두고
`signInWithMeetingDate()` 안에 Supabase Auth의 CAPTCHA(hCaptcha/Turnstile)나
두 번째 비밀값을 덧붙일 수 있도록 분리해 두었다.

---

## 5. 콘텐츠 채우기

지어낸 연애 기록은 하나도 들어 있지 않다. 각 페이지는 구조와 데이터 연결
지점만 있고, 테이블이 비어 있으면 `src/data/content.js` 의 대괄호 placeholder
(`[내용을 적어주세요.]`)를 보여주면서 화면 위에 출처 안내를 띄운다.

| 페이지 | 테이블 | 주요 컬럼 |
|---|---|---|
| `/our-story` | `timeline_events` | `occurred_on`, `title`, `body` |
| `/about-yunyeong` | `about_facts` | `category`, `label`, `body`, `position` |
| `/messages` | `messages` | `body`, `tone` |
| `/future` | `future_letters` + `future_letter_bodies` | `title`, `open_at` / `body` |
| `/places` | `places` | `name`, `visited_on`, `note`, `photo_path` |
| `/secret` | `secret_notes` | `title`, `body`, `media_path`, `position` |

`photo_path` / `media_path` 는 `private-media` 버킷 안의 경로다.
브라우저는 인증된 세션으로 30분짜리 서명 URL을 받아 표시한다.
버킷이 비공개라 URL 없이는 접근할 수 없다.

---

## 6. 배포

SPA라서 **모든 경로를 `index.html` 로 되돌려야 한다.** 그러지 않으면
`/archive` 를 새로고침할 때 404가 난다.

- **Netlify / Cloudflare Pages** — `public/_redirects` 가 이미 들어 있다.
- **Vercel** — `vercel.json` 에 `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`
- **Nginx** — `try_files $uri /index.html;`

설정:

1. 빌드 명령 `npm run build`, 출력 디렉터리 `dist`
2. 환경변수 3개(`VITE_*`)를 호스팅 대시보드에 넣는다 — 빌드 시점에 번들로 들어간다
3. Supabase → **Authentication → URL Configuration** 의 Site URL / Redirect URLs 에
   배포 도메인(`https://yunyeong.com`)을 추가한다

`index.html` 에 `noindex, nofollow` 가 걸려 있다.

---

## 7. 아직 채워야 하는 값

아래는 임의로 정하지 않고 비워 두었다.

- [ ] **처음 만난 실제 날짜** → Supabase 계정 비밀번호로 설정 (저장소에 남기지 않는다)
- [ ] **Supabase 프로젝트 URL** → `.env` 의 `VITE_SUPABASE_URL`
- [ ] **Supabase anon key** → `.env` 의 `VITE_SUPABASE_ANON_KEY`
- [ ] **윤영 전용 계정 이메일** → `.env` 의 `VITE_YUNYEONG_EMAIL`, `schema.sql` 의 `is_owner()`
- [ ] **실제 사진·편지·장소·타임라인 내용** → 위 표의 테이블과 `private-media` 버킷
