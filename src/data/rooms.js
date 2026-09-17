/* =========================================================================
   rooms.js — 문 여섯 개와 그 안의 방

   로비(복도)의 문, 방의 벽 색, 천장에 걸린 메모, 벽에 걸린 소품을
   전부 여기서 정한다. 화면 코드는 이 파일만 읽는다.

   notes  천장에 매달 짧은 메모. 최대 4장(좁은 화면에서는 앞의 2장만 보인다).
   props  벽에 걸 소품. { kind, text? }
          kind: "frame" | "shelf" | "clock" | "switch"
   ========================================================================= */

export const ROOMS = [
  {
    path: "/our-story",
    roman: "I",
    mark: "❖",
    tone: "story",
    kicker: "OUR STORY",
    title: "우리의 이야기",
    plate: "우리의 이야기",
    desc: "처음 만난 날부터 이어지는 시간.",
    lead: "벽을 가로지르는 실에, 지나온 날들을 한 장씩 걸어 두었어요.",
    notes: ["여기서부터 시작이었어", "아직 쓸 칸이 많이 남았다", "날짜는 잊어도 돼", "이 실은 안 끊어져"],
    props: [
      { kind: "frame" },
      { kind: "clock" },
      { kind: "shelf", text: "✿ ✧ ❖" },
      { kind: "frame" },
    ],
  },
  {
    path: "/about-yunyeong",
    roman: "II",
    mark: "✦",
    tone: "about",
    kicker: "ABOUT YUNYEONG",
    title: "윤영 사용설명서",
    plate: "윤영 사용설명서",
    desc: "좋아하는 것, 습관, 내가 좋아하는 모습.",
    lead: "한 권으로 묶어 둔, 내가 아는 윤영. 한 쪽에 하나씩 적혀 있어요.",
    notes: ["계속 늘어나는 중", "다 외웠어", "여기 다 못 적었어"],
    props: [
      { kind: "switch" },
      { kind: "frame" },
      { kind: "shelf", text: "☕ ✿" },
      { kind: "clock" },
    ],
  },
  {
    path: "/messages",
    roman: "III",
    mark: "✧",
    tone: "say",
    kicker: "MESSAGES",
    title: "오늘의 말",
    plate: "오늘의 말",
    desc: "필요할 때 한 장씩 오는 알림.",
    lead: "휴대폰에 오늘 하고 싶은 말이 와 있어요. 마음에 안 들면 새로고침해도 돼요.",
    notes: ["아무거나 골라", "오늘 거 꼭 읽어", "다 진심이야", "또 와도 돼"],
    props: [
      { kind: "shelf", text: "✧ ✧ ✧" },
      { kind: "shelf", text: "✦ ✦" },
      { kind: "frame" },
      { kind: "switch" },
    ],
  },
  {
    path: "/future",
    roman: "IV",
    mark: "✵",
    tone: "future",
    kicker: "FUTURE",
    title: "미래 편지",
    plate: "미래 편지",
    desc: "정해진 시각이 되어야 열리는 편지.",
    lead: "벽에 걸린 장치마다 남은 시간이 줄어들고 있어요. 0이 되면 그 편지가 열려요.",
    notes: ["아직 열지 마", "시간이 지켜줄 거야", "곧이야"],
    props: [
      { kind: "clock" },
      { kind: "clock" },
      { kind: "switch" },
      { kind: "frame" },
    ],
  },
  {
    path: "/places",
    roman: "V",
    mark: "✶",
    tone: "places",
    kicker: "PLACES",
    title: "함께 간 곳",
    plate: "함께 간 곳",
    desc: "같이 걸었던 길을 다시 걷는다.",
    lead: "",
    notes: [],
    props: [],
  },
  {
    path: "/secret",
    roman: "VI",
    mark: "❈",
    tone: "secret",
    kicker: "SECRET",
    title: "비밀 공간",
    plate: "비밀 공간",
    desc: "봉해 둔 긴 편지와 둘만 보는 것들.",
    lead: "봉투를 누르면 봉인이 떨어지고 편지가 펼쳐져요.",
    notes: ["둘만 보는 방", "천천히 읽어"],
    props: [
      { kind: "switch" },
      { kind: "frame" },
      { kind: "frame" },
      { kind: "shelf", text: "❈ ✧" },
    ],
  },
];

/** 경로 → 방 정의. HUD가 현재 위치 이름을 찾을 때 쓴다. */
export const ROOM_BY_PATH = Object.fromEntries(ROOMS.map((room) => [room.path, room]));

/** 로비 문구 */
export const HALL_COPY = {
  kicker: "THE ARCHIVE",
  title: "여섯 개의 문",
  lead: "열 개의 벽을 지나 도착한 복도예요. 들어가고 싶은 문을 열어주세요.",
  guide: "문을 누르면 열립니다.",
};

/* 로비에서 문이 늘어선 모양 — 오목한(안으로 파인) 벽을 따라 둘러선다.
   가운데 문일수록 뒤로 물러나고(DOOR_DEPTH), 양 끝 문은 앞으로 나와
   안쪽을 바라본다(DOOR_ANGLES). 크기는 따로 주지 않는다. 뒤로 물러난
   만큼 원근이 알아서 줄여 주기 때문에, 스케일을 겹쳐 주면 거리감이 깨진다. */

/** 문이 바라보는 방향(deg). 왼쪽 문은 오른쪽을, 오른쪽 문은 왼쪽을 향한다. */
export const DOOR_ANGLES = [26, 15, 5, -5, -15, -26];

