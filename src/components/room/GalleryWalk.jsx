/* =========================================================================
   GalleryWalk.jsx — 함께 간 곳. 목록이 아니라 복도를 걷는다.

   좌우 벽에 사진이 번갈아 걸려 있고, 한 걸음 나아갈 때마다
   복도 전체가 앞으로 밀려온다(=내가 걷는다).
   그 자리에 서면 몸이 벽 쪽으로 돌아가며 조명이 떨어지고 명판이 읽힌다.

   조작: 좌우 버튼 · 방향키 · 마우스 휠 · 드래그 · 앞쪽 그림 누르기
   ========================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";
import PrivateMedia from "../PrivateMedia.jsx";
import { formatDate, toParagraphs } from "../../lib/content.js";

/** 한 걸음의 거리(px). 좁은 화면에서는 보폭을 줄인다. */
const STEP_WIDE = 640;
const STEP_NARROW = 470;

/** 벽까지의 거리 */
const SIDE_WIDE = 300;
const SIDE_NARROW = 165;

/** 그림이 벽에 걸린 각도, 그리고 그 앞에 섰을 때 몸을 트는 각도 */
const PIECE_ANGLE = 38;
const TURN_ANGLE = 26;

/** 눈앞에서 그림까지 남겨 두는 거리 — 0이면 코앞이라 읽히지 않는다 */
const VIEW_GAP = 320;


const NARROW = "(max-width: 720px)";

function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(NARROW).matches
  );
  /* resize 는 끄는 동안 내내 울린다. 경계를 넘을 때만 받으면 된다. */
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

