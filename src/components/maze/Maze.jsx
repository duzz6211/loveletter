/* =========================================================================
   Maze.jsx — 미궁 공간 전체
   .stage 하나만 변환해 시점 이동을 만든다. step이 바뀌면 key가 바뀌어
   새 노드로 마운트되므로 카메라 변환이 흔적 없이 초기화된다.
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import {
  WALLS, ORDINAL, ROMAN, SEALS, COPY, EVADE_TOUCH_MESSAGE,
} from "../../data/maze.js";
import useMazeMachine from "./useMazeMachine.js";
import WallPanel from "./WallPanel.jsx";
import Prologue from "./Prologue.jsx";
import Gate from "../Gate.jsx";

export default function Maze() {
  const { state, refs, actions } = useMazeMachine();
  const { stageRef, plaqueRef, doorFrameRef } = refs;
  const {
    begin, approach, retreat, choose, submit,
    markMousePointer, notifyEvade,
  } = actions;

  const wall = WALLS[state.step];
  const ordinal = ORDINAL[state.step];
  const atIntro = state.phase === "intro";
  const atGate = state.phase === "gate";
  /* 안내·인증 화면이 덮여 있는 동안 미궁은 읽히지도 눌리지도 않는다 */
  const covered = atIntro || atGate;

  /* 터치 기기에서 아니오를 눌렀을 때 정답 버튼을 잠시 강조한다 */
  const [hintCorrect, setHintCorrect] = useState(false);
  useEffect(() => {
    if (!state.wrongNonce) return undefined;
    if (state.feedback?.text !== EVADE_TOUCH_MESSAGE) return undefined;
    setHintCorrect(true);
    const id = window.setTimeout(() => setHintCorrect(false), 4400);
    return () => window.clearTimeout(id);
  }, [state.wrongNonce, state.feedback?.text]);

  /* 벽판을 닫거나 다음 공간에 들어서면 벽판으로 포커스를 되돌린다 */
  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justClosed = prevOpenRef.current && !state.panelOpen;
    prevOpenRef.current = state.panelOpen;
    if (justClosed && state.phase === "idle") {
      plaqueRef.current?.focus({ preventScroll: true });
    }
  }, [state.panelOpen, state.phase, plaqueRef]);

  useEffect(() => {
    if (state.step === 0) return;
    plaqueRef.current?.focus({ preventScroll: true });
  }, [state.step, plaqueRef]);

  const guideText = state.doorOpen
    ? COPY.doorOpening
    : state.step === 0
      ? COPY.guideFirst
      : COPY.guideNext(ordinal);

  const mazeClass = [
    "maze",
    state.approaching && "is-approaching",
    state.panelOpen && "is-panel-open",
    state.doorOpen && "is-door-open",
    state.entering && "is-entering",
  ]
    .filter(Boolean)
    .join(" ");

  // 벽판이 열려 있는 동안 뒤쪽은 포커스 대상에서 뺀다
  const backgroundInert = state.panelOpen ? "" : undefined;

  return (
    <div className="maze-root">
      <main
        className={mazeClass}
        id="maze"
        aria-hidden={covered}
        inert={covered ? "" : undefined}
      >
        <div className="fog fog-a" aria-hidden="true" />
        <div className="fog fog-b" aria-hidden="true" />

        <header className="hud" id="hud" inert={backgroundInert}>
          <div className="progress">
            <span className="progress-label" id="progressLabel" role="status" aria-live="polite">
              {COPY.progress(ordinal)}
            </span>
            <div className="runes" id="runes" aria-hidden="true">
              {WALLS.map((_, index) => (
                <i key={index} className={index <= state.step ? "is-lit" : ""} />
              ))}
            </div>
          </div>
        </header>

        <div className="scene" inert={backgroundInert}>
          {/* 카메라: 이 요소 하나만 변환한다. key가 바뀌면 변환이 초기화된다. */}
          <div className="stage" key={state.step} ref={stageRef}>
            <div className="ceiling-lines" aria-hidden="true" />
            <div className="wall wall-left" aria-hidden="true" />
            <div className="wall wall-right" aria-hidden="true" />
            <div className="floor-grid" aria-hidden="true" />

            <div className="far-wall">
              {/* 문틀 안쪽 네 면과 문짝의 두께는 door3d.css 가 세운다 */}
              <div className="door-frame door3d door3d--solo" id="doorFrame" ref={doorFrameRef}>
                <span className="door3d-jamb door3d-jamb--l" aria-hidden="true" />
                <span className="door3d-jamb door3d-jamb--r" aria-hidden="true" />
                <span className="door3d-jamb door3d-jamb--head" aria-hidden="true" />
                <span className="door3d-jamb door3d-jamb--sill" aria-hidden="true" />
                <div className="door-light door3d-back" aria-hidden="true" />
                <div className="door door3d-leaf" id="door">
                  <span className="door3d-edge" aria-hidden="true" />
                  <span className="door3d-hinge door3d-hinge--top" aria-hidden="true" />
                  <span className="door3d-hinge door3d-hinge--bottom" aria-hidden="true" />
                  <div className="door-face door3d-face">
                    <span className="door3d-panels" aria-hidden="true"><i /><i /><i /></span>
                    <span className="door-number" id="doorNumber">{ROMAN[state.step]}</span>
                    <span className="door-mark" aria-hidden="true">◈</span>
                    <span className="door-handle" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <button
                className="plaque"
                id="plaque"
                type="button"
                ref={plaqueRef}
                aria-label={`${COPY.progress(ordinal)}의 벽판 — ${COPY.plaqueHint}`}
                onClick={approach}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse" || event.pointerType === "pen") {
                    markMousePointer();
                  }
                }}
              >
                <span className="plaque-kicker">THE {SEALS[state.step]} SEAL</span>
                <strong className="plaque-title">{COPY.progress(ordinal)}</strong>
                <span className="plaque-hint">{COPY.plaqueHint}</span>
              </button>
            </div>
          </div>
        </div>

        <WallPanel
          wall={wall}
          step={state.step}
          open={state.panelOpen}
          resolving={state.phase === "resolving"}
          feedback={state.feedback}
          wrongNonce={state.wrongNonce}
          hintCorrect={hintCorrect}
          onChoose={choose}
          onSubmit={submit}
          onClose={retreat}
          onEvade={notifyEvade}
          onMousePointer={markMousePointer}
        />

        <div className="vignette" aria-hidden="true" />
        <div
          className={`depth-flash${state.flashing ? " is-active" : ""}`}
          aria-hidden="true"
        />
        <p className="guide" id="guide" inert={backgroundInert}>{guideText}</p>
      </main>

      {atIntro && <Prologue onEnter={begin} />}
      {atGate && <Gate date={state.gateDate} />}
    </div>
  );
}
