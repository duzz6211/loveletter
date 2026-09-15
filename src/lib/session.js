/* =========================================================================
   session.js — 봉인을 지났다는 표시

   서버가 없으므로 진짜 세션도 없다. 여기서 만드는 건 "이 탭에서 봉인을
   지났다"는 표시 하나뿐이다. sessionStorage 에 두므로 탭을 닫으면 사라진다.

   ⚠ 이건 인증이 아니다. 보호 대상은 화면 전환이지 데이터가 아니다.
     db/*.json 은 봉인과 무관하게 주소만 알면 받을 수 있다.
   ========================================================================= */

const STORAGE_KEY = "yunyeong-session";

const listeners = new Set();

function notify(session) {
  listeners.forEach((fn) => {
    try {
      fn(session);
    } catch {
      /* 구독자 하나가 실패해도 나머지는 계속 받는다 */
    }
  });
}

/** 저장된 표시. 없으면 null. */
export function readSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.opened ? parsed : null;
  } catch {
    return null;
  }
}

/** 봉인을 지났다고 표시한다. 탭을 닫으면 사라진다. */
export function startSession() {
  const session = { opened: true, startedAt: new Date().toISOString() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* 저장이 막힌 브라우저에서는 메모리 구독만으로 이번 화면을 유지한다 */
  }
  notify(session);
  return session;
}

/** 표시를 지운다 */
export function endSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  notify(null);
}

/**
 * 표시 변화 구독.
 * @param {(session: object|null) => void} fn
 * @returns {() => void} 구독 해제
 */
export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
