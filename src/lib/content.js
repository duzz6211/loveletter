/* =========================================================================
   content.js — 보호 콘텐츠 데이터 접근 계층

   서버가 없다. 기록은 루트 db/*.json 에서 읽고, 사진은 public/media/ 에서
   가져온다. 화면 쪽 코드는 이 파일의 함수만 보므로, 나중에 다시 서버를
   붙이더라도 여기만 갈아 끼우면 된다.
   ========================================================================= */

import { readCollection } from "../data/db.js";
import { COLLECTIONS, MEDIA_BASE } from "../data/content.js";

/**
 * @typedef {Object} LoadResult
 * @property {"db"|"error"} source
 * @property {"empty"|"error"|null} reason
 * @property {any[]} rows
 */

/**
 * 미래 편지의 본문은 열람 시각이 지난 것만 넘긴다.
 *
 * ⚠ 이 걸림돌은 브라우저 안에 있다. 서버가 잠가 주던 것(RLS)과 달리,
 *   db/future-letters.json 자체를 열어 보면 본문이 그대로 있다.
 *   "먼저 열어 보지 않기로 한 약속"이지, 못 열게 막는 자물쇠가 아니다.
 */
function gateFutureBodies(rows) {
  const now = Date.now();
  return rows.map((row) => {
    const openAt = row?.open_at ? new Date(row.open_at).getTime() : NaN;
    const opened = Number.isFinite(openAt) && openAt <= now;
    return opened ? row : { ...row, body: null };
  });
}

/**
 * 방 하나의 기록을 불러온다.
 * @param {keyof typeof COLLECTIONS} key
 * @returns {Promise<LoadResult>}
 */
export async function loadCollection(key) {
  let rows;
  try {
    rows = await readCollection(key);
  } catch (thrown) {
    console.warn(`[content] ${key} 를 읽지 못했습니다:`, thrown?.message ?? thrown);
    return { source: "error", reason: "error", rows: [] };
  }

  if (key === "future") rows = gateFutureBodies(rows);

  if (rows.length === 0) return { source: "db", reason: "empty", rows: [] };
  return { source: "db", reason: null, rows };
}

/**
 * 사진·영상의 주소. public/media/ 아래의 파일 이름을 그대로 받는다.
 * 값이 없으면 null — 화면은 빈 액자를 그린다.
 * @param {string|null|undefined} path
 */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("/")) return path;
  return `${MEDIA_BASE}/${path.replace(/^\/+/, "")}`;
}

/** 데이터 출처 안내 문구. 정상적으로 읽었으면 null. */
export function noticeFor(result, key) {
  if (result.source === "db" && result.reason !== "empty") return null;
  const file = COLLECTIONS[key]?.file ?? "db 파일";
  switch (result.reason) {
    case "empty":
      return `${file} 이 아직 비어 있어요.`;
    default:
      return `${file} 을 불러오지 못했어요.`;
  }
}

/** 날짜 문자열을 YYYY.MM.DD 로. 값이 없으면 자리표시자. */
export function formatDate(value) {
  if (!value) return "YYYY.MM.DD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** 빈 줄 기준으로 문단을 나눈다 */
export function toParagraphs(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

/**
 * 편지 본문을 장(page) 단위로 나눈다.
 *  · 본문에 `---` 만 있는 줄이 있으면 그 줄을 장 구분으로 쓴다(직접 끊고 싶을 때).
 *  · 표시가 없으면 문단을 글자 수로 묶어, 한 장이 한 화면에 담기게 자른다.
 * @param {string|null|undefined} text
 * @param {number} budget 한 장에 담을 대략의 글자 수
 * @returns {string[][]} 장 하나가 문단 배열 하나
 */
export function toPages(text, budget = 420) {
  const raw = String(text ?? "");

  const marked = raw.split(/\n[ \t]*-{3,}[ \t]*(?=\n|$)/);
  if (marked.length > 1) {
    return marked.map((chunk) => toParagraphs(chunk)).filter((page) => page.length > 0);
  }

  const pages = [];
  let page = [];
  let length = 0;
  for (const paragraph of toParagraphs(raw)) {
    if (page.length > 0 && length + paragraph.length > budget) {
      pages.push(page);
      page = [];
      length = 0;
    }
    page.push(paragraph);
    length += paragraph.length;
  }
  if (page.length > 0) pages.push(page);
  return pages;
}
