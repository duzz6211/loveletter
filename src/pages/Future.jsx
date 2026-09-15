/* =========================================================================
   미래 편지 — 벽에 걸린 시한 장치.
   남은 시간이 초 단위로 줄어들고, 심지가 타 들어간다. 0이 되면 열린다.

   본문은 열람 시각이 지난 편지에만 실려 온다(lib/content.js). 그래서 시간이
   다 되면 다시 읽어와야 내용이 내려온다 — 타이머가 0에 닿는 순간 refetch 한다.
   ========================================================================= */

import { useEffect, useRef, useState } from "react";
import RoomShell from "../components/room/RoomShell.jsx";
import DataNotice from "../components/DataNotice.jsx";
import Empty from "../components/Empty.jsx";
import FuseTimer, { DAY } from "../components/room/FuseTimer.jsx";
import useCollection from "../lib/useCollection.js";
import { formatDate, toParagraphs } from "../lib/content.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

const ROOM = ROOM_BY_PATH["/future"];

/** 초침 하나로 방 전체를 움직인다 */
function useTick() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export default function Future() {
  const { loading, rows, notice, refetch } = useCollection("future");
  const now = useTick();

  /** 편지별 마지막 재요청 시각. 서버 시계가 조금 늦어도 다시 시도하도록 간격을 둔다. */
  const triedRef = useRef(new Map());
  const RETRY_MS = 15000;

  useEffect(() => {
    const due = rows.filter((row) => {
      const openAt = row.open_at ? new Date(row.open_at).getTime() : NaN;
      if (!Number.isFinite(openAt) || openAt > now) return false;
      if (row.body != null) return false;   // 이미 열렸다
      const tried = triedRef.current.get(row.id) ?? 0;
      return now - tried > RETRY_MS;
    });
    if (due.length === 0) return;
    due.forEach((row) => triedRef.current.set(row.id, now));
    refetch();
  }, [rows, now, refetch]);

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
        <Empty>아직 미래 편지가 없어요. db/future-letters.json 에 편지를 넣어주세요.</Empty>
      ) : (
        <section className="device-wall" aria-label="미래 편지 장치">
          {rows.map((row) => {
            const openAt = row.open_at ? new Date(row.open_at).getTime() : NaN;
            const dated = Number.isFinite(openAt);
            const remaining = dated ? openAt - now : NaN;
            const body = row.body ?? null;
            const opened = dated && remaining <= 0 && body != null;
            // 시각은 지났는데 본문이 아직 없다면, 다시 읽어오는 중이다
            const arriving = dated && remaining <= 0 && body == null;
            const urgent = dated && remaining > 0 && remaining < DAY;

            const deviceClass = [
              "device",
              opened && "is-open",
              urgent && "is-urgent",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article className={deviceClass} key={row.id}>
                <h3 className="device-title">{row.title ?? "[제목 없음]"}</h3>
                <p className="device-meta">열리는 날 · {formatDate(row.open_at)}</p>

                {opened ? (
                  <>
                    <div className="device-body">
                      {toParagraphs(body).map((text, i) => <p key={i}>{text}</p>)}
                    </div>
                    <span className="device-stamp">OPENED</span>
                  </>
                ) : arriving ? (
                  <p className="room-empty">시간이 됐어요. 편지를 가져오는 중…</p>
                ) : dated ? (
                  <FuseTimer remaining={remaining} />
                ) : (
                  <p className="room-empty">열리는 날짜가 아직 정해지지 않았어요.</p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </RoomShell>
  );
}
