/* =========================================================================
   SecretLetter.jsx — 비밀 편지를 여는 의식(儀式)

   봉투를 고르면 화면이 어두워지고 한가운데 봉투가 놓인다. 순서는 넷이다.
     1) untie — 봉투를 묶고 있던 실이 풀린다
     2) open  — 덮개가 젖혀지며 봉투가 열린다
     3) draw  — 편지가 뽑혀 나와 봉투 앞에 선다
     4) read  — 편지가 화면을 가득 채운다

   읽는 동안에는 버튼으로 장을 넘긴다. 뒷장을 집어 앞에 놓듯,
   새 장이 뒤에서 올라와 앞에 얹히고 읽던 장은 그 뒤로 물러난다.

   .space-stage 에 transform 이 걸려 있어 position:fixed 가 뷰포트를 기준으로
   잡히지 않는다. 그래서 이 화면은 body 로 포털해서 띄운다.
   ========================================================================= */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PrivateMedia from "../PrivateMedia.jsx";
import { toPages } from "../../lib/content.js";

/** 의식의 각 단계와 머무는 시간(ms). secret-letter.css 의 애니메이션 길이와 맞춘다. */
const CEREMONY = [
  ["untie", 1250],
  ["open", 900],
  ["draw", 1000],
];

/** 장을 넘기는 데 걸리는 시간(ms). .sheet--in/--out 애니메이션과 맞춘다. */
const TURN_MS = 620;

const CAPTION = {
  untie: "묶인 실을 푸는 중…",
  open: "봉투가 열립니다",
  draw: "편지를 꺼내는 중…",
};

/* -------------------------------------------------------------------------
   봉투에 감긴 실.
   pathLength=100 으로 길이를 정규화해서, CSS가 실제 경로 길이를 몰라도
   stroke-dashoffset 0 → 100 으로 실을 되감을 수 있다.
   ------------------------------------------------------------------------- */
function Thread() {
  return (
    <svg className="seal-thread" viewBox="0 0 320 200" aria-hidden="true">
      <g className="thread-wind">
        <path
          className="thread-line"
          pathLength="100"
          d="M160 100 C 66 96 42 44 122 33 C 212 21 272 64 252 110 C 234 152 146 166 94 140 C 56 121 62 104 160 100"
        />
        <path
          className="thread-line thread-line--late"
          pathLength="100"
          d="M160 100 C 256 92 286 138 208 168 C 120 202 40 154 54 106 C 66 64 132 50 160 100"
        />
      </g>
      <g className="thread-tails">
        <path
          className="thread-line thread-tail"
          pathLength="100"
          d="M160 100 C 198 120 216 150 208 182"
        />
        <path
          className="thread-line thread-tail thread-tail--l"
          pathLength="100"
          d="M160 100 C 122 118 104 148 110 180"
        />
      </g>
      <circle className="thread-knot" cx="160" cy="100" r="8.5" />
    </svg>
  );
}

/** 편지 한 장. 첫 장에는 제목을 얹는다. */
function Sheet({ page, note, index, total, className }) {
  return (
    <article className={className}>
      <div className="sheet-paper">
        <div className="sheet-body">
          {index === 0 && (
            <h2 className="sheet-title">{note.title ?? "[제목 없음]"}</h2>
          )}
          {page.kind === "media" ? (
            <PrivateMedia
              path={note.media_path}
              alt={note.title ? `${note.title} 사진` : "비밀 편지에 붙은 사진"}
            />
          ) : page.paragraphs.length > 0 ? (
            page.paragraphs.map((text, i) => <p key={i}>{text}</p>)
          ) : (
            <p className="sheet-empty">[편지 내용이 아직 비어 있어요.]</p>
          )}
        </div>
        <p className="sheet-foot" aria-hidden="true">
          {index + 1} / {total}
        </p>
      </div>
    </article>
  );
}

/**
 * @param {object} props
 * @param {{id:string,title?:string,body?:string,media_path?:string|null}} props.note
 * @param {() => void} props.onClose
 */
