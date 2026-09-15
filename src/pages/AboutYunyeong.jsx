/* 윤영 사용설명서 — 코르크판에 압정으로 하나씩 꽂아 둔 방 */

import RoomShell from "../components/room/RoomShell.jsx";
import DataNotice from "../components/DataNotice.jsx";
import Empty from "../components/Empty.jsx";
import useCollection from "../lib/useCollection.js";
import { toParagraphs } from "../lib/content.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

const ROOM = ROOM_BY_PATH["/about-yunyeong"];

const tilt = (index) => (((index * 53) % 9) - 4) * 0.7;

export default function AboutYunyeong() {
  const { loading, rows, notice } = useCollection("about");

  const groups = new Map();
  rows.forEach((row) => {
    const key = row.category ?? "기타";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

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
        <Empty>아직 항목이 없어요. db/about.json 에 내용을 넣어주세요.</Empty>
      ) : (
        [...groups.entries()].map(([category, items]) => (
          <section className="corkboard" key={category}>
            <h2 className="corkboard-title">{category}</h2>
            <div className="pin-grid">
              {items.map((row, index) => (
                <article
                  className="pin-card"
                  key={row.id}
                  style={{ "--tilt": `${tilt(index)}deg` }}
                >
                  <h3>{row.label ?? "[항목]"}</h3>
                  {toParagraphs(row.body).map((text, i) => <p key={i}>{text}</p>)}
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </RoomShell>
  );
}
