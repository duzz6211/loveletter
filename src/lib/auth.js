/* =========================================================================
   auth.js — 마지막 봉인

   ⚠ 이건 인증이 아니다. 서버가 없으므로 판정도 브라우저 안에서 한다.
     정답 날짜는 빌드할 때 번들에 박히고, 개발자 도구를 열면 찾을 수 있다.
     "아무나 실수로 들어오지 않게 하는 커튼"이지 자물쇠가 아니다.
     진짜로 잠가야 하는 내용이면 Supabase 같은 서버가 필요하다
     (supabase/schema.sql 에 그 구성이 남아 있다).

   그래도 시도 제한과 최소 지연은 그대로 둔다. 링크를 받은 사람이
   생일·기념일을 몇 번 찍어 보는 정도는 막아 준다.
   ========================================================================= */

import { readSession, startSession, endSession } from "./session.js";

export const MAZE_PATH = "/";
export const ARCHIVE_PATH = "/archive";

/** 봉인을 열 날짜(YYYYMMDD). 비워 두면 형식만 맞는 날짜를 전부 통과시킨다. */
export const GATE_DATE = String(import.meta.env.VITE_GATE_DATE ?? "")
  .replace(/\D/g, "")
  .slice(0, 8);

/** 날짜가 정해져 있는지 — 정해두지 않으면 봉인이 사실상 열려 있다 */
export function isGateConfigured() {
  return GATE_DATE.length === 8;
}

/* ---------------------------------------------------------------- 날짜 정규화 */

/**
 * 사용자가 어떤 형식으로 넣든 숫자만 뽑아 YYYYMMDD로 만든다.
 * 형식이 맞지 않으면 null.
 * @param {string} raw
 * @returns {string|null}
 */
export function normalizeDate(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (year < 1900 || year > 2999) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // 존재하지 않는 날짜(2월 30일 등) 차단
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;

  return digits;
}

/* ------------------------------------------------------------ 시도 횟수 제한 */

const THROTTLE_KEY = "yunyeong-gate-attempts";
const MAX_ATTEMPTS = 5;    // 이 횟수를 넘기면 잠금
const LOCK_MS = 60_000;    // 잠금 시간
const MIN_DELAY_MS = 600;  // 매 시도마다 최소 지연

function readThrottle() {
  try {
    const raw = sessionStorage.getItem(THROTTLE_KEY);
    return raw ? JSON.parse(raw) : { count: 0, until: 0 };
  } catch {
    return { count: 0, until: 0 };
  }
}

function writeThrottle(state) {
  try {
    sessionStorage.setItem(THROTTLE_KEY, JSON.stringify(state));
  } catch {
    /* 저장이 막힌 브라우저에서는 지연만으로 동작한다 */
  }
}

/** 남은 잠금 시간(초). 0이면 시도 가능. */
export function lockedSeconds() {
  const { until } = readThrottle();
  const remain = until - Date.now();
  return remain > 0 ? Math.ceil(remain / 1000) : 0;
}

function registerFailure() {
  const state = readThrottle();
  state.count += 1;
  if (state.count >= MAX_ATTEMPTS) {
    state.until = Date.now() + LOCK_MS;
    state.count = 0;
  }
  writeThrottle(state);
}

export function clearThrottle() {
  try {
    sessionStorage.removeItem(THROTTLE_KEY);
  } catch {
    /* noop */
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ 공개 API */

/** 지금 봉인을 지난 상태인지 */
export async function getSession() {
  return readSession();
}

/** 나가기 */
export async function signOut() {
  endSession();
  clearThrottle();
}

/**
 * 처음 만난 날을 확인한다.
 * @param {string} rawDate 사용자가 입력한 문자열
 * @returns {Promise<{ok: true} | {ok: false, reason: "locked"|"failed", seconds?: number}>}
 */
export async function signInWithMeetingDate(rawDate) {
  const seconds = lockedSeconds();
  if (seconds > 0) return { ok: false, reason: "locked", seconds };

  const started = Date.now();
  const entered = normalizeDate(rawDate);

  // 형식이 틀린 경우도 오답과 똑같이 다룬다 — 단서를 남기지 않기 위해서다.
  const passed = entered !== null && (!isGateConfigured() || entered === GATE_DATE);

  // 판정이 즉시 끝나므로, 응답 시간으로 형식 오류와 오답을 구분하지 못하도록
  // 항상 같은 만큼 기다린다.
  const elapsed = Date.now() - started;
  if (elapsed < MIN_DELAY_MS) await wait(MIN_DELAY_MS - elapsed);

  if (!passed) {
    registerFailure();
    return { ok: false, reason: "failed" };
  }

  clearThrottle();
  startSession();
  return { ok: true };
}