export default function SecretLetter({ note, onClose }) {
  const [stage, setStage] = useState("untie");
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState(null);   // { from, dir } — 넘기는 중인 장

  const rootRef = useRef(null);
  const openerRef = useRef(null);
  const turningRef = useRef(false);

  /** 본문을 장으로 나누고, 사진이 있으면 마지막 장으로 붙인다. */
  const pages = useMemo(() => {
    const list = toPages(note.body).map((paragraphs) => ({ kind: "text", paragraphs }));
    if (note.media_path) list.push({ kind: "media", paragraphs: [] });
    return list.length > 0 ? list : [{ kind: "text", paragraphs: [] }];
  }, [note.body, note.media_path]);

  const skip = useCallback(() => setStage("read"), []);

  /* 단계를 하나씩 넘긴다. read 에 닿으면 멈춘다. */
  useEffect(() => {
    const at = CEREMONY.findIndex(([name]) => name === stage);
    if (at === -1) return undefined;
    const next = CEREMONY[at + 1]?.[0] ?? "read";
    const id = window.setTimeout(() => setStage(next), CEREMONY[at][1]);
    return () => window.clearTimeout(id);
  }, [stage]);

  /* 장 넘기기. 넘기는 중에는 겹쳐 넘기지 않는다. */
  const turnTo = useCallback(
    (step) => {
      if (turningRef.current) return;
      const next = pageIndex + step;
      if (next < 0 || next >= pages.length) return;
      turningRef.current = true;
      setTurn({ from: pageIndex, dir: step > 0 ? "next" : "back" });
      setPageIndex(next);
    },
    [pageIndex, pages.length]
  );

  useEffect(() => {
    if (!turn) return undefined;
    const id = window.setTimeout(() => {
      turningRef.current = false;
      setTurn(null);
    }, TURN_MS);
    return () => window.clearTimeout(id);
  }, [turn]);

  /* 편지를 읽는 동안에는 뒤쪽 문서가 움직이지 않게 한다. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /* 열 때 눌렀던 봉투로 초점을 돌려준다. */
  useEffect(() => {
    openerRef.current = document.activeElement;
    rootRef.current?.focus();
    return () => {
      const opener = openerRef.current;
      if (opener && typeof opener.focus === "function") opener.focus();
    };
  }, []);

  /* ESC 로 닫고, 좌우 화살표로 장을 넘긴다. 의식 중에는 Enter 로 건너뛴다. */
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (stage !== "read") {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          skip();
        }
        return;
      }
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        turnTo(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        turnTo(-1);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [stage, onClose, skip, turnTo]);

  const reading = stage === "read";
  const total = pages.length;
  const last = pageIndex >= total - 1;

  return createPortal(
    <div
      className={`vault-overlay stage-${stage}`}
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`비밀 편지 · ${note.title ?? "제목 없음"}`}
    >
      <div className="vault-veil" aria-hidden="true" />

      {/* 봉투 — 실이 풀리고, 열리고, 편지가 나온다 */}
      <div className="seal-scene" aria-hidden="true">
        <div className="seal">
          <div className="seal-shadow" />
          <div className="seal-back" />
          <div className="seal-sheet">
            <i /><i /><i /><i />
          </div>
          {/* 앞면 — 안으로 접어 넘긴 세 자락이 서로 다른 각도로 빛을 받는다 */}
          <div className="seal-front">
            <span className="seal-fold seal-fold--l" />
            <span className="seal-fold seal-fold--r" />
            <span className="seal-fold seal-fold--b" />
          </div>
          <div className="seal-flap" />
          <Thread />
        </div>
        <p className="seal-caption">{CAPTION[stage] ?? ""}</p>
      </div>

      {!reading && (
        <button className="seal-skip" type="button" onClick={skip}>
          바로 읽기
        </button>
      )}

      {/* 편지 — 화면을 가득 채운다 */}
      {reading && (
        <div className="letter">
          <header className="letter-bar">
            <p className="kicker">비밀 편지</p>
            <button className="letter-close" type="button" onClick={onClose}>
              봉투에 도로 넣기
            </button>
          </header>

          <div className="letter-stack">
            {/* 읽던 장 — 뒤로 물러난다 */}
            {turn && (
              <Sheet
                key={`out-${turn.from}`}
                className={`sheet sheet--out-${turn.dir}`}
                page={pages[turn.from]}
                note={note}
                index={turn.from}
                total={total}
              />
            )}
            {/* 새 장 — 뒤에서 올라와 앞에 얹힌다 */}
            <Sheet
              key={`in-${pageIndex}`}
              className={`sheet sheet--top${turn ? ` sheet--in-${turn.dir}` : ""}`}
              page={pages[pageIndex]}
              note={note}
              index={pageIndex}
              total={total}
            />
          </div>

          <footer className="letter-nav">
            <button
              className="letter-turn"
              type="button"
              onClick={() => turnTo(-1)}
              disabled={pageIndex === 0}
            >
              ← 앞 장
            </button>
            <p className="letter-count" aria-live="polite">
              <span aria-hidden="true">{pageIndex + 1} / {total}</span>
              <span className="sr-only">{`${total}장 중 ${pageIndex + 1}장`}</span>
            </p>
            {last ? (
              <button className="letter-turn is-done" type="button" onClick={onClose}>
                다 읽었어요
              </button>
            ) : (
              <button className="letter-turn" type="button" onClick={() => turnTo(1)}>
                다음 장 →
              </button>
            )}
          </footer>
        </div>
      )}
    </div>,
    document.body
  );
}
