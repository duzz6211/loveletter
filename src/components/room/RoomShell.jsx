/* =========================================================================
   RoomShell.jsx — 문 안쪽의 방 한 칸

   좌우 벽·바닥·천장이 있고, 정면 벽에 내용이 걸린다.
   천장에는 메모지가 매달려 흔들리고, 벽에는 액자·선반·시계가 걸려 있다.
   오른쪽 아래의 버튼으로 방(로비)에 돌아간다 — 누르면 방이 뒤로 물러난다.
   ========================================================================= */

import { ARCHIVE_PATH } from "../../lib/auth.js";
import useDoorTransition from "./useDoorTransition.js";

/** 천장에 매달린 메모지. 자리와 흔들림은 CSS(nth-child)가 정한다. */
function CeilingNotes({ notes }) {
  if (!notes?.length) return null;
  return (
    <div className="ceiling-notes" aria-hidden="true">
      {notes.slice(0, 4).map((text, index) => (
        <div className="ceiling-note" key={index}>
          <p className="ceiling-note-paper">{text}</p>
        </div>
      ))}
    </div>
  );
}

/** 벽에 걸린 소품. 정면 벽 바깥 여백이 넉넉할 때만 보인다. */
function WallProps({ items }) {
  if (!items?.length) return null;
  return (
    <div className="wall-props" aria-hidden="true">
      {items.slice(0, 6).map((item, index) => (
        <div
          className={`wall-prop wall-prop--${index % 2 === 0 ? "l" : "r"}`}
          key={index}
        >
          {item.kind === "frame" && <div className="wall-frame-art"><span>✧</span></div>}
          {item.kind === "shelf" && <div className="wall-shelf"><span>{item.text}</span></div>}
          {item.kind === "clock" && <div className="wall-clock">◷</div>}
          {item.kind === "switch" && <div className="wall-switch" />}
        </div>
      ))}
    </div>
  );
}

/**
 * @param {object}   props
 * @param {string}   props.tone   방의 벽 색 키 (rooms.js 의 tone)
 * @param {string}   props.kicker
 * @param {string}   props.title
 * @param {string=}  props.lead
 * @param {string[]=} props.notes  천장에 매달 메모
 * @param {object[]=} props.props  벽에 걸 소품
 * @param {boolean=} props.bleed   화면을 꽉 쓰는 방(전시 복도 등)이면 true
 * @param {string=}  props.exitLabel  나가는 단추에 적히는 말
 */
export default function RoomShell({
  tone,
  kicker,
  title,
  lead,
  notes,
  props: wallProps,
  bleed = false,
  exitLabel = "방으로",
  children,
}) {
  const { stageRef, exiting, flashing, leave } = useDoorTransition();

  const roomClass = [
    "room",
    `room--${tone}`,
    bleed && "room--bleed",
    exiting && "is-exiting",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={roomClass}>
      <div className="space">
        <div className="space-stage" ref={stageRef}>
          <div className="room-ceiling" aria-hidden="true" />
          <div className="side-wall side-wall-l" aria-hidden="true" />
          <div className="side-wall side-wall-r" aria-hidden="true" />
          <div className="room-floor" aria-hidden="true" />
          <div className="floor-pool" aria-hidden="true" />
          <div className="room-glow" aria-hidden="true" />

          <i className="pendant" style={{ "--px": "18%", "--cord": "4rem" }} aria-hidden="true" />
          <i className="pendant" style={{ "--px": "82%", "--cord": "5.2rem" }} aria-hidden="true" />

          <WallProps items={wallProps} />

          <div className="room-back" aria-hidden="true"><i /></div>

          <div className="room-scroll">
            {(kicker || title || lead) && (
              <div className="room-head">
                {kicker && <p className="kicker">{kicker}</p>}
                {title && <h1>{title}</h1>}
                {lead && <p>{lead}</p>}
              </div>
            )}
            {children}
          </div>

          <CeilingNotes notes={notes} />

          {/* 나가는 자리. 예전에는 작은 문이었는데, 문은 "열고 들어가는" 어법이라
              돌아 나오는 동작과 반대였다. 지금은 단추 하나다 —
              누르면 문이 열리는 게 아니라 방이 뒤로 물러난다. */}
          <button
            className="room-out"
            type="button"
            aria-label="방으로 돌아가기"
            onClick={() => leave(ARCHIVE_PATH)}
          >
            <i className="room-out-arrow" aria-hidden="true">
              ←
            </i>
            <span>{exitLabel}</span>
          </button>
        </div>
      </div>

      <div className="space-haze" aria-hidden="true" />
      {/* 화면 전체에 얹는 입자 — 바깥 방과 같은 재질 규칙(tokens.css 참고) */}
      <div className="room-grain" aria-hidden="true" />
      <div className={`space-flash${flashing ? " is-active" : ""}`} aria-hidden="true" />
    </div>
  );
}
