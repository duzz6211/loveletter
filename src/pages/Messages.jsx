/* =========================================================================
   Messages.jsx — 오늘의 말. 여기만 방이 아니라 휴대폰 화면이다.

   방에서 휴대폰을 누르면 카메라가 그 휴대폰으로 들어온다(RoomScene).
   그러니 도착한 화면은 그 휴대폰이 확대된 모습이어야 한다 —
     · 잠금화면에 지금 시각이 떠 있고
     · 그 아래 알림 한 장으로 오늘 하고 싶은 말이 와 있고
     · 알림 위의 새로고침으로 다른 말을 받을 수 있고
     · 아래 홈 버튼을 누르면 방으로 빠져나간다.

   모양은 styles/phone-screen.css 에 있다.
   ========================================================================= */

import { useCallback, useEffect, useRef, useState } from "react";

import DataNotice from "../components/DataNotice.jsx";
import useCollection from "../lib/useCollection.js";
import useDoorTransition from "../components/room/useDoorTransition.js";
import { ARCHIVE_PATH } from "../lib/auth.js";

/** 새 알림이 내려오는 데 걸리는 시간(ms) — CSS 의 ph-drop 과 맞춘다 */
const SWAP_MS = 260;

const TIME_FMT = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const DATE_FMT = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "long",
});

/** 말의 결(tone)에 따라 알림 아이콘만 달라진다. 보내는 사람은 하나다. */
const TONE_ICON = { love: "♥", cheer: "✦", calm: "☾" };

/**
 * 지금 시각. 초까지는 보여 주지 않으므로 분이 바뀌는 순간에만 다시 그린다 —
 * 1초마다 깨우면 화면은 그대로인데 렌더만 예순 번 돈다.
 */
function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = null;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000));
    };
    timer = window.setTimeout(tick, 60_000 - (Date.now() % 60_000));
    return () => window.clearTimeout(timer);
  }, []);

  return now;
}

export default function Messages() {
  /* 나가는 연출은 방·책과 같은 것을 쓴다 — 단추를 누르면 뒤로 물러난다 */
  const { exiting, flashing, leave } = useDoorTransition();
  const { loading, rows, notice } = useCollection("messages");
  const now = useNow();

  const [index, setIndex] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const swapTimer = useRef(null);

  /** 방금 본 것과 다른 말을 고른다 */
  const draw = useCallback(() => {
    setIndex((current) => {
      if (rows.length <= 1) return 0;
      let next = Math.floor(Math.random() * rows.length);
      if (next === current) next = (next + 1) % rows.length;
      return next;
    });
  }, [rows.length]);

  useEffect(() => {
    if (rows.length > 0) draw();
  }, [rows.length, draw]);

  useEffect(() => () => window.clearTimeout(swapTimer.current), []);

  /** 알림을 한 번 걷어내고 새 알림을 내린다 */
  function refresh() {
    if (swapping || rows.length === 0) return;
    setSwapping(true);
    swapTimer.current = window.setTimeout(() => {
      draw();
      setSwapping(false);
    }, SWAP_MS);
  }

  const message = rows[index] ?? null;
  const body = loading
    ? "불러오는 중…"
    : message
      ? message.body
      : "아직 말이 담기지 않았어요. db/messages.json 에 내용을 넣어주세요.";

  return (
    <div className={`ph${exiting ? " is-exiting" : ""}`}>
      <div className="ph-device">
        <div className="ph-screen">
          {/* 배경화면 — 방의 밤보라를 그대로 가져온다 */}
          <div className="ph-wall" aria-hidden="true" />
          <div className="ph-grain" aria-hidden="true" />

          <header className="ph-status">
            <span className="ph-status-time">{TIME_FMT.format(now)}</span>
            <span className="ph-status-icons" aria-hidden="true">
              <i className="ph-signal" />
              <i className="ph-wifi" />
              <i className="ph-batt" />
            </span>
          </header>

          {/* 잠금화면 시계 — 지금 시각 */}
          <div className="ph-lock">
            <time className="ph-clock" dateTime={now.toISOString()}>
              {TIME_FMT.format(now)}
            </time>
            <p className="ph-date">{DATE_FMT.format(now)}</p>
          </div>

          <div className="ph-notifs">
            {/* 알림 위의 새로고침 — 마음에 안 들면 다른 말을 받는다 */}
            <div className="ph-refresh-row">
              <button
                className="ph-refresh"
                type="button"
                disabled={rows.length === 0 || swapping}
                onClick={refresh}
              >
                <i className="ph-refresh-mark" aria-hidden="true">
                  ↻
                </i>
                새로고침
              </button>
            </div>

            {/* key 를 바꿔 새 알림이 다시 내려오게 한다 */}
            <article
              className={`ph-notif${swapping ? " is-leaving" : ""}`}
              key={index}
              aria-live="polite"
            >
              <header className="ph-notif-head">
                <i className="ph-notif-icon" aria-hidden="true">
                  {TONE_ICON[message?.tone] ?? "✦"}
                </i>
                <strong>오늘 하고 싶은 말</strong>
                <small>지금</small>
              </header>
              <p className="ph-notif-body">{body}</p>
            </article>

            <DataNotice>{notice}</DataNotice>
          </div>
        </div>

        {/* 기기 아래턱의 홈 버튼 — 누르면 방으로 빠져나간다 */}
        <div className="ph-chin">
          <button
            className="ph-home"
            type="button"
            aria-label="홈 — 방으로 돌아가기"
            onClick={() => leave(ARCHIVE_PATH)}
          >
            <i aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={`space-flash${flashing ? " is-active" : ""}`} aria-hidden="true" />
    </div>
  );
}
