/* =========================================================================
   Gate.jsx — 마지막 봉인

   처음 만난 날은 세 번째 벽에서 이미 받았다. 그래서 보통은 아무것도 묻지 않고,
   그 날짜로 조용히 봉인을 열고 아카이브로 넘어간다.

   되물음(입력칸)은 예외용이다. 들고 온 날짜가 없거나 그 날짜로 열리지 않는
   상황 — 예를 들어 배포된 VITE_GATE_DATE 가 중간에 바뀐 경우 — 에만 나온다.

   ⚠ 서버가 없으므로 판정은 브라우저 안에서 한다(lib/auth.js 의 주의사항 참고).
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GATE_COPY } from "../data/maze.js";
import { lockedSeconds, ARCHIVE_PATH } from "../lib/auth.js";
import { useSession } from "../session/SessionProvider.jsx";

export default function Gate({ date = "" }) {
  const { signIn, configured } = useSession();
  const navigate = useNavigate();

  /** "unsealing" 들고 온 날짜로 여는 중 | "asking" 되물어야 함 */
  const [mode, setMode] = useState(date ? "unsealing" : "asking");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState(null); // {text, tone}
  const [busy, setBusy] = useState(false);
  const [lockLeft, setLockLeft] = useState(() => lockedSeconds());
  const [visible, setVisible] = useState(false);

  const inputRef = useRef(null);

  // 문 안에서 나온 직후다. 한 박자 두고 떠오른다.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  /* 들고 온 날짜로 바로 연다. 열리지 않으면 그때만 되묻는다. */
  useEffect(() => {
    if (mode !== "unsealing") return undefined;
    let alive = true;

    // 봉인이 풀리는 문장을 읽을 시간을 잠깐 준다
    const id = window.setTimeout(async () => {
      let result;
      try {
        result = await signIn(date);
      } catch {
        result = { ok: false };
      }
      if (!alive) return;
      if (result.ok) {
        setStatus({ text: GATE_COPY.success });
        navigate(ARCHIVE_PATH, { replace: true });
        return;
      }
      setMode("asking");
      setLockLeft(lockedSeconds());
    }, 900);

    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [mode, date, signIn, navigate]);

  // 되묻는 화면이 뜨면 입력칸으로 커서를 옮긴다
  useEffect(() => {
    if (mode !== "asking") return;
    inputRef.current?.focus({ preventScroll: true });
  }, [mode]);

  // 잠금 남은 시간 카운트다운
  useEffect(() => {
    if (lockLeft <= 0) return undefined;
    const id = window.setInterval(() => {
      const left = lockedSeconds();
      setLockLeft(left);
      if (left <= 0) setStatus(null);
    }, 1000);
    return () => window.clearInterval(id);
  }, [lockLeft]);

  const locked = lockLeft > 0;

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || locked) return;

    setBusy(true);
    setStatus({ text: GATE_COPY.checking });

    let result;
    try {
      result = await signIn(value);
    } catch {
      result = { ok: false, reason: "offline" };
    }

    if (result.ok) {
      setStatus({ text: GATE_COPY.success });
      navigate(ARCHIVE_PATH, { replace: true });
      return;
    }

    setBusy(false);
    inputRef.current?.select();

    switch (result.reason) {
      case "locked":
        setLockLeft(result.seconds ?? lockedSeconds());
        break;
      default: {
        // 형식 오류도 오답과 같은 문구로 처리해 단서를 남기지 않는다
        const left = lockedSeconds();
        if (left > 0) setLockLeft(left);
        else setStatus({ text: GATE_COPY.failed, tone: "warn" });
      }
    }
  }

  const statusText = locked ? GATE_COPY.locked(lockLeft) : status?.text ?? "";
  const statusWarn = locked || status?.tone === "warn";

  return (
    <section
      className={`gate${visible ? " is-visible" : ""}`}
      id="gate"
      aria-labelledby="gateTitle"
    >
      <div className="gate-seal" aria-hidden="true">Y</div>
      <p className="kicker">{GATE_COPY.kicker}</p>
      <h1 id="gateTitle">{GATE_COPY.title}</h1>
      <p className="gate-lead">
        {mode === "unsealing" ? GATE_COPY.lead : GATE_COPY.formLead}
      </p>

      {mode === "unsealing" ? (
        <p className="gate-status" role="status" aria-live="polite">
          {status?.text ?? GATE_COPY.unsealing}
        </p>
      ) : (
        <>
          {!configured && (
            <p className="gate-demo" role="note">{GATE_COPY.openGate}</p>
          )}

          {/* name 속성을 주지 않는다 — 스크립트가 실패해도 날짜가 URL 쿼리로 새지 않게 */}
          <form className="gate-form" id="gateForm" onSubmit={handleSubmit} noValidate autoComplete="off">
            <label htmlFor="gateInput">{GATE_COPY.label}</label>
            <input
              className="gate-input"
              id="gateInput"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck="false"
              maxLength={10}
              placeholder={GATE_COPY.placeholder}
              aria-describedby="gateHint"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (!locked) setStatus(null);
              }}
            />
            <p className="gate-hint" id="gateHint">{GATE_COPY.hint}</p>
            <button className="gate-submit" id="gateSubmit" type="submit" disabled={busy || locked}>
              {GATE_COPY.submit}
            </button>
            <p
              className={`gate-status${statusWarn ? " is-warn" : ""}`}
              id="gateStatus"
              role="status"
              aria-live="polite"
            >
              {statusText}
            </p>
          </form>
        </>
      )}
    </section>
  );
}
