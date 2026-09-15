/* =========================================================================
   ArchiveLayout.jsx — 인증 이후 화면의 공통 뼈대

   아카이브는 더 이상 문서가 아니라 공간이다. 그래서 헤더 메뉴 대신
   얇은 HUD 하나만 띄우고, 방과 방 사이는 로비의 문으로만 오간다.
   ========================================================================= */

import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../session/SessionProvider.jsx";
import { ARCHIVE_PATH, MAZE_PATH } from "../lib/auth.js";
import { ROOM_BY_PATH } from "../data/rooms.js";

export default function ArchiveLayout({ children }) {
  const { signOut } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const room = ROOM_BY_PATH[pathname] ?? null;
  const inLobby = pathname === ARCHIVE_PATH;

  async function handleSignOut() {
    await signOut();
    navigate(MAZE_PATH, { replace: true });
  }

  return (
    <div className="archive-shell">
      {children}

      <header className="room-hud">
        <p className="brand">YUNYEONG.COM</p>

        <span className="room-hud-here">
          {inLobby ? "복도" : room ? room.title : ""}
        </span>

        {!inLobby && (
          <button
            className="hud-button"
            type="button"
            onClick={() => navigate(ARCHIVE_PATH)}
          >
            복도로
          </button>
        )}

        <button className="hud-button" type="button" data-signout onClick={handleSignOut}>
          나가기
        </button>
      </header>
    </div>
  );
}
