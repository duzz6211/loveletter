/* =========================================================================
   openAt.js — 문이 열리는 시각

   이 선물은 정해진 순간 전에는 아무 데도 열리지 않는다. 미궁도, 방도,
   주소를 직접 친 경우도 전부 가림막(components/NotYet.jsx) 뒤에 둔다.

   시각은 "절대 순간" 하나로 잡는다. +09:00 을 문자열에 박아 두었으므로
   보는 사람이 어느 시간대에 있든 한국 시간 그 순간에 함께 열린다.

   ⚠ 판정은 브라우저 시계로 한다. 기기 시계를 앞으로 돌리면 먼저 열린다.
     막아야 할 비밀이 아니라 기다렸다 여는 선물이라 이 정도로 둔다.
     정말 막아야 한다면 서버가 필요하다.
   ========================================================================= */

import { useEffect, useState } from "react";

/** 열리는 순간 — 한국 시간 2026년 9월 18일 00:00 */
export const OPEN_AT = Date.parse("2026-09-18T00:00:00+09:00");

/** 아직 열리지 않았을 때 보여줄 문구. 한 줄에 하나씩 놓인다. */
export const CLOSED_COPY = [
  "기다려주세요.",
  "아무것도 반응이 일어나지 않네요..",
];

/* -------------------------------------------------------------- 미리 보기

   만드는 사람이 자정 전에 한 번 걸어 보기 위한 뒷문이다.

     주소 끝에 ?preview=1 을 붙이면 그 탭에서만 잠금이 풀린다.
     예: https://.../?preview=1

   한 번 붙이고 나면 그 탭이 기억한다(sessionStorage) — 미궁을 지나 방으로
   넘어가도 주소에서 떨어져 나가지 않는다. 탭을 닫으면 같이 사라진다.

   ⚠ 이 저장소는 공개라 이 한 줄도 같이 보인다. 애초에 판정이 브라우저에서
     이뤄지므로 감출 수 있는 것이 아니다(기기 시계를 돌려도 열린다).
     확인이 끝나면 이 블록을 지우는 편이 깔끔하다.
   -------------------------------------------------------------------- */

const PREVIEW_KEY = "preview";

/** 이 탭이 미리 보기 중인가. 주소에 붙어 있으면 기억해 둔다. */
function isPreviewing() {
  try {
    const asked = new URLSearchParams(window.location.search).get(PREVIEW_KEY);
    if (asked === "1") window.sessionStorage.setItem(PREVIEW_KEY, "1");
    return window.sessionStorage.getItem(PREVIEW_KEY) === "1";
  } catch {
    /* 저장이 막힌 브라우저(시크릿 모드 등)에서는 주소만 보고 판단한다 */
    return new URLSearchParams(window.location.search).get(PREVIEW_KEY) === "1";
  }
}

/** 지금 열려 있는가. */
export function isOpen(now = Date.now()) {
  return isPreviewing() || now >= OPEN_AT;
}

/** setTimeout 이 한 번에 셀 수 있는 최대치(약 24.8일). 넘기면 0 으로 접힌다. */
const MAX_DELAY = 2 ** 31 - 1;

/**
 * 열렸는지를 지켜본다.
 *
 * 남은 시간만큼 한 번 재운다 — 1초마다 깨워 볼 이유가 없다. 다만 기기가
 * 잠들면 타이머도 같이 늦으므로, 화면이 돌아올 때 한 번 더 시계를 본다.
 *
 * @returns {boolean}
 */
export function useOpened() {
  const [opened, setOpened] = useState(isOpen);

  useEffect(() => {
    if (opened) return undefined;

    let timer = 0;

    const check = () => {
      if (isOpen()) {
        setOpened(true);
        return;
      }
      /* 아직이면 남은 만큼 다시 재운다. 잠에서 늦게 깨어났어도
         여기서 계산이 다시 맞춰진다. */
      window.clearTimeout(timer);
      timer = window.setTimeout(check, Math.min(OPEN_AT - Date.now(), MAX_DELAY));
    };

    check();
    document.addEventListener("visibilitychange", check);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [opened]);

  return opened;
}
