# yunyeong.com

윤영 한 사람을 위한 개인 아카이브.
열 개의 벽을 지나야 안쪽 기록에 닿을 수 있다.

**React 18 + Vite + React Router.** 서버도 데이터베이스도 없는 정적 사이트다.

> **먼저 읽어주세요 — 이 사이트에 "잠금"은 없다.**
> 서버가 없으므로 봉인 판정도, 편지 내용도 전부 브라우저 안에 있다.
> 열 개의 벽은 **선물의 연출**이지 접근 제어가 아니다. 개발자 도구를 열거나
> `db/*.json` 주소를 직접 치면 봉인과 무관하게 내용을 볼 수 있다.
> 남에게 보이면 절대 안 되는 내용은 여기 두지 않는다. 자세한 내용은 6번.

---

## 1. 빠른 시작

```bash
npm install
npm run dev              # http://localhost:5173
```

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (HMR), 포트 5173 |
| `npm run build` | `dist/` 로 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기, 포트 4173 |

의존성은 `react`, `react-dom`, `react-router-dom` 셋뿐이다.
빌드 도구로 `vite` 와 `@vitejs/plugin-react` 를 쓴다.

### WSL에서 쓸 때

`which node` 가 `/mnt/c/...` 를 가리키면 윈도우 node를 쓰고 있는 것이라
esbuild 같은 네이티브 바이너리가 어긋난다. WSL 안에 네이티브 node를 깔아야 한다.

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install --lts
which node     # /home/<사용자>/.nvm/versions/node/... 여야 한다
```

`vite.config.js` 에 `host: true` 가 켜져 있어서, WSL에서 띄운 서버를
윈도우 브라우저에서 바로 열 수 있다.

---

## 2. 봉인 날짜

`src/lib/auth.js` 의 `GATE_DATE` 한 줄이다. 지금 값은 `20250902` (우리가 사귄 날).

**빌드하면 번들에 그대로 박힌다.** 배포된 사이트의 JS를 열면 날짜가 보인다.
입력은 숫자가 아닌 문자를 무시하므로 `2025.09.02` 처럼 적어도 되고,
8자리를 넘으면 앞 8자리만 쓴다.

---

## 3. 구조

```
db/                                ← 방에 들어갈 실제 내용. 여기를 채운다
├── timeline.json                     우리의 이야기
├── about.json                        윤영 사용설명서
├── messages.json                     오늘의 말
├── future-letters.json               미래 편지
├── places.json                       함께 간 곳
└── secret-notes.json                 비밀 공간

public/media/                      ← 사진·영상. 배포하면 /media/<파일명>

