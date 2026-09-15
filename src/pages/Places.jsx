/* =========================================================================
   함께 간 곳 — 목록이 아니라 복도다.
   한 걸음씩 걸어 들어가면 좌우 벽에 걸린 사진 앞에 차례로 서게 된다.
   ========================================================================= */

import RoomShell from "../components/room/RoomShell.jsx";
import GalleryWalk from "../components/room/GalleryWalk.jsx";
import DataNotice from "../components/DataNotice.jsx";
import Empty from "../components/Empty.jsx";
import useCollection from "../lib/useCollection.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

const ROOM = ROOM_BY_PATH["/places"];

export default function Places() {
  const { loading, rows, notice } = useCollection("places");

  // 걸을 게 없으면 복도를 열지 않고 평범한 방으로 안내한다
  if (loading || rows.length === 0) {
    return (
      <RoomShell
        tone={ROOM.tone}
        kicker={ROOM.kicker}
        title={ROOM.title}
        lead="같이 다녀온 곳을 복도에 걸어 둘 거예요."
      >
        <DataNotice>{notice}</DataNotice>
        <Empty>
          {loading
            ? "복도에 불을 켜는 중…"
            : "아직 장소 기록이 없어요. db/places.json 에 내용을 넣어주세요."}
        </Empty>
      </RoomShell>
    );
  }

  return (
    <RoomShell tone={ROOM.tone} bleed exitLabel="복도">
      <GalleryWalk
        places={rows}
        kicker={ROOM.kicker}
        title={ROOM.title}
        notice={notice}
      />
    </RoomShell>
  );
}
