/* =========================================================================
   useDoorTransition.js — 문을 열고 들어가는 전환

   미궁(useMazeMachine)이 쓰던 어법을 그대로 가져왔다.
     1) 문짝이 열린다            (CSS: .is-opening)
     2) 카메라가 그 문으로 다가간다 (--cam-* 를 .space-stage 에 주입)
     3) 문틈의 빛이 화면을 덮는다  (.space-flash)
     4) 그 순간 다음 화면으로 넘어간다

   카메라는 .space-stage 하나만 translate+scale 한다.
   전환 중에는 다시 눌러도 무시한다(ref 로 먼저 잠근다).

   ---- 카메라가 멈추지 않게 하는 두 벌의 좌표 ----
   1) 이 다 끝난 뒤에 2) 를 시작하면 그 사이에서 화면이 한 번 선다.
   그래서 목표 지점을 누르는 즉시 재서 두 벌로 나눠 넣는다.
     --lead-*  열리는 동안 아주 조금 다가가는 자리 (누르자마자)
     --cam-*   물건 안으로 들어가는 자리          (hold 이 지난 뒤)
   1) 이 끝나기 전에 2) 가 이어받으므로 속도가 0 으로 떨어지는 순간이 없다.
   --lead-* 를 읽는 CSS 가 없는 화면(로비·방)은 예전 그대로 움직인다.
   ========================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const DOOR_OPEN = 620; // 문짝이 열리는 시간
const APPROACH = 700;  // 문 안으로 다가가는 시간
const FLASH = 320;     // 빛이 차오르고 화면이 바뀔 때까지
const BACK_OUT = 460;  // 버튼으로 나갈 때 뒤로 물러나는 시간

/** 열리는 동안 카메라가 미리 다가가 있는 정도. 1 이면 제자리. */
const LEAD = 1.28;

export default function useDoorTransition() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  /** 지금 열리고 있는 문의 키(로비는 인덱스, 방은 "exit"). 없으면 null. */
  const [openingKey, setOpeningKey] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [exiting, setExiting] = useState(false);
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
   * @param {number=} hold   열리는 연출을 보여 줄 시간. 문짝보다 오래 걸리는
   *                         물건(봉투가 열리고 편지지가 올라오는 등)이 쓴다.
   */
  const enter = useCallback(
    (to, doorEl, key = "exit", hold = DOOR_OPEN) => {
      if (busyRef.current) return;
      busyRef.current = true;

      /* 목표 지점은 지금 잰다. 열리는 동안 문틀·물건이 제자리에 있으므로
         나중에 재도 같은 값이고, 미리 알아야 카메라를 먼저 띄울 수 있다.
         중심이 화면 한가운데로 오도록 offset 에 배율을 곱해 되민다. */
      const stage = stageRef.current;
      let camera = null;
      if (stage && doorEl) {
        const rect = doorEl.getBoundingClientRect();
        const zoom = window.innerWidth < 861 ? 5 : 6.5;
        const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
        const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
        camera = { dx, dy, zoom };

        // 열리는 동안 걸어 둘 예열 좌표 — 아주 조금만 다가간다
        stage.style.setProperty("--lead-x", `${-dx * LEAD}px`);
        stage.style.setProperty("--lead-y", `${-dy * LEAD}px`);
        stage.style.setProperty("--lead-z", String(LEAD));
      }

      setOpeningKey(key);

      later(() => {
        // 예열이 아직 움직이는 중에 본 카메라가 이어받는다
        if (stage && camera) {
          stage.style.setProperty("--cam-x", `${-camera.dx * camera.zoom}px`);
          stage.style.setProperty("--cam-y", `${-camera.dy * camera.zoom}px`);
          stage.style.setProperty("--cam-z", String(camera.zoom));
        }
        setLeaving(true);

        later(() => {
          setFlashing(true);
          later(() => navigate(to), FLASH);
        }, APPROACH);
      }, hold);
    },
    [later, navigate]
  );

  /**
   * 버튼으로 나간다 — 들어올 때의 반대다.
   *
   * 문으로 나갈 때는 문틀을 향해 다가갔다. 버튼에는 다가갈 자리가 없으므로
   * 대신 방 전체가 뒤로 물러나며 빛에 씻긴다. 열 문짝이 없으니 기다릴 것도
   * 없어서 누르는 즉시 시작한다.
   * @param {string} to 돌아갈 경로
   */
  const leave = useCallback(
    (to) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setExiting(true);

      later(() => {
        setFlashing(true);
        later(() => navigate(to), FLASH);
      }, BACK_OUT);
    },
    [later, navigate]
  );

  return { stageRef, openingKey, leaving, exiting, flashing, enter, leave };
}
