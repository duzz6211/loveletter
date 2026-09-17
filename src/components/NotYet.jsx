/* =========================================================================
   NotYet.jsx — 아직 열리지 않았을 때 덮이는 가림막

   여기서는 아무것도 알려주지 않는다. 제목도, 남은 시간도 두지 않는다 —
   무엇이 기다리는지 먼저 말해 버리면 자정에 열리는 의미가 없다.
   화면에는 문구 두 줄만 남는다.
   ========================================================================= */

import { CLOSED_COPY } from "../lib/openAt.js";

export default function NotYet() {
  return (
    <div className="not-yet">
      <p className="not-yet-copy">
        {CLOSED_COPY.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
    </div>
  );
}
