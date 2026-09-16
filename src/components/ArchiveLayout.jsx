/* =========================================================================
   ArchiveLayout.jsx — 인증 이후 화면의 공통 뼈대

   아카이브는 더 이상 문서가 아니라 공간이다. 머리글도 메뉴도 없고,
   방과 방 사이는 로비의 문으로만 오간다.
   ========================================================================= */

/* 방 안쪽에서만 쓰는 스타일. 순서는 예전 main.jsx 에 있던 그대로다. */
import "../styles/rooms.css";
import "../styles/room-scene.css";
import "../styles/room-shell.css";
import "../styles/room-features.css";
import "../styles/phone-screen.css";
import "../styles/manual-book.css";
import "../styles/secret-letter.css";
import "../styles/archive.css";

import { useLocation } from "react-router-dom";

export default function ArchiveLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="archive-shell">
      {children}

      {/* 떠나는 화면의 빛을 이어받아 마저 식히는 한 겹.
          key 가 바뀌어야 다시 재생되므로 경로를 그대로 키로 쓴다. */}
      <div className="arrive-wash" key={pathname} aria-hidden="true" />
    </div>
  );
}