/** 문이 물러난 깊이(px). 0이 가장 앞, 음수가 뒤. */
export const DOOR_DEPTH = [0, -82, -132, -132, -82, 0];

/* =========================================================================
   방탈출 장면 — 복도 대신 방 하나

   여섯 개의 문을 늘어놓는 대신, 방 하나를 보여주고 그 안의 물건을 누르게
   한다. 물건 하나가 방 하나로 이어진다.

   방은 그림이 아니라 전부 CSS로 지었다(styles/room-scene.css). 그래서
   물건의 자리·크기도 그쪽에 있다. 여기서는 어떤 물건이 어느 방으로
   이어지는지와 문구만 정한다.
   ========================================================================= */

export const SCENE = {
  kicker: "THE VIOLET ROOM",
  title: "윤영의 방",
  lead: "열 개의 벽을 지나 도착한 방이에요.",
};

/**
 * 불을 끄고 나가려 할 때.
 *
 * 여기가 이 선물의 끝이다. 화면 밖으로 이어지는 자리라, 세션을 끊지도
 * 미궁으로 돌려보내지도 않는다 — 마지막 줄을 읽고 나면 화면에서 눈을
 * 떼고 진짜 현관문으로 걸어가면 된다.
 *
 * found  스위치를 누르면 뜨는 쪽지
 * go     "살펴보러 가요" 를 누른 뒤 남는 마지막 한 줄
 */
export const LEAVING = {
  found: "어? 불 끄고 나가려고 했더니 현관문에 처음보는 게 있어요!",
  go: "현관문 앞으로 다가가세요.",
  cta: "자세히 살펴보러 가요!",
};

/**
 * 방 안의 물건들. 누르면 그 물건의 방으로 들어간다.
 *
 * kind 가 그리는 모양과 놓일 자리를 고른다 — JSX 와 CSS 양쪽이 이 값을 본다.
 * 순서는 화면 순서가 아니라 탭 순서다(왼쪽 벽 → 줄 → 책상 → 장롱).
 *
 * @property {"frames"|"string"|"letter"|"manual"|"phone"|"box"} kind
 * @property {string} path   들어갈 경로 (ROOMS 의 path 와 같다)
 * @property {string} label  가까이 갔을 때 뜨는 이름
 * @property {string=} note  이름 아래 한 줄
 * @property {"right"|"left"=} side  이름표가 붙는 방향 (기본 right)
 */
export const HOTSPOTS = [
  {
    kind: "frames",
    path: "/places",
    label: "액자를 본다",
    note: "벽에 걸린 그림들",
  },
  {
    kind: "string",
    path: "/our-story",
    label: "실에 걸린 날들을 본다",
    note: "지나온 날이 한 장씩",
  },
  {
    kind: "letter",
    path: "/secret",
    label: "편지를 연다",
    note: "봉랍이 찍힌 봉투",
  },
  {
    kind: "manual",
    path: "/about-yunyeong",
    label: "설명서를 펼친다",
    note: "책상 위의 사용설명서",
  },
  {
    kind: "phone",
    path: "/messages",
    label: "휴대폰을 확인한다",
    note: "오늘 하고 싶은 말이 와 있다",
  },
  {
    kind: "box",
    path: "/future",
    side: "left",
    label: "잠긴 상자",
    note: "시간이 되어야 열린다",
  },
];

/** 경로 → 물건. 방 이름을 붙일 때 ROOMS 와 짝지어 쓴다. */
export const HOTSPOT_BY_PATH = Object.fromEntries(
  HOTSPOTS.map((spot) => [spot.path, spot])
);

/** 줄에 매달린 쪽지에 적힌 말. 손글씨로 작게 적힌다. */
export const STRING_NOTES = [
  "Small\nsteps",
  "Same sky\ndifferent day",
  "✦",
  "Time\nreveals all",
  "Look\ncloser",
];

/**
 * 왼쪽 벽에 걸린 액자들.
 *
 * 그림은 public/media/frames/*.webp 에서 읽는다. 같은 이름으로 덮어쓰면
 * 그대로 걸린다. src 를 null 로 두면 그림 대신 빈 매트가 걸린다.
 *
 * 자리 넷은 모두 세로다. 자리 비율은 지금 걸린 사진에 맞춰 두었다 —
 * 어긋난 만큼 object-fit: cover 가 잘라내므로, 맞춰 두면 0% 다.
 *
 *   id        자리 비율   지금 걸린 사진   사진 비율   잘리는 양
 *   motto     0.75        pic2.webp        0.75        0%
 *   moon      0.56        pic1.webp        0.56        0%
 *   botanic   0.56        pic3.webp        0.56        0%
 *   dial      0.56        pic4.webp        0.56        0%
 *
 * 사진을 갈아 끼우면 room-scene.css 의 .obj-art-frame--* height 를 다시
 * 재야 한다. 재는 법은 그 파일 3-1 의 주석에 적어 두었다.
 *
 * @property {string} id    액자 모양을 고르는 키 (room-scene.css 의 .obj-art--*)
 * @property {string|null} src
 * @property {string} alt
 */
export const FRAMES = [
  { id: "motto",   src: "/media/frames/pic2.webp", alt: "[액자 속 사진 설명]" },
  { id: "moon",    src: "/media/frames/pic1.webp", alt: "[액자 속 사진 설명]" },
  { id: "botanic", src: "/media/frames/pic3.webp", alt: "[액자 속 사진 설명]" },
  { id: "dial",    src: "/media/frames/pic4.webp", alt: "[액자 속 사진 설명]" },
];
