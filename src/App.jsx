/* =========================================================================
   App.jsx — 라우트 정의
   /            미궁 (공개). 이미 인증됐으면 아카이브로 보낸다.
   그 외 전부   RequireAuth 로 감싼 보호 라우트
   ========================================================================= */

import { Navigate, Route, Routes } from "react-router-dom";

import RequireAuth from "./routes/RequireAuth.jsx";
import { useSession } from "./session/SessionProvider.jsx";
import { ARCHIVE_PATH } from "./lib/auth.js";

import Maze from "./components/maze/Maze.jsx";
import ArchiveLayout from "./components/ArchiveLayout.jsx";
import ArchiveHome from "./pages/ArchiveHome.jsx";
import OurStory from "./pages/OurStory.jsx";
import AboutYunyeong from "./pages/AboutYunyeong.jsx";
import Messages from "./pages/Messages.jsx";
import Future from "./pages/Future.jsx";
import Places from "./pages/Places.jsx";
import Secret from "./pages/Secret.jsx";

/**
 * 루트 경로.
 * 세션을 확인하는 동안에도 미궁은 그대로 열어 둔다(미궁은 보호 대상이 아니다).
 * 확인 결과 세션이 있으면 아카이브로 바로 보낸다.
 */
function MazeRoute() {
  const { status } = useSession();
  if (status === "authenticated") return <Navigate to={ARCHIVE_PATH} replace />;
  return <Maze />;
}

/** 보호 라우트 한 겹으로 묶기 */
function Protected({ children }) {
  return (
    <RequireAuth>
      <ArchiveLayout>{children}</ArchiveLayout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MazeRoute />} />

      <Route path="/archive" element={<Protected><ArchiveHome /></Protected>} />
      <Route path="/our-story" element={<Protected><OurStory /></Protected>} />
      <Route path="/about-yunyeong" element={<Protected><AboutYunyeong /></Protected>} />
      <Route path="/messages" element={<Protected><Messages /></Protected>} />
      <Route path="/future" element={<Protected><Future /></Protected>} />
      <Route path="/places" element={<Protected><Places /></Protected>} />
      <Route path="/secret" element={<Protected><Secret /></Protected>} />

      {/* 알 수 없는 주소는 미궁 입구로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
