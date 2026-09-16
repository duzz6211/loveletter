/* =========================================================================
   Prologue.jsx — 미궁 앞에 서기 전의 표지

   설명하지 않는다. 어디에 서 있는지 한 줄로 알려주고 답을 기다린다.
   인장 → 제목 → 물음 → 대답 순으로 한 겹씩 떠오르며(--in 지연) 인트로가 된다.

   Gate 와 같은 자리에 덮인다. 미궁 쪽은 Maze.jsx 가 inert 로 잠가 둔다.
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import { INTRO_COPY } from "../../data/maze.js";

export default function Prologue({ onEnter }) {
  const [visible, setVisible] = useState(false);
  /** "조금 더 있다가요" 를 눌렀는지 — 문을 닫지는 않고 한마디만 남긴다 */
  const [waited, setWaited] = useState(false);

  const enterRef = useRef(null);

  // 한 박자 뒤에 서서히 떠오른다
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // 대답 버튼이 다 올라온 다음에야 포커스를 준다.
  useEffect(() => {
    const id = window.setTimeout(() => {
      enterRef.current?.focus({ preventScroll: true });
    }, 1900);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section
      className={`prologue${visible ? " is-visible" : ""}${waited ? " is-waiting" : ""}`}
      aria-labelledby="prologueTitle"
    >
      <div className="prologue-seal" style={{ "--in": "0.1s" }} aria-hidden="true">Y</div>

      <p className="kicker prologue-kicker" style={{ "--in": "0.5s" }}>
        {INTRO_COPY.kicker}
      </p>
      <h1 id="prologueTitle" style={{ "--in": "0.75s" }}>
        {INTRO_COPY.title}
      </h1>

      <span className="prologue-rule" style={{ "--in": "1.1s" }} aria-hidden="true" />

      <p className="prologue-ask" style={{ "--in": "1.3s" }}>
        {INTRO_COPY.ask}
      </p>

      <div className="prologue-actions" style={{ "--in": "1.6s" }}>
        <button
          className="prologue-enter"
          type="button"
          ref={enterRef}
          onClick={onEnter}
        >
          {INTRO_COPY.enter}
        </button>
        <button
          className="prologue-wait"
          type="button"
          onClick={() => setWaited(true)}
        >
          {INTRO_COPY.wait}
        </button>
      </div>

      <p className="prologue-reply" role="status" aria-live="polite">
        {waited ? INTRO_COPY.waitReply : ""}
      </p>
    </section>
  );
}