export default function GalleryWalk({ places, kicker, title, notice }) {
  const narrow = useNarrow();
  const step = narrow ? STEP_NARROW : STEP_WIDE;
  const side = narrow ? SIDE_NARROW : SIDE_WIDE;

  /** 걸음 수. places.length 자리는 복도 끝 벽이다. */
  const last = places.length;
  const [at, setAt] = useState(0);
  const [stepping, setStepping] = useState(false);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef({ active: false, startX: 0, moved: false });
  const wheelRef = useRef(0);
  const steppingTimer = useRef(null);

  const walk = useCallback(
    (delta) => {
      setAt((current) => {
        const next = Math.min(last, Math.max(0, current + delta));
        if (next === current) return current;
        setStepping(true);
        window.clearTimeout(steppingTimer.current);
        steppingTimer.current = window.setTimeout(() => setStepping(false), 640);
        return next;
      });
    },
    [last]
  );

  useEffect(() => () => window.clearTimeout(steppingTimer.current), []);

  /* 드래그는 창 전체에서 끝난다 — 화면 밖에서 손을 떼도 상태가 남지 않게 */
  useEffect(() => {
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
    // endDrag 는 ref 와 setState 만 건드린다 — 한 번만 붙이면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 방향키로도 걷는다 */
  useEffect(() => {
    function onKey(event) {
      if (event.defaultPrevented) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        walk(1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        walk(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [walk]);

  /* 휠 — 한 번에 여러 칸 넘어가지 않도록 누적해서 한 걸음씩 */
  function handleWheel(event) {
    wheelRef.current += event.deltaY;
    if (Math.abs(wheelRef.current) < 60) return;
    walk(wheelRef.current > 0 ? 1 : -1);
    wheelRef.current = 0;
  }

  /* 드래그 — 옆으로 끌면 그 방향으로 걷는다 */
  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragRef.current = { active: true, startX: event.clientX, moved: false };
    setDragging(true);
    // 포인터 캡처는 쓰지 않는다 — 잡아 두면 그림을 눌러 이동하는 click 이 막힌다.
    // 대신 창 전체에서 pointerup 을 받아 드래그 상태를 확실히 푼다.
  }
  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag.active || drag.moved) return;
    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) < 70) return;
    drag.moved = true;
    walk(dx < 0 ? 1 : -1);
  }
  function endDrag() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setDragging(false);
  }

  const atEnd = at === last;
  const walkZ = at * step - VIEW_GAP;
  // 그 자리의 그림 쪽으로 몸을 돌린다. 왼쪽 벽이면 왼쪽으로.
  const turn = atEnd ? 0 : (at % 2 === 0 ? -TURN_ANGLE : TURN_ANGLE);

  const here = atEnd ? null : places[at];

  const walkClass = [
    "walk",
    stepping && "is-stepping",
    dragging && "is-dragging",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={walkClass}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <div className="walk-title">
        {kicker && <p className="kicker">{kicker}</p>}
        {title && <h1>{title}</h1>}
        {notice && <p className="walk-notice">{notice}</p>}
      </div>

      <div className="walk-space">
        {/* 복도 끝(소실점)이 먼저 깔리고, 그 위로 벽·바닥·천장이 온다 */}
        <div className="walk-far" aria-hidden="true" />
        <div className="walk-wall walk-wall-l" aria-hidden="true" />
        <div className="walk-wall walk-wall-r" aria-hidden="true" />
        <div
          className="walk-floor"
          style={{ "--tread": `${at * 46}px` }}
          aria-hidden="true"
        />
        <div
          className="walk-ceil"
          style={{ "--tread": `${at * -46}px` }}
          aria-hidden="true"
        />

        <div
          className="walk-track"
          style={{ "--walk-z": `${walkZ}px`, "--turn": `${turn}deg` }}
        >
          {places.map((place, index) => {
            const ahead = index - at;          // 0 = 지금 서 있는 자리
            const onLeft = index % 2 === 0;
            const passed = ahead < 0;
            /* 눈에 닿는 건 앞쪽 네 칸까지다 — opacity 가 그 뒤로 0이 된다.
               보이지 않는 칸은 숨겨서 합성에서 빼고, 사진은 그보다 두 칸 더
               앞서 걸어 둔다. 빨리 걸어도 빈 액자가 스치지 않을 만큼만. */
            const seen = ahead >= -1 && ahead < 4;
            const near = ahead >= -1 && ahead <= 6;

            return (
              <div
                className={`walk-piece${ahead === 0 ? " is-here" : ""}`}
                key={place.id}
                style={{
                  "--ox": `${onLeft ? -side : side}px`,
                  "--oz": `${-index * step}px`,
                  "--ory": `${onLeft ? PIECE_ANGLE : -PIECE_ANGLE}deg`,
                  opacity: passed ? 0 : Math.max(0, 1 - ahead * 0.26),
                  visibility: seen ? "visible" : "hidden",
                  pointerEvents: ahead > 0 && ahead < 4 ? "auto" : "none",
                }}
                onClick={() => { if (ahead > 0) walk(ahead); }}
              >
                <span className="walk-spot" aria-hidden="true" />
                <div className="walk-frame">
                  {near && (
                    <PrivateMedia
                      path={place.photo_path}
                      alt={place.name ? `${place.name} 사진` : "함께 간 장소 사진"}
                    />
                  )}
                </div>
                {/* 명판은 적을 말이 있을 때만 건다 — 빈 명판은 벽의 얼룩이다 */}
                {(place.visited_on || place.name || place.note) && (
                  <div className="walk-plaque">
                    <p className="meta">{formatDate(place.visited_on)}</p>
                    <h3>{place.name}</h3>
                    {toParagraphs(place.note).map((text, i) => <p key={i}>{text}</p>)}
                  </div>
                )}
              </div>
            );
          })}

          <div
            className="walk-end"
            style={{
              "--oz": `${-last * step}px`,
              opacity: atEnd ? 1 : Math.max(0, 1 - (last - at) * 0.26),
              visibility: last - at > 6 ? "hidden" : "visible",
            }}
          >
            <h2>여기까지가 지금까지예요</h2>
            <p>다음 칸은 아직 비어 있어요. 같이 채우러 가요.</p>
          </div>
        </div>

        {/* 작품 위에 얹는 공기와 모서리 그늘. 누르는 걸 막지 않는다. */}
        <div className="walk-air" aria-hidden="true" />
        <div className="walk-vignette" aria-hidden="true" />
      </div>

      <p className="walk-hint">
        방향키 · 휠 · 드래그로 걸을 수 있어요.
      </p>

      <div className="walk-hud">
        <button
          className="walk-step"
          type="button"
          aria-label="한 걸음 뒤로"
          disabled={at === 0}
          onClick={() => walk(-1)}
        >
          ←
        </button>
        <span className="walk-count" role="status" aria-live="polite">
          {atEnd ? "복도 끝" : `${at + 1} / ${last}`}
        </span>
        <button
          className="walk-step"
          type="button"
          aria-label="한 걸음 앞으로"
          disabled={atEnd}
          onClick={() => walk(1)}
        >
          →
        </button>
      </div>

      {/* 화면 낭독기에는 지금 보고 있는 장소를 글로 알려준다 */}
      <p className="sr-only" aria-live="polite">
        {here ? `사진 ${at + 1}` : "복도 끝에 도착했어요."}
      </p>
    </div>
  );
}
