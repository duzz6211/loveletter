/* =========================================================================
   useMazeMachine.js — 미궁 진행 상태 기계
   화면은 하나의 시퀀스로만 전환된다. 벽마다 라우트를 새로 열지 않는다.

   전환 순서(고정)
     벽판 클릭 → 벽판 앞으로 시점 이동 → 질문 표시 → 정답 선택
     → 성공 문구 → 시점 복귀 → 문 개방 → 문틈의 노란빛 → 문 안으로 전진
     → 다음 공간

   phase는 화면 렌더링용 state와 즉시 판정용 ref를 함께 둔다.
   ref로 먼저 잠가야 중복 클릭이 setState 반영을 기다리는 사이에 새지 않는다.
   ========================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WALLS, WRONG_MESSAGES, EVADE_MESSAGE, EVADE_TOUCH_MESSAGE, TIMING,
} from "../../data/maze.js";
import { matchesAnswer } from "../../lib/answers.js";
import { GATE_DATE, normalizeDate } from "../../lib/auth.js";

const INITIAL = {
  step: 0,
  /** @type {"intro"|"idle"|"approaching"|"open"|"resolving"|"gate"} */
  phase: "idle",
  approaching: false,
  panelOpen: false,
  doorOpen: false,
  entering: false,
  flashing: false,
  /** @type {{text: string, tone?: "warn"} | null} */
  feedback: null,
  /** 오답마다 증가. 벽판 흔들림을 다시 재생시키는 신호. */
  wrongNonce: 0,
  /** 세 번째 벽에서 받아 둔 "처음 만난 날". phase 가 gate 가 될 때 채워진다. */
  gateDate: "",
};

/* 처음 열었을 때만 안내 화면에서 시작한다.
   INITIAL 자체를 intro 로 두면 벽을 넘어갈 때(advance)마다 안내가 다시 뜬다. */
const START = { ...INITIAL, phase: "intro" };

const plaqueZoom = () => (window.innerWidth < 681 ? 2.4 : 3);
const doorZoom = () => (window.innerWidth < 681 ? 5.5 : 7);

