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
    lead: "코르크판에 하나씩 꽂아 둔, 내가 아는 윤영.",
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
    desc: "필요할 때 한 장씩 내려오는 쪽지.",
    lead: "천장 가득 매달아 둔 말 중에 한 장이 내려와요. 마음에 안 들면 다른 걸로 바꿔도 돼요.",
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
