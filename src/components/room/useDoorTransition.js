/* =========================================================================
   useDoorTransition.js — 문을 열고 들어가는 전환

   미궁(useMazeMachine)이 쓰던 어법을 그대로 가져왔다.
     1) 문짝이 열린다            (CSS: .is-opening)
     2) 카메라가 그 문으로 다가간다 (--cam-* 를 .space-stage 에 주입)
     3) 문틈의 빛이 화면을 덮는다  (.space-flash)
     4) 그 순간 다음 화면으로 넘어간다

   카메라는 .space-stage 하나만 translate+scale 한다.
   전환 중에는 다시 눌러도 무시한다(ref 로 먼저 잠근다).
   ========================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 애니메이션을 끈 사용자에게는 대기 시간도 줄인다 */
const ms = (value) => (prefersReducedMotion() ? Math.min(value, 110) : value);

const DOOR_OPEN = 620; // 문짝이 열리는 시간
const APPROACH = 700;  // 문 안으로 다가가는 시간
const FLASH = 320;     // 빛이 차오르고 화면이 바뀔 때까지

export default function useDoorTransition() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  /** 지금 열리고 있는 문의 키(로비는 인덱스, 방은 "exit"). 없으면 null. */
  const [openingKey, setOpeningKey] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const busyRef = useRef(false);
  const timersRef = useRef(new Set());

  const later = useCallback((fn, delay) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, delay);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(window.clearTimeout);
      timers.clear();
    };
  }, []);

  /**
   * 문을 열고 그 안으로 들어간다.
   * @param {string} to      들어갈 경로
   * @param {Element|null} doorEl 카메라가 향할 문틀 요소
   * @param {string|number} key   문 식별자. .is-open 을 붙일 대상.
   */
  const enter = useCallback(
    (to, doorEl, key = "exit") => {
      if (busyRef.current) return;
      busyRef.current = true;
      setOpeningKey(key);

      later(() => {
        // 문틀의 실제 위치를 재서 그 지점이 화면 중앙에 오도록 카메라를 옮긴다
        const stage = stageRef.current;
        if (stage && doorEl) {
          const rect = doorEl.getBoundingClientRect();
          const zoom = window.innerWidth < 861 ? 5 : 6.5;
          const x = -(rect.left + rect.width / 2 - window.innerWidth / 2) * zoom;
          const y = -(rect.top + rect.height / 2 - window.innerHeight / 2) * zoom;
          stage.style.setProperty("--cam-x", `${x}px`);
          stage.style.setProperty("--cam-y", `${y}px`);
          stage.style.setProperty("--cam-z", String(zoom));
        }
        setLeaving(true);

        later(() => {
          setFlashing(true);
          later(() => navigate(to), ms(FLASH));
        }, ms(APPROACH));
      }, ms(DOOR_OPEN));
    },
    [later, navigate]
  );

  return { stageRef, openingKey, leaving, flashing, enter };
}