export default function useMazeMachine() {
  const [state, setState] = useState(START);

  const stageRef = useRef(null);
  const plaqueRef = useRef(null);
  const doorFrameRef = useRef(null);

  const phaseRef = useRef(START.phase);
  const stepRef = useRef(INITIAL.step);
  const camRef = useRef({ x: 0, y: 0, z: 1 });
  const timersRef = useRef(new Set());
  const wrongCountRef = useRef(0);
  /** 세 번째 벽에서 통과한 "처음 만난 날". 마지막에 세션을 열 때 쓴다. */
  const gateDateRef = useRef("");
  /** 마우스를 실제로 쓴 적이 있는지. matchMedia는 하이브리드 기기에서 틀릴 수 있다. */
  const sawMousePointerRef = useRef(false);

  /* ---------------------------------------------------------------- 타이머 */

  const later = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, delay);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  /* ---------------------------------------------------------------- 카메라 */

  const applyCam = useCallback((next) => {
    camRef.current = next;
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty("--cam-x", `${next.x}px`);
    stage.style.setProperty("--cam-y", `${next.y}px`);
    stage.style.setProperty("--cam-z", String(next.z));
  }, []);

  /**
   * 변환이 걸리지 않은 상태의 좌표를 잰다.
   * (한 태스크 안에서 되돌리므로 화면에는 나타나지 않는다)
   */
  const measureAtRest = useCallback(
    (element) => {
      const stage = stageRef.current;
      if (!stage || !element) return null;
      const saved = camRef.current;
      stage.style.transition = "none";
      applyCam({ x: 0, y: 0, z: 1 });
      void stage.offsetWidth;
      const rect = element.getBoundingClientRect();
      applyCam(saved);
      void stage.offsetWidth;
      stage.style.transition = "";
      return rect;
    },
    [applyCam]
  );

  /** 대상이 화면 중앙에 오도록 공간 전체를 밀고 당긴다 = 시점 이동 */
  const cameraTo = useCallback(
    (element, zoom) => {
      const rect = measureAtRest(element);
      if (!rect) return;
      applyCam({
        x: (window.innerWidth / 2 - (rect.left + rect.width / 2)) * zoom,
        y: (window.innerHeight / 2 - (rect.top + rect.height / 2)) * zoom,
        z: zoom,
      });
    },
    [applyCam, measureAtRest]
  );

  const cameraReset = useCallback(() => applyCam({ x: 0, y: 0, z: 1 }), [applyCam]);

  const setPhase = useCallback((phase, patch = {}) => {
    phaseRef.current = phase;
    setState((s) => ({ ...s, phase, ...patch }));
  }, []);

  // 확대 중 창 크기가 바뀌면 시점을 다시 맞춘다
  useEffect(() => {
    if (state.phase !== "approaching" && state.phase !== "open") return undefined;
    const onResize = () => cameraTo(plaqueRef.current, plaqueZoom());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [state.phase, cameraTo]);

  /* ---------------------------------------------------------------- 첫 안내 */

  /** 안내 화면에서 입장하기를 눌렀을 때 — 비로소 첫 번째 벽 앞에 선다. */
  const begin = useCallback(() => {
    if (phaseRef.current !== "intro") return;
    setPhase("idle");
  }, [setPhase]);

  /* ------------------------------------------------------- 벽판 열고 닫기 */

  const approach = useCallback(() => {
    if (phaseRef.current !== "idle") return; // 중복 클릭 차단
    cameraTo(plaqueRef.current, plaqueZoom());
    setPhase("approaching", { approaching: true, feedback: null });

    later(() => {
      if (phaseRef.current !== "approaching") return;
      setPhase("open", { panelOpen: true });
    }, TIMING.panelDelay);
  }, [cameraTo, setPhase, later]);

  const retreat = useCallback(() => {
    if (phaseRef.current !== "open") return;
    cameraReset();
    setPhase("idle", { approaching: false, panelOpen: false, feedback: null });
  }, [cameraReset, setPhase]);

  /* ------------------------------------------------------------- 정답 처리 */

  /** 다음 공간으로. 마지막 벽이었다면 인증 화면을 연다. */
  const advance = useCallback(() => {
    if (stepRef.current === WALLS.length - 1) {
      // 열 개를 다 지났다. 세 번째 벽에서 받아 둔 날짜를 마지막 화면에 넘긴다.
      setPhase("gate", {
        entering: false,
        flashing: false,
        gateDate: gateDateRef.current,
      });
      return;
    }
    // step이 바뀌면 .stage 가 새 노드로 마운트되어 변환이 흔적 없이 초기화된다
    stepRef.current += 1;
    wrongCountRef.current = 0;
    camRef.current = { x: 0, y: 0, z: 1 };
    phaseRef.current = "idle";
    setState({ ...INITIAL, step: stepRef.current });
  }, [setPhase]);

  /** 오답 — 벽판을 흔들고 문구만 바꾼다. 문은 그대로 닫혀 있다. */
  const fail = useCallback((text) => {
    setState((s) => ({
      ...s,
      feedback: { text, tone: "warn" },
      wrongNonce: s.wrongNonce + 1,
    }));
  }, []);

  /** 순환하는 오답 문구 하나를 꺼낸다 */
  const nextWrongMessage = useCallback(() => {
    const text = WRONG_MESSAGES[wrongCountRef.current % WRONG_MESSAGES.length];
    wrongCountRef.current += 1;
    return text;
  }, []);

  /** 정답 — 여기서부터는 객관식·주관식이 똑같은 순서를 탄다. */
  const succeed = useCallback(
    (wall) => {
      setPhase("resolving", { feedback: { text: wall.success } });

      // 1. 성공 문구를 읽는 시간
      later(() => {
        // 2. 확대 복귀 — 벽판이 닫힌다
        setState((s) => ({ ...s, panelOpen: false }));

        later(() => {
          // 3. 시점이 원래 거리로 돌아온다
          cameraReset();
          setState((s) => ({ ...s, approaching: false }));

          later(() => {
            // 4. 복귀가 끝난 다음에야 문이 열리고 문틈에 노란빛이 찬다
            setState((s) => ({ ...s, doorOpen: true }));

            later(() => {
              // 5. 카메라가 문 안으로 전진한다
              cameraTo(doorFrameRef.current, doorZoom());
              setState((s) => ({ ...s, entering: true, flashing: true }));
              later(advance, TIMING.enter);
            }, TIMING.doorOpen + TIMING.lightHold);
          }, TIMING.cameraOut);
        }, TIMING.panelClose);
      }, TIMING.successHold);
    },
    [setPhase, later, cameraReset, cameraTo, advance]
  );

  /** 객관식 — correct 가 "any" 면 무엇을 골라도 통과한다. */
  const choose = useCallback(
    (index) => {
      if (phaseRef.current !== "open") return;
      const wall = WALLS[stepRef.current];

      if (wall.correct !== "any" && index !== wall.correct) {
        if (index === wall.evadeIndex) {
          // 달아나는 버튼을 기어이 눌렀을 때. 손가락으로 눌렀다면 옆을 가리켜 준다.
          const pointing =
            sawMousePointerRef.current ||
            window.matchMedia("(hover: hover) and (pointer: fine)").matches;
          fail(pointing ? EVADE_MESSAGE : EVADE_TOUCH_MESSAGE);
        } else {
          fail(nextWrongMessage());
        }
        return;
      }

      succeed(wall);
    },
    [fail, nextWrongMessage, succeed]
  );

  /**
   * 주관식 — 적어 넣은 대답을 판정한다.
   * 세 번째 벽(gateDate)만 accept 목록이 아니라 GATE_DATE 로 판정하고,
   * 통과한 날짜를 들고 있다가 마지막에 세션을 여는 데 쓴다.
   */
  const submit = useCallback(
    (raw) => {
      if (phaseRef.current !== "open") return;
      const wall = WALLS[stepRef.current];

      if (wall.gateDate) {
        const date = normalizeDate(raw);
        const passed = date === GATE_DATE;
        if (!passed) {
          fail(nextWrongMessage());
          return;
        }
        gateDateRef.current = date;
        succeed(wall);
        return;
      }

      if (!matchesAnswer(raw, wall.accept)) {
        fail(nextWrongMessage());
        return;
      }
      succeed(wall);
    },
    [fail, nextWrongMessage, succeed]
  );

  /* ------------------------------------------------------------ Escape 키 */

  useEffect(() => {
    if (state.phase !== "open") return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        retreat();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.phase, retreat]);

  const markMousePointer = useCallback(() => {
    sawMousePointerRef.current = true;
  }, []);

  /** 아니오 버튼이 달아났을 때의 안내 문구 */
  const notifyEvade = useCallback(() => {
    setState((s) => ({ ...s, feedback: { text: EVADE_MESSAGE, tone: "warn" } }));
  }, []);

  return {
    state,
    refs: { stageRef, plaqueRef, doorFrameRef },
    actions: {
      begin, approach, retreat, choose, submit,
      markMousePointer, notifyEvade,
    },
  };
}
