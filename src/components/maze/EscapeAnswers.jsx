/* =========================================================================
   EscapeAnswers.jsx — 열 번째 벽 전용 선택지
   "아니오"는 마우스가 다가오면 선택 영역 안에서 달아난다.
   - 정밀 포인터 판정은 matchMedia가 아니라 실제 pointerType으로 한다.
   - 키보드 포커스는 절대 빼앗지 않는다.
   - 터치 기기에서는 달아나지 않고, 누르면 장난스러운 안내와 정답 강조가 나온다.
   ========================================================================= */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const isPointingDevice = (event) =>
  event.pointerType === "mouse" || event.pointerType === "pen";

export default function EscapeAnswers({
  wall,
  disabled,
  hintCorrect,
  onChoose,
  onEvade,
  onMousePointer,
}) {
  const zoneRef = useRef(null);
  const buttonRefs = useRef([]);
  const evadeIndex = wall.evadeIndex;

  const place = (button, x, y) => {
    if (!button) return;
    button.style.setProperty("--ax", `${Math.round(x)}px`);
    button.style.setProperty("--ay", `${Math.round(y)}px`);
  };

  const readPos = (button) => ({
    x: parseFloat(button?.style.getPropertyValue("--ax")) || 0,
    y: parseFloat(button?.style.getPropertyValue("--ay")) || 0,
  });

  /** 처음 자리 잡기 — 정답 버튼 옆에 나란히 */
  const layout = useCallback(() => {
    const zone = zoneRef.current;
    const runaway = buttonRefs.current[evadeIndex];
    const keeper = buttonRefs.current.find((_, i) => i !== evadeIndex);
    if (!zone || !runaway) return;

    const zoneW = zone.clientWidth;
    const zoneH = zone.clientHeight;
    const gap = 12;
    const keeperW = keeper ? keeper.offsetWidth : 0;
    const runawayW = runaway.offsetWidth;
    const rowY = Math.max(0, zoneH / 2 - runaway.offsetHeight / 2 - 14);

    if (keeper) {
      const keeperX = clamp(
        (zoneW - keeperW - runawayW - gap) / 2,
        0,
        Math.max(0, zoneW - keeperW)
      );
      place(keeper, keeperX, rowY);
      place(runaway, clamp(keeperX + keeperW + gap, 0, Math.max(0, zoneW - runawayW)), rowY);
    } else {
      place(runaway, clamp((zoneW - runawayW) / 2, 0, Math.max(0, zoneW - runawayW)), rowY);
    }
  }, [evadeIndex]);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(layout);
    window.addEventListener("resize", layout);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", layout);
    };
  }, [layout]);

  /** 커서에서 최대한 멀고, 직전 위치와도 충분히 떨어진 새 자리를 고른다. */
  const flee = useCallback(
    (cursorX, cursorY) => {
      const zone = zoneRef.current;
      const runaway = buttonRefs.current[evadeIndex];
      const keeper = buttonRefs.current.find((_, i) => i !== evadeIndex);
      if (!zone || !runaway) return;

      const box = zone.getBoundingClientRect();
      const zoneW = zone.clientWidth;
      const zoneH = zone.clientHeight;
      const width = runaway.offsetWidth;
      const height = runaway.offsetHeight;
      const maxX = Math.max(0, zoneW - width);
      const maxY = Math.max(0, zoneH - height);
      if (maxX < 4 && maxY < 4) return;

      const current = readPos(runaway);
      const minMove = Math.max(36, Math.min(maxX, Math.max(maxY, 36)) * 0.45);
      const localCursorX = cursorX - box.left;
      const localCursorY = cursorY - box.top;

      const keeperBox = keeper
        ? { ...readPos(keeper), w: keeper.offsetWidth, h: keeper.offsetHeight }
        : null;

      let best = null;
      let bestScore = -Infinity;

      for (let i = 0; i < 28; i += 1) {
        const x = Math.random() * maxX;
        const y = Math.random() * maxY;

        const moved = Math.hypot(x - current.x, y - current.y);
        if (moved < minMove && i < 22) continue; // 제자리 재배치 방지

        // 커서 바로 아래로 다시 들어가지 않도록 커서와의 거리를 최우선으로 둔다
        const fromCursor = Math.hypot(
          x + width / 2 - localCursorX,
          y + height / 2 - localCursorY
        );
        let score = fromCursor + moved * 0.3;
        if (keeperBox && overlaps({ x, y, w: width, h: height }, keeperBox)) score -= 260;

        if (score > bestScore) {
          bestScore = score;
          best = { x, y };
        }
      }

      if (!best) return;
      place(runaway, best.x, best.y);
      onEvade();
    },
    [evadeIndex, onEvade]
  );

  /* 마우스가 버튼 근처에 오면 달아난다 */
  const queuedRef = useRef(false);
  const handlePointerMove = (event) => {
    if (isPointingDevice(event)) onMousePointer();
    if (!isPointingDevice(event) || disabled) return;

    const runaway = buttonRefs.current[evadeIndex];
    if (!runaway) return;
    const box = runaway.getBoundingClientRect();
    const near =
      event.clientX > box.left - 42 && event.clientX < box.right + 42 &&
      event.clientY > box.top - 42 && event.clientY < box.bottom + 42;
    if (!near || queuedRef.current) return;

    queuedRef.current = true;
    const { clientX, clientY } = event;
    requestAnimationFrame(() => {
      queuedRef.current = false;
      flee(clientX, clientY);
    });
  };

  const handlePointerEnter = (event) => {
    if (isPointingDevice(event)) onMousePointer();
    if (!isPointingDevice(event) || disabled) return;
    flee(event.clientX, event.clientY);
  };

  useEffect(() => {
    buttonRefs.current = buttonRefs.current.slice(0, wall.answers.length);
  }, [wall.answers.length]);

  return (
    <div
      className="answers is-escape-zone"
      id="answers"
      ref={zoneRef}
      onPointerMove={handlePointerMove}
    >
      {wall.answers.map((label, index) => (
        <button
          key={label}
          type="button"
          className={`answer${hintCorrect && index === wall.correct ? " is-hinted" : ""}`}
          data-index={index}
          disabled={disabled}
          ref={(node) => {
            buttonRefs.current[index] = node;
          }}
          onPointerEnter={index === evadeIndex ? handlePointerEnter : undefined}
          onClick={() => onChoose(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