src/
├── main.jsx                       BrowserRouter + SessionProvider + CSS 전부 로드
├── App.jsx                        라우트 정의
├── data/
│   ├── maze.js                    ← 열 개의 벽 질문·정답·문구·타이밍
│   ├── rooms.js                   ← 문 여섯 개. 벽 색·천장 메모·벽 소품·로비 배치
│   ├── db.js                      db/*.json 로더 + 화면별 정렬 규칙
│   └── content.js                 방 → 파일 이름 대응, 미디어 경로
├── lib/
│   ├── auth.js                    봉인 판정 · 날짜 정규화 · 시도 제한
│   ├── session.js                 sessionStorage 표시 + 구독
│   ├── answers.js                 주관식 대답 비교 (공백·문장부호 무시)
│   ├── content.js                 데이터 접근 계층 + 날짜·문단·페이지 나누기
│   └── useCollection.js           목록 하나를 불러오는 공통 훅 (+ refetch)
├── session/SessionProvider.jsx     앱 전체가 공유하는 하나의 상태
├── routes/RequireAuth.jsx          보호 라우트 가드
├── components/
│   ├── maze/
│   │   ├── Prologue.jsx           미궁 앞 표지 — "입장하시겠습니까?"
│   │   ├── Maze.jsx               미궁 공간 전체
│   │   ├── useMazeMachine.js      진행 상태 기계 + 카메라
│   │   ├── WallPanel.jsx          확대된 벽판
│   │   └── EscapeAnswers.jsx      열 번째 벽의 도망치는 "아니오"
│   ├── room/
│   │   ├── DoorHall.jsx           로비 — 여섯 개의 문이 늘어선 복도
│   │   ├── RoomShell.jsx          방 한 칸 (벽·바닥·천장·매단 메모·나가는 문)
│   │   ├── useDoorTransition.js   문 열림 → 카메라 접근 → 다음 화면
│   │   ├── GalleryWalk.jsx        전시 복도 — 한 걸음씩 걸어 들어간다
│   │   ├── FuseTimer.jsx          미래 편지의 남은 시간 표시창
│   │   └── SecretLetter.jsx       봉투 개봉 + 장 넘기기
│   ├── Gate.jsx                   마지막 봉인
│   ├── ArchiveLayout.jsx          방 공통 셸 + 얇은 HUD
│   └── AuthVeil / DataNotice / Empty / PrivateMedia
├── pages/                         로비 1개 + 방 6개
└── styles/
    ├── tokens.css                 색·타이포·리듬 토큰
    ├── door3d.css                 문의 3D 구성
    ├── maze.css                   미궁
    ├── rooms.css                  공간 공용 부품(벽·바닥·천장·카메라) + 로비
    ├── room-shell.css             방 한 칸의 뼈대
    ├── room-features.css          방마다 다른 설치물
    ├── secret-letter.css          비밀 공간의 봉투와 편지
    └── archive.css                방 안 공통 조각(버튼·사진 자리)
```

### 라우트

| 경로 | 내용 | 접근 |
|---|---|---|
| `/` | 표지 → 미궁 10개 벽 → 마지막 봉인 | 공개 |
| `/archive` | 로비 — 여섯 개의 문 | 봉인 통과 필요 |
| `/our-story` | 연애 타임라인 | 〃 |
| `/about-yunyeong` | 윤영 사용설명서 | 〃 |
| `/messages` | 오늘의 말 — 휴대폰 화면 | 〃 |
| `/future` | 미래 편지 | 〃 |
| `/places` | 함께 간 곳 (전시 복도) | 〃 |
| `/secret` | 비밀 공간 | 〃 |

알 수 없는 주소는 전부 `/` 로 돌린다. 이미 봉인을 지난 사람이 `/` 로 들어오면
`App.jsx` 의 `MazeRoute` 가 바로 `/archive` 로 보낸다 — 미궁을 다시 지날 필요가 없다.

### 문을 열고 들어가는 구조

봉인 이후 화면은 문서가 아니라 **공간**이다.

- `/archive` 는 카드 목록이 아니라 **여섯 개의 문이 늘어선 복도(로비)** 다.
  문을 누르면 문짝이 열리고 → 카메라가 그 문으로 다가가고 → 빛이 차오른 뒤
  방에 도착한다. 방에서는 오른쪽 아래의 문이나 HUD의 `복도로` 로 돌아온다.
- 문은 오목한 벽을 따라 둘러선다. 가운데 문일수록 뒤로 물러나고(`DOOR_DEPTH`)
  양 끝 문은 안쪽을 바라본다(`DOOR_ANGLES`). 둘 다 `src/data/rooms.js` 에 있다.
- 방마다 좌우 벽·바닥·천장이 있고, 천장에는 메모지가 매달려 흔들리고
  벽에는 액자·선반·시계·스위치가 걸린다. 문구와 소품도 전부 `rooms.js` 에 있다.
- 화면이 좁아지면 소품은 접히고 메모는 두 장만 남는다.
  `prefers-reduced-motion` 을 켠 사용자에게는 흔들림과 대기 시간을 모두 줄인다.

방마다 다른 설치물은 이렇다.

| 방 | 설치물 |
|---|---|
| 우리의 이야기 | 벽을 가로지르는 실에 테이프로 붙인 종이들 |
| 유냉 사용설명서 | 방이 아니라 책 한 권 — 항목 하나가 한 쪽이고, 넘기면 낱장이 돌아간다 |
| 오늘의 말 | 방이 아니라 휴대폰 한 대 — 잠금화면에 지금 시각, 알림으로 오늘 하고 싶은 말, 아래 홈 버튼으로 나간다 |
| 미래 편지 | 벽에 걸린 시한 장치 — 남은 시간이 초 단위로 줄고 심지가 타 들어간다 |
| 함께 간 곳 | 전시 복도 — 방향키·휠·드래그·좌우 버튼으로 한 걸음씩 걷는다 |
| 비밀 공간 | 봉인된 봉투 — 누르면 덮개가 젖혀지고 편지가 장 단위로 펼쳐진다 |

---

## 4. 미궁 고치기

문구와 질문은 전부 `src/data/maze.js` 한 곳에 있다. 화면 코드는 이 파일만 읽는다.

### 벽 한 장의 모양

벽은 두 종류다.

```js
// 주관식 — 직접 적어 넣는다
{
  kind: "text",
  question: "이름이 무엇인가요?",
  copy: "첫 번째 벽은 이름을 기억하는 사람에게만 열립니다.",
  accept: ["윤영", "최윤영"],       // 이 중 하나와 같으면 통과
  placeholder: "이름을 적어주세요",
  success: "이름이 확인되었어요. 첫 번째 봉인이 풀립니다.",
}

// 객관식 — 고른다
{
  kind: "choice",
  question: "…",
  answers: ["예", "아니오"],
  correct: 0,          // 인덱스. "any" 로 두면 무엇을 골라도 통과
  success: "…",
  evadeIndex: 1,       // (선택) 이 선택지는 커서를 피해 달아난다
}
```

**주관식은 받아쓰기 시험이 아니다.** 비교 전에 양쪽을 같은 모양으로 눕힌다
(`src/lib/answers.js`) — 공백을 전부 없애고, 영문은 소문자로, 문장부호를 지운다.
그래서 `"더 현대"`, `"더현대 서울"`, `"더현대서울"` 이 전부 같은 대답이 된다.
`accept` 목록은 "어디까지 받아줄 생각인지"를 적어 두는 자리다.

### 세 번째 벽이 곧 마지막 봉인이다

세 번째 벽에는 `gateDate: true` 가 붙어 있다. 이 벽만 `accept` 가 없고
`GATE_DATE` 로 판정한다. 여기서 통과한 날짜를 그대로 들고 가서,
열 번째 벽을 지난 뒤 `Gate.jsx` 가 조용히 봉인을 연다.

그래서 **보통은 마지막에 날짜를 다시 묻지 않는다.** 입력칸이 나오는 건 예외
상황뿐이다 — 들고 온 날짜가 없거나, 배포된 `GATE_DATE` 가 중간에 바뀌어
그 날짜로 열리지 않을 때.

### 아직 정하지 않은 질문

여덟 번째·아홉 번째 벽에 `TODO(윤영)` 주석이 붙어 있다. 예전 문항을 그대로 둔
자리다. `question` / `copy` / `answers` / `correct` / `success` 만 갈아 끼우면 된다.

### 연출 타이밍

`maze.js` 맨 아래 `TIMING` 이 카메라 이동·벽판 개폐·문 개방 시간을 잡는다.
`maze.css` 의 `--t-*` 값과 짝이라, 한쪽만 고치면 어긋난다.

---

## 5. 내용 채우기

지어낸 연애 기록은 하나도 들어 있지 않다. `db/*.json` 에는 대괄호 자리표시자
(`[내용을 적어주세요.]`)만 있고, 파일이 비면 화면 위에 어느 파일을 고쳐야
하는지 안내가 뜬다.

**고치고 다시 배포하면 그게 곧 데이터 수정이다.** 대시보드도 관리자 화면도 없다.

| 방 | 파일 | 한 줄의 모양 |
|---|---|---|
| `/our-story` | `db/timeline.json` | `{ id, occurred_on:"YYYY-MM-DD", title, body }` |
| `/about-yunyeong` | `db/about.json` | `{ id, category, label, body, position }` |
| `/messages` | `db/messages.json` | `{ id, body, tone }` |
| `/future` | `db/future-letters.json` | `{ id, title, open_at:ISO8601, body }` |
| `/places` | `db/places.json` | `{ id, name, visited_on:"YYYY-MM-DD", note, photo_path }` |
| `/secret` | `db/secret-notes.json` | `{ id, title, body, media_path, position }` |

규칙 몇 가지.

- **`id` 는 파일 안에서 겹치면 안 된다.** 목록 key 로 쓴다.
- **정렬은 코드가 한다** (`src/data/db.js` 의 `ORDER`). 파일에 적은 순서는
  `messages.json` 에서만 그대로 쓴다. 날짜나 `position` 이 빈 줄은 항상 뒤로 간다.
- **`photo_path` / `media_path` 는 `public/media/` 아래의 파일 이름**이다.
  없으면 `null` — 화면은 빈 액자를 그린다. `/` 로 시작하거나 `http` 로 시작하면
  그 주소를 그대로 쓴다.
- **`open_at` 은 시간대를 붙여 적는다** (`2026-12-24T00:00:00+09:00`).
  안 붙이면 보는 사람의 시간대에 따라 열리는 시각이 달라진다.

### 편지를 장으로 나누기

`secret-notes.json` 의 `body` 는 길어도 된다. 화면이 알아서 나눈다
(`src/lib/content.js` 의 `toPages`).

- 빈 줄 하나 → 문단이 나뉜다
- `---` 만 있는 줄 → **거기서 장이 넘어간다** (직접 끊고 싶을 때)
- `---` 를 하나도 안 쓰면 문단을 글자 수(기본 420자)로 묶어 자동으로 자른다

---

## 6. 무엇이 보호되고 무엇이 안 되는가

이 절이 이 저장소에서 가장 중요하다.

### 지금 하는 일

`sessionStorage` 에 "이 탭에서 봉인을 지났다"는 표시 하나를 둔다. 탭을 닫으면
사라진다. `RequireAuth` 는 확인이 끝나기 전에 보호 컴포넌트를 **아예 마운트하지
않는다** — CSS로 가리는 게 아니라 React 트리에 없으므로 DOM에도 남지 않는다.
주소창에 `/secret` 을 직접 쳐도, 새로고침해도 같다.

봉인 판정에는 이런 걸림돌이 걸려 있다 (`src/lib/auth.js`).

- 매 시도 최소 600ms 지연 — 응답 시간으로 형식 오류와 오답을 구분하지 못하게
- 5회 실패 시 60초 잠금
- 형식 오류와 오답을 **같은 문구**로 처리해 단서를 남기지 않는다
- 존재하지 않는 날짜(2월 30일 등)를 미리 걸러낸다

이 정도면 링크를 받은 사람이 생일·기념일을 몇 번 찍어 보는 건 막아 준다.

### 하지 않는 일

**서버가 없다. 그래서 진짜 잠금도 없다.**

- `GATE_DATE` 는 빌드 시 번들에 박힌다. 개발자 도구로 찾을 수 있다.
- `db/*.json` 은 정적 자산이다. **봉인을 지나지 않아도 주소만 알면 받을 수 있다.**
  (그래서 봉인 뒤 필요해질 때 `import()` 로 따로 받도록 쪼개 두긴 했다.
  번들을 늦게 부를 뿐, 접근을 막지는 못한다.)
- `public/media/` 의 사진도 마찬가지로 공개 정적 파일이다.
- **미래 편지의 "아직 안 열림"은 화면에서만 가린다.** `future-letters.json` 을
  직접 열면 본문이 그대로 있다. *먼저 열어 보지 않기로 한 약속*이지 자물쇠가 아니다.

`index.html` 에 `noindex, nofollow` 가 걸려 있어 검색에는 안 잡히지만,
그건 검색 엔진에 대한 부탁이지 접근 제어가 아니다.

### 진짜로 잠가야 한다면

서버가 필요하다. 데이터 접근은 `src/lib/content.js`, 사진은
`src/components/PrivateMedia.jsx`, 봉인은 `src/lib/auth.js` 만 갈아 끼우면
되도록 분리해 뒀다.

---

## 7. 배포

SPA라서 **모든 경로를 `index.html` 로 되돌려야 한다.** 그러지 않으면
`/archive` 를 새로고침할 때 404가 난다.

- **Netlify / Cloudflare Pages** — `public/_redirects` 가 이미 들어 있다.
- **Vercel** — `vercel.json` 이 이미 들어 있다.
- **Nginx** — `try_files $uri /index.html;`

설정:

1. 빌드 명령 `npm run build`, 출력 디렉터리 `dist`
2. 사진·영상을 `public/media/` 에 넣고 같이 커밋한다 (별도 스토리지가 없다)

서체는 CDN에서 받아 온다 — 본문은 Pretendard(jsDelivr, dynamic subset),
편지는 나눔 펜 스크립트(Google Fonts). 둘 다 `index.html` 에 있다.

---

## 8. 아직 채워야 하는 값

- [ ] **여덟 번째·아홉 번째 벽의 질문** → `src/data/maze.js` 의 `TODO(윤영)`
- [ ] **실제 사진·편지·장소·타임라인 내용** → `db/*.json` 과 `public/media/`
