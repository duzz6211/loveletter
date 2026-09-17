/* =========================================================================
   RoomScene.jsx — 방탈출 장면. 복도 대신 방 하나.

   방은 사진이 아니라 전부 CSS로 지었다. 여기서는 뼈대(벽·바닥·책상·장롱)를
   세우고 그 위에 물건을 놓는다. 물건 하나가 누를 수 있는 자리이고,
   누르면 그 물건의 방으로 들어간다.

   전환은 로비의 문과 같은 어법을 그대로 쓴다(useDoorTransition) —
   물건을 향해 카메라가 다가가고, 빛이 차오른 뒤 다음 화면이 된다.

   물건의 자리와 크기는 styles/room-scene.css 에 있고,
   어느 방으로 이어지는지는 data/rooms.js 의 HOTSPOTS 에 있다.
   ========================================================================= */

import { useCallback, useState } from "react";
import {
  FRAMES,
  HOTSPOTS,
  ROOM_BY_PATH,
  SCENE,
  STRING_NOTES,
} from "../../data/rooms.js";
import useDoorTransition from "./useDoorTransition.js";
import FrontDoor from "./FrontDoor.jsx";
import useCollection from "../../lib/useCollection.js";
import { useTick } from "../../lib/motion.js";

/* ------------------------------------------------------------- 물건 그리기 */

/**
 * 왼쪽 벽 — 액자 넷.
 *
 * 그림은 data/rooms.js 의 FRAMES 에서 온다(public/media/frames/*.webp).
 * 액자 자체(테·매트·옆면·유리)는 CSS가 그리고, 안쪽 그림만 이미지다.
 * 그래야 그림을 갈아 끼워도 액자의 재질과 빛이 그대로 유지된다.
 */
function Frames() {
  return (
    <span className="obj-art" aria-hidden="true">
      {FRAMES.map((art) => (
        <span className={`obj-art-frame obj-art-frame--${art.id}`} key={art.id}>
          <i className="obj-art-side" />
          <span className="obj-art-mat">
            {art.src ? (
              <img className="obj-art-img" src={art.src} alt="" loading="lazy" />
            ) : (
              <i className="obj-art-empty" />
            )}
            <i className="obj-art-glass" />
          </span>
        </span>
      ))}
    </span>
  );
}

