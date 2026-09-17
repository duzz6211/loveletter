/* =========================================================================
   FrontDoor.jsx — 불을 끄고 나가려 할 때 뜨는 쪽지, 그리고 마지막 한 줄

   이 선물은 화면 안에서 끝나지 않는다. 마지막 안내는 현관문으로 걸어가라는
   말이고, 그 다음은 화면 밖에 있다. 그래서 여기서는 어디로도 보내지 않는다 —
   세션도 끊지 않고 미궁으로 되돌리지도 않는다.

     step "found"  스위치를 누른 직후. 잘못 눌렀을 수 있으니 물러설 수 있다
                   (Esc, 바깥 누르기). 버튼은 앞으로 가는 것 하나뿐이다.
     step "go"     마지막 줄. 여기서는 물러설 자리를 두지 않는다 — 끝이다.
   ========================================================================= */

import { useEffect, useRef } from "react";
import { LEAVING } from "../../data/rooms.js";

export default function FrontDoor({ step, onAdvance, onDismiss }) {
  const ctaRef = useRef(null);

  /* 쪽지가 뜨면 버튼에 포커스를 준다. 키보드로만 다니는 사람도
     Enter 한 번으로 다음으로 갈 수 있어야 한다. */
  useEffect(() => {
    if (step === "found") ctaRef.current?.focus({ preventScroll: true });
  }, [step]);

  /* Esc 로 물러서기 — "found" 에서만 연다. */
  useEffect(() => {
    if (step !== "found") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step, onDismiss]);

  if (!step) return null;

  const isFound = step === "found";

  return (
    <div
      className={`frontdoor${isFound ? "" : " is-final"}`}
      role="dialog"
      aria-modal="true"
      aria-label={isFound ? LEAVING.found : LEAVING.go}
      /* 바깥을 눌러도 물러선다. 마지막 줄에서는 받지 않는다. */
      onClick={isFound ? onDismiss : undefined}
    >
      {/* 쪽지 안을 누른 것까지 "바깥 누르기"로 세면 안 된다 */}
      <div className="frontdoor-note" onClick={(e) => e.stopPropagation()}>
        {isFound ? (
          <>
            <p className="frontdoor-line">{LEAVING.found}</p>
            <button
              className="frontdoor-cta"
              type="button"
              ref={ctaRef}
              onClick={onAdvance}
            >
              {LEAVING.cta}
            </button>
          </>
        ) : (
          <p className="frontdoor-line frontdoor-line--final">{LEAVING.go}</p>
        )}
      </div>
    </div>
  );
}
