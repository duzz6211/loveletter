/* 오늘의 말 — 천장에 매달린 쪽지 중 한 장이 내려오는 방 */

import { useCallback, useEffect, useRef, useState } from "react";
import RoomShell from "../components/room/RoomShell.jsx";
import DataNotice from "../components/DataNotice.jsx";
import useCollection from "../lib/useCollection.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

const ROOM = ROOM_BY_PATH["/messages"];

/** 쪽지가 올라갔다가 새 쪽지가 내려오는 데 걸리는 시간(ms) — CSS의 dangle-lift 와 맞춘다 */
const SWAP_MS = 420;

export default function Messages() {
  const { loading, rows, notice } = useCollection("messages");
  const [index, setIndex] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const timerRef = useRef(null);

  /** 방금 본 것과 다른 쪽지를 고른다 */
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

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  /** 쪽지를 천장으로 올려보내고, 다음 장을 내린다 */
  function swap() {
    if (swapping || rows.length === 0) return;
    setSwapping(true);
    timerRef.current = window.setTimeout(() => {
      draw();
      setSwapping(false);
    }, SWAP_MS);
  }

  const quote = loading
    ? "불러오는 중…"
    : rows.length === 0
      ? "아직 말이 담기지 않았어요. db/messages.json 에 내용을 넣어주세요."
      : rows[index]?.body ?? "";

  return (
    <RoomShell
      tone={ROOM.tone}
      kicker={ROOM.kicker}
      title={ROOM.title}
      lead={ROOM.lead}
      notes={ROOM.notes}
      props={ROOM.props}
    >
      <DataNotice>{notice}</DataNotice>

      <section className="dangle-stage" aria-label="오늘 내려온 쪽지">
        {/* key 를 바꿔 새 쪽지가 새로 내려오는 애니메이션을 다시 재생시킨다 */}
        <div className={`dangle${swapping ? " is-swapping" : ""}`} key={index}>
          <blockquote aria-live="polite">{quote}</blockquote>
        </div>
      </section>

      <div className="room-actions">
        <button
          className="button"
          type="button"
          disabled={rows.length === 0 || swapping}
          onClick={swap}
        >
          다른 쪽지 내리기
        </button>
      </div>
    </RoomShell>
  );
}
