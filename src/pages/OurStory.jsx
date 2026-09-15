/* 우리의 이야기 — 벽을 가로지르는 실에 지나온 날들을 한 장씩 걸어 둔 방 */

import RoomShell from "../components/room/RoomShell.jsx";
import DataNotice from "../components/DataNotice.jsx";
import Empty from "../components/Empty.jsx";
import useCollection from "../lib/useCollection.js";
import { formatDate, toParagraphs } from "../lib/content.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

const ROOM = ROOM_BY_PATH["/our-story"];

/** 손으로 붙인 것처럼 조금씩 기울인다. 다시 그려도 같은 각도가 나오게 인덱스로 정한다. */
const tilt = (index) => (((index * 37) % 7) - 3) * 0.6;

export default function OurStory() {
  const { loading, rows, notice } = useCollection("timeline");

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
        <Empty>아직 기록이 없어요. db/timeline.json 에 첫 기록을 넣어주세요.</Empty>
      ) : (
        <ol className="thread" aria-label="연애 타임라인">
          {rows.map((row, index) => (
            <li key={row.id}>
              <article className="thread-card" style={{ "--tilt": `${tilt(index)}deg` }}>
                <time dateTime={row.occurred_on || undefined}>{formatDate(row.occurred_on)}</time>
                <h3>{row.title ?? "[제목 없음]"}</h3>
                {toParagraphs(row.body).map((text, i) => <p key={i}>{text}</p>)}
              </article>
            </li>
          ))}
        </ol>
      )}
    </RoomShell>
  );
}
