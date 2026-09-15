/* =========================================================================
   DoorHall.jsx — 아카이브 로비. 여섯 개의 문이 늘어선 복도.

   카드 목록이 아니라 문이다. 누르면 문짝이 열리고, 그 안으로 걸어 들어간
   다음에야 방이 나온다.
   ========================================================================= */

import { DOOR_ANGLES, DOOR_DEPTH, HALL_COPY, ROOMS } from "../../data/rooms.js";
import useDoorTransition from "./useDoorTransition.js";

/* 문틀 안쪽으로 파인 네 면. 문짝을 열면 이 통로를 지나 빛까지 닿는다.
   실제 3D 면이라 문이 옆으로 돌아설수록 보이는 폭이 달라진다. */
function DoorReveal() {
  return (
    <>
      <span className="door3d-jamb door3d-jamb--l" aria-hidden="true" />
      <span className="door3d-jamb door3d-jamb--r" aria-hidden="true" />
      <span className="door3d-jamb door3d-jamb--head" aria-hidden="true" />
      <span className="door3d-jamb door3d-jamb--sill" aria-hidden="true" />
    </>
  );
}

export default function DoorHall() {
  const { stageRef, openingKey, leaving, flashing, enter } = useDoorTransition();

  function handleDoor(event, room, index) {
    const frame = event.currentTarget.querySelector(".hall-door-frame");
    enter(room.path, frame, index);
  }

  const hallClass = [
    "hall",
    openingKey !== null && "is-opening",
    leaving && "is-leaving",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={hallClass}>
      <div className="space">
        <div className="space-stage" ref={stageRef}>
          <div className="room-ceiling" aria-hidden="true" />
          <div className="side-wall side-wall-l" aria-hidden="true" />
          <div className="side-wall side-wall-r" aria-hidden="true" />
          <div className="room-floor" aria-hidden="true" />
          <div className="floor-pool" aria-hidden="true" />

          <i className="pendant" style={{ "--px": "24%", "--cord": "4.5rem" }} aria-hidden="true" />
          <i className="pendant" style={{ "--px": "50%", "--cord": "6.5rem" }} aria-hidden="true" />
          <i className="pendant" style={{ "--px": "76%", "--cord": "4.5rem" }} aria-hidden="true" />

          <div className="hall-title">
            <p className="kicker">{HALL_COPY.kicker}</p>
            <h1>{HALL_COPY.title}</h1>
            <p>{HALL_COPY.lead}</p>
          </div>

          <nav className="hall-doors" aria-label="아카이브의 방">
            {ROOMS.map((room, index) => (
              <button
                key={room.path}
                type="button"
                className={`hall-door${openingKey === index ? " is-open" : ""}`}
                style={{
                  "--ry": `${DOOR_ANGLES[index] ?? 0}deg`,
                  "--dz": `${DOOR_DEPTH[index] ?? 0}px`,
                }}
                aria-label={`${room.title} — ${room.desc}`}
                onClick={(event) => handleDoor(event, room, index)}
              >
                <span className="hall-door-frame door3d">
                  <DoorReveal />
                  <span className="hall-door-glow door3d-back" aria-hidden="true" />
                  <span className="hall-door-leaf door3d-leaf">
                    <span className="door3d-edge" aria-hidden="true" />
                    <span className="door3d-hinge door3d-hinge--top" aria-hidden="true" />
                    <span className="door3d-hinge door3d-hinge--bottom" aria-hidden="true" />
                    <span className="hall-door-face door3d-face">
                      <span className="door3d-panels" aria-hidden="true"><i /><i /><i /></span>
                      <span className="hall-door-num">{room.roman}</span>
                      <span className="hall-door-mark" aria-hidden="true">{room.mark}</span>
                      <span className="hall-door-handle" aria-hidden="true" />
                      <span className="hall-plate">
                        <span className="kicker">{room.kicker}</span>
                        <strong>{room.plate}</strong>
                      </span>
                    </span>
                  </span>
                </span>
                <span className="hall-door-desc">{room.desc}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="space-haze" aria-hidden="true" />
      <div className={`space-flash${flashing ? " is-active" : ""}`} aria-hidden="true" />
      <p className="hall-guide">{HALL_COPY.guide}</p>
    </div>
  );
}
