/* =========================================================================
   db.js — 저장소 대신 쓰는 로컬 JSON

   서버가 없다. 방마다 필요한 기록은 루트의 db/*.json 에 넣어 두고, 여기서
   읽어 온다. 파일을 고치고 다시 배포하면 그게 곧 "데이터 수정"이다.

   ⚠ 이 파일들은 정적 자산이다. 봉인을 통과하지 않아도 주소만 알면 받을 수
     있다. 남에게 보이면 안 되는 내용은 여기 두지 않는다.
     (그래서 봉인 뒤에 처음 필요해질 때 따로 받아 온다 — 아래 dynamic import.)

   ---------------------------------------------------------------- 파일 형태
   db/timeline.json       [{ id, occurred_on:"YYYY-MM-DD", title, body }]
   db/about.json          [{ id, category, label, body, position:number }]
   db/messages.json       [{ id, body, tone }]
   db/future-letters.json [{ id, title, open_at:ISO8601, body }]
   db/places.json         [{ id, name, visited_on:"YYYY-MM-DD", note, photo_path }]
   db/secret-notes.json   [{ id, title, body, media_path, position:number }]

   id 는 화면에서 목록 key 로 쓰므로 파일 안에서 겹치면 안 된다.
   photo_path / media_path 는 public/media/ 아래의 파일 이름이다(없으면 null).
   ========================================================================= */

/** 방 → JSON 파일. 봉인을 지난 뒤에야 각각 따로 받아 온다. */
const SOURCES = {
  timeline: () => import("../../db/timeline.json"),
  about: () => import("../../db/about.json"),
  messages: () => import("../../db/messages.json"),
  future: () => import("../../db/future-letters.json"),
  places: () => import("../../db/places.json"),
  secret: () => import("../../db/secret-notes.json"),
};

/** 화면별 정렬 규칙. 파일에 적은 순서와 무관하게 여기서 맞춘다. */
const ORDER = {
  timeline: { key: "occurred_on", ascending: true },
  about: { key: "position", ascending: true },
  messages: null, // 파일에 적은 순서 그대로
  future: { key: "open_at", ascending: true },
  places: { key: "visited_on", ascending: true },
  secret: { key: "position", ascending: true },
};

/** 빈 값은 항상 뒤로 보낸다. 날짜를 아직 안 적은 줄이 맨 앞에 오지 않도록. */
function compare(a, b, key, ascending) {
  const x = a?.[key];
  const y = b?.[key];
  const emptyX = x === null || x === undefined || x === "";
  const emptyY = y === null || y === undefined || y === "";
  if (emptyX && emptyY) return 0;
  if (emptyX) return 1;
  if (emptyY) return -1;
  if (x === y) return 0;
  return (x < y ? -1 : 1) * (ascending ? 1 : -1);
}

/**
 * 방 하나의 기록을 읽어 온다. 파일이 없거나 형태가 어긋나면 빈 배열.
 * @param {keyof typeof SOURCES} key
 * @returns {Promise<any[]>}
 */
export async function readCollection(key) {
  const load = SOURCES[key];
  if (!load) return [];

  const module = await load();
  const rows = module?.default;
  if (!Array.isArray(rows)) return [];

  const order = ORDER[key];
  if (!order) return rows;
  return [...rows].sort((a, b) => compare(a, b, order.key, order.ascending));
}

export const COLLECTION_KEYS = Object.keys(SOURCES);
