/* =========================================================================
   App.jsx — 라우트 정의
   /            미궁 (공개). 이미 인증됐으면 아카이브로 보낸다.
   그 외 전부   RequireAuth 로 감싼 보호 라우트
   ========================================================================= */

import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import RequireAuth from "./routes/RequireAuth.jsx";
import AuthVeil from "./components/AuthVeil.jsx";
import { useSession } from "./session/SessionProvider.jsx";
import { ARCHIVE_PATH } from "./lib/auth.js";

import Maze from "./components/maze/Maze.jsx";

/* 미궁은 처음부터 있어야 하지만, 방들은 봉인을 지나기 전에는 필요 없다.
   받아 오는 동안에는 세션 확인 때와 같은 가림막을 쓴다. */
const ArchiveLayout = lazy(() => import("./components/ArchiveLayout.jsx"));
const ArchiveHome = lazy(() => import("./pages/ArchiveHome.jsx"));
const OurStory = lazy(() => import("./pages/OurStory.jsx"));
const AboutYunyeong = lazy(() => import("./pages/AboutYunyeong.jsx"));
const Messages = lazy(() => import("./pages/Messages.jsx"));
const Future = lazy(() => import("./pages/Future.jsx"));
const Places = lazy(() => import("./pages/Places.jsx"));
const Secret = lazy(() => import("./pages/Secret.jsx"));

/**
 * 루트 경로.
 * 세션을 확인하는 동안에도 미궁은 그대로 열어 둔다(미궁은 보호 대상이 아니다).
 * 확인 결과 세션이 있으면 아카이브로 바로 보낸다.
 */
function MazeRoute() {
  const { status } = useSession();

  /* 미궁을 다 그리고 한가해지면 방 꾸러미를 미리 받아 둔다.
     봉인을 지나는 순간에는 이미 손에 있어서 가림막이 뜨지 않는다. */
  useEffect(() => {
    const warm = () => {
      import("./components/ArchiveLayout.jsx");
      import("./pages/ArchiveHome.jsx");
    };
    const idle = window.requestIdleCallback;
    const id = idle ? idle(warm) : window.setTimeout(warm, 1200);
    return () => (idle ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, []);

  if (status === "authenticated") return <Navigate to={ARCHIVE_PATH} replace />;
  return <Maze />;
}

/** 보호 라우트 한 겹으로 묶기 */
function Protected({ children }) {
  return (
    <RequireAuth>
      <Suspense fallback={<AuthVeil />}>
        <ArchiveLayout>{children}</ArchiveLayout>
      </Suspense>
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
