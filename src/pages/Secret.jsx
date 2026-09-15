/* 비밀 공간 — 실로 묶인 봉투가 놓여 있고, 하나를 고르면 편지가 열린다 */

import { useState } from "react";
import RoomShell from "../components/room/RoomShell.jsx";
import SecretLetter from "../components/room/SecretLetter.jsx";
import DataNotice from "../components/DataNotice.jsx";
import Empty from "../components/Empty.jsx";
import useCollection from "../lib/useCollection.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

const ROOM = ROOM_BY_PATH["/secret"];

export default function Secret() {
  const { loading, rows, notice } = useCollection("secret");
  const [open, setOpen] = useState(null);   // 지금 읽고 있는 편지

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

      {loading ? (
        <Empty>불러오는 중…</Empty>
      ) : rows.length === 0 ? (
        <Empty>아직 비밀 기록이 없어요. db/secret-notes.json 에 내용을 넣어주세요.</Empty>
      ) : (
        <div className="vault">
          {rows.map((row) => (
            <button
              className="envelope"
              type="button"
              key={row.id}
              onClick={() => setOpen(row)}
            >
              <span className="envelope-body" aria-hidden="true">
                <span className="envelope-fold envelope-fold--l" />
                <span className="envelope-fold envelope-fold--r" />
                <span className="envelope-fold envelope-fold--b" />
                <span className="envelope-flap" />
                <span className="envelope-tie" />
                <span className="envelope-knot" />
              </span>
              <span className="envelope-text">
                <span className="envelope-title">{row.title ?? "[제목 없음]"}</span>
                <span className="envelope-hint">실을 풀고 열어보기</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 편지 하나를 여는 동안에만 살아 있다. key 로 다른 편지를 열면 처음부터 다시 연다. */}
      {open && (
        <SecretLetter key={open.id} note={open} onClose={() => setOpen(null)} />
      )}
    </RoomShell>
  );
}