/** 벽을 가로지르는 줄에 집게로 물린 쪽지들 */
function StringNotes() {
  return (
    <span className="obj-clipline" aria-hidden="true">
      <i className="obj-clipline-cord" />
      {STRING_NOTES.map((text, index) => (
        <span className="obj-clipnote" key={text} style={{ "--i": index }}>
          <i className="obj-clipnote-peg" />
          <i className="obj-clipnote-pin" />
          <span className="obj-clipnote-paper">
            <i className="obj-clipnote-curl" />
            {text.split("\n").map((line) => (
              <em key={line}>{line}</em>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * 책상 위의 봉랍 편지.
 *
 * 편지지(.obj-letter-sheet)는 평소엔 봉투 안에 접혀 보이지 않다가,
 * 이 물건을 누르면 덮개가 젖혀지면서 위로 올라온다(room-scene.css 의 6장).
 */
function Letter() {
  return (
    <span className="obj-letter" aria-hidden="true">
      <span className="obj-letter-body">
        <i className="obj-letter-sheet" />
        <i className="obj-letter-flap" />
        <i className="obj-letter-seal" />
      </span>
    </span>
  );
}

/** 펼쳐 둔 사용설명서 */
function Manual() {
  return (
    <span className="obj-manual" aria-hidden="true">
      <span className="obj-manual-page">
        <em className="obj-manual-title">
          유냉
          <br />
          사용설명서
        </em>
        <i className="obj-manual-compass" />
        <em className="obj-manual-steps">
          Observe
          <br />
          Connect
          <br />
          Solve
        </em>
        {/* 펼칠 때 왼쪽으로 넘어가는 낱장. 평소엔 보이지 않는다. */}
        <i className="obj-manual-leaf" />
      </span>
    </span>
  );
}

/**
 * 화면이 켜진 휴대폰.
 *
 * 휴대폰으로 보이게 하는 건 색이 아니라 부품이다 —
 * 테두리(베젤) · 그 안으로 한 겹 파인 화면 · 카메라 구멍 · 측면 버튼.
 * 넷 중 하나라도 빠지면 그냥 둥근 사각형이 된다.
 */
function Phone() {
  return (
    <span className="obj-phone" aria-hidden="true">
      <span className="obj-phone-body">
        <i className="obj-phone-btn obj-phone-btn--power" />
        <i className="obj-phone-btn obj-phone-btn--vol" />
        <span className="obj-phone-screen">
          <span className="obj-phone-status">
            <em>21:03</em>
            <i className="obj-phone-bars" />
          </span>
          <i className="obj-phone-moon" />
          <i className="obj-phone-card" />
          <i className="obj-phone-bar" />
        </span>
        <i className="obj-phone-cam" />
        <i className="obj-phone-glare" />
      </span>
    </span>
  );
}

/* 남은 밀리초 → 표시창 글자. 하루가 넘게 남았으면 날짜 칸이 앞에 붙는다.
   (미래 편지 방의 DAYS:HRS:MIN:SEC 과 같은 어법) */
const clock = (ms) => {
  const left = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(left / 3600) % 24, Math.floor(left / 60) % 60, left % 60];
  const days = Math.floor(left / 86400);
  if (days > 0) parts.unshift(days);
  return parts.map((n) => String(n).padStart(2, "0")).join(":");
};

/**
 * 장롱 안, 자물쇠가 걸린 상자.
 *
 * 표시창에는 가장 먼저 열릴 미래 편지까지 남은 시간이 1초씩 줄어든다.
 * 열릴 편지가 없거나 아직 못 읽어왔으면 빈 창(--:--:--)으로 둔다.
 */
function LockedBox() {
  const { rows } = useCollection("future");
  const now = useTick();

  const next = rows.reduce((soonest, row) => {
    const at = row.open_at ? new Date(row.open_at).getTime() : NaN;
    if (!Number.isFinite(at) || at <= now) return soonest;
    return Math.min(at, soonest);
  }, Infinity);

  return (
    <span className="obj-lockbox" aria-hidden="true">
      <i className="obj-lockbox-lid" />
      <i className="obj-lockbox-inside" />
      <span className="obj-lockbox-body">
        <i className="obj-lockbox-band" />
        <i className="obj-lockbox-band obj-lockbox-band--r" />
        <span className="obj-lockbox-readout">
          {Number.isFinite(next) ? clock(next - now) : "--:--:--"}
        </span>
        <i className="obj-lockbox-latch" />
      </span>
    </span>
  );
}

/* 본 카메라가 이어받는 시점. 여는 동작이 "끝난 뒤"가 아니라 "끝나는 중"이다 —
   편지지는 820ms 까지 올라오므로 그 꼬리 위로 카메라가 겹쳐 들어온다.
   다 끝나기를 기다리면 그 틈에서 화면이 한 번 서고, 두 동작으로 보인다. */
const OPEN_HOLD = 620;

/* 봉투만 예외다. 봉랍 → 덮개 → 편지지로 세 동작이 이어지는 유일한 물건이라
   느리게 열고(room-scene.css 의 4-1), 그만큼 카메라도 늦게 이어받는다.
   편지지는 1280ms 까지 올라오므로 그 꼬리 위로 카메라가 겹쳐 들어온다. */
const HOLD_BY_KIND = { letter: 960 };

/**
 * 카메라가 향할 지점. 보통은 누른 물건 전체지만, 액자는 네 점이 걸린
 * 한 덩어리라 그 가운데를 향하면 아무 사진에도 들어가지 않는다.
 * 그래서 큰 액자 한 점을 찍어서 그 사진 안으로 들어간다.
 */
function cameraTarget(kind, button) {
  if (kind !== "frames") return button;
  return button.querySelector(".obj-art-frame--motto") ?? button;
}

const SHAPES = {
  frames: Frames,
  string: StringNotes,
  letter: Letter,
  manual: Manual,
  phone: Phone,
  box: LockedBox,
};

/* ------------------------------------------------------------------ 장면 */

export default function RoomScene() {
  const { stageRef, openingKey, leaving, flashing, enter } = useDoorTransition();

  /** 지금 가리키고 있는 물건. 이름표는 하나만 뜬다. */
  const [hovered, setHovered] = useState(null);

  /** 나가려 할 때 뜨는 쪽지. null | "found" | "go" (FrontDoor.jsx) */
  const [leavingStep, setLeavingStep] = useState(null);

  const dismissFrontDoor = useCallback(() => setLeavingStep(null), []);

  const sceneClass = ["roomscene", openingKey !== null && "is-opening", leaving && "is-leaving"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sceneClass}>
      {/* 쪽지가 떠 있는 동안 방은 잠근다 — 덮개가 마우스는 막지만
          키보드는 뒤로 넘어갈 수 있다(Maze.jsx 와 같은 어법). */}
      <div className="roomscene-view" aria-hidden={leavingStep ? true : undefined}
           inert={leavingStep ? "" : undefined}>
        <div className="roomscene-stage" ref={stageRef}>
          {/* ---- 방의 뼈대. 다섯 면이 꼭짓점을 공유한다(room-scene.css 참고) ---- */}
          <div className="rm-back" aria-hidden="true">
            <i className="rm-rail" />
            <i className="rm-skirt" />
          </div>
          <div className="rm-wall rm-wall--l" aria-hidden="true" />
          <div className="rm-wall rm-wall--r" aria-hidden="true" />
          <div className="rm-ceil" aria-hidden="true" />
          <div className="rm-floor" aria-hidden="true" />
          <div className="rm-rug" aria-hidden="true" />

          {/* ---- 붙박이 소품 (누를 수 없는 것들) ---- */}
          <div className="rm-closet" aria-hidden="true">
            <i className="rm-closet-inner" />
      <i className="rm-closet-face rm-closet-face--l" />
      <i className="rm-closet-face rm-closet-face--r" />
      <i className="rm-closet-face rm-closet-face--top" />
            <i className="rm-closet-glow" />
            <i className="rm-shelf" />
            <i className="rm-rod" />
            <i className="rm-coat rm-coat--a" />
            <i className="rm-coat rm-coat--b" />
            <i className="rm-coat rm-coat--c" />
            <i className="rm-closet-door" />
          </div>

          <div className="rm-desk" aria-hidden="true">
            <i className="rm-desk-top" />
            <i className="rm-desk-edge" />
            <i className="rm-desk-front" />
            <i className="rm-desk-drawer" />
            <i className="rm-desk-leg rm-desk-leg--l" />
            <i className="rm-desk-leg rm-desk-leg--r" />
          </div>

          <div className="rm-lamp" aria-hidden="true">
            <i className="rm-lamp-arm" />
            <i className="rm-lamp-hood" />
            <i className="rm-lamp-base" />
          </div>
          <div className="rm-pool" aria-hidden="true" />
          <div className="rm-glow" aria-hidden="true" />

          <div className="rm-plant" aria-hidden="true">
            <i /><i /><i /><i />
          </div>

          <div className="rm-chair" aria-hidden="true">
            <i className="rm-chair-back" />
            <i className="rm-chair-arm rm-chair-arm--l" />
            <i className="rm-chair-arm rm-chair-arm--r" />
            <i className="rm-chair-seat" />
            <i className="rm-chair-cushion" />
            <i className="rm-chair-leg rm-chair-leg--l" />
            <i className="rm-chair-leg rm-chair-leg--r" />
          </div>

          {/* ---- 누를 수 있는 물건 ---- */}
          <nav className="roomscene-spots" aria-label="방 안의 물건">
            {HOTSPOTS.map((spot) => {
              const Shape = SHAPES[spot.kind];
              const room = ROOM_BY_PATH[spot.path];
              const open = openingKey === spot.path;
              return (
                <button
                  key={spot.path}
                  type="button"
                  className={[
                    "rm-spot",
                    `rm-spot--${spot.kind}`,
                    `is-${spot.side ?? "right"}`,
                    hovered === spot.path && "is-near",
                    open && "is-open",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={`${spot.label} — ${room?.title ?? ""}`}
                  onPointerEnter={() => setHovered(spot.path)}
                  onPointerLeave={() => setHovered((at) => (at === spot.path ? null : at))}
                  onFocus={() => setHovered(spot.path)}
                  onBlur={() => setHovered((at) => (at === spot.path ? null : at))}
                  onClick={(event) =>
                    enter(
                      spot.path,
                      cameraTarget(spot.kind, event.currentTarget),
                      spot.path,
                      HOLD_BY_KIND[spot.kind] ?? OPEN_HOLD
                    )
                  }
                >
                  {Shape ? <Shape /> : null}
                  <span className="rm-spot-tag">
                    <strong>{spot.label}</strong>
                    {spot.note && <small>{spot.note}</small>}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* 벽의 조명 스위치 — 이 선물이 끝나는 자리 (FrontDoor.jsx) */}
          <button
            className="rm-lightswitch"
            type="button"
            aria-label="불 끄고 나가기"
            onClick={() => setLeavingStep("found")}
          >
            <i className="rm-lightswitch-toggle" aria-hidden="true" />
            <span className="rm-lightswitch-tag">불 끄고 나가기</span>
          </button>

          {/* 공기 중의 먼지에 빛이 걸리는 자리 — 광원 쪽만 뿌옇다 */}
          <div className="roomscene-haze" aria-hidden="true" />
          <div className="roomscene-vignette" aria-hidden="true" />
          {/* 화면 전체에 얹는 입자. 맨 위에 있어야 모든 재질을 같은 입자가 덮는다. */}
          <div className="roomscene-grain" aria-hidden="true" />
        </div>
      </div>

      <div className={`roomscene-flash${flashing ? " is-active" : ""}`} aria-hidden="true" />

      <FrontDoor
        step={leavingStep}
        onAdvance={() => setLeavingStep("go")}
        onDismiss={dismissFrontDoor}
      />
    </div>
  );
}
