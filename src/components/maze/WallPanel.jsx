/* =========================================================================
   WallPanel.jsx — 확대된 벽판
   카메라가 벽판 앞에 도착한 자리에서 열린다. 중앙 모달 팝업이 아니라,
   시점이 이동해 도착한 지점에서 벽판이 커지는 연출의 마지막 단계다.

   벽은 세 모습 중 하나로 열린다.
     주관식        AnswerField  — 직접 적어 넣는다
     마지막 객관식 EscapeAnswers — "아니오" 가 커서를 피해 달아난다
     보통 객관식   버튼 목록
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import { COPY, ROMAN, SYMBOLS } from "../../data/maze.js";
import EscapeAnswers from "./EscapeAnswers.jsx";

/**
 * 주관식 입력칸.
 * 벽이 바뀌면(step) 새로 마운트되도록 부모가 key 를 준다 — 적던 글이 남지 않는다.
 */
function AnswerField({ wall, disabled, onSubmit }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(id);
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (disabled || !value.trim()) return;
    onSubmit(value);
  }

  return (
    /* name 을 주지 않는다 — 스크립트가 실패해도 대답이 URL 쿼리로 새지 않게. */
    <form className="answer-form" onSubmit={handleSubmit} noValidate autoComplete="off">
      <input
        className="answer-input"
        ref={inputRef}
        type="text"
        inputMode={wall.inputMode ?? "text"}
        autoComplete="off"
        spellCheck="false"
        maxLength={40}
        placeholder={wall.placeholder ?? ""}
        aria-label={wall.question}
        disabled={disabled}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button
        className="answer-submit"
        type="submit"
        disabled={disabled || !value.trim()}
      >
        {COPY.answerSubmit}
      </button>
    </form>
  );
}

export default function WallPanel({
  wall,
  step,
  open,
  resolving,
  feedback,
  wrongNonce,
  hintCorrect,
  onChoose,
  onSubmit,
  onClose,
  onEvade,
  onMousePointer,
}) {
  const panelRef = useRef(null);

  // 열리면 첫 선택지(또는 입력칸)로 포커스를 옮긴다
  useEffect(() => {
    if (!open) return undefined;
    const id = window.setTimeout(() => {
      const target = panelRef.current?.querySelector(".answer-input, .answer");
      target?.focus({ preventScroll: true });
    }, 60);
    return () => window.clearTimeout(id);
  }, [open, step]);

  // 오답마다 흔들림을 다시 재생한다 (포커스를 잃지 않도록 클래스만 되돌린다)
  useEffect(() => {
    if (!wrongNonce) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.classList.remove("is-shaking");
    void panel.offsetWidth;
    panel.classList.add("is-shaking");
  }, [wrongNonce]);

  const isText = wall.kind === "text";
  const isEscapeWall = Number.isInteger(wall.evadeIndex);

  return (
    <section
      className="panel"
      id="panel"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="panelQuestion"
      aria-hidden={!open}
    >
      <button
        className="panel-close"
        id="panelClose"
        type="button"
        aria-label="벽판에서 물러나기"
        onClick={onClose}
      >
        ×
      </button>

      <p className="panel-index" id="panelIndex">WALL {ROMAN[step]}</p>
      <span className="panel-symbol" aria-hidden="true">{SYMBOLS[step]}</span>
      <h1 className="panel-question" id="panelQuestion">{wall.question}</h1>
      <p className="panel-copy">{wall.copy}</p>

      {isText ? (
        <AnswerField key={step} wall={wall} disabled={resolving} onSubmit={onSubmit} />
      ) : isEscapeWall ? (
        <EscapeAnswers
          wall={wall}
          disabled={resolving}
          hintCorrect={hintCorrect}
          onChoose={onChoose}
          onEvade={onEvade}
          onMousePointer={onMousePointer}
        />
      ) : (
        <div className="answers" id="answers">
          {wall.answers.map((label, index) => (
            <button
              key={label}
              type="button"
              className="answer"
              data-index={index}
              disabled={resolving}
              onClick={() => onChoose(index)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p
        className={`feedback${feedback?.tone === "warn" ? " is-warn" : ""}`}
        id="feedback"
        role="status"
        aria-live="polite"
      >
        {feedback?.text ?? ""}
      </p>
    </section>
  );
}
