/* =========================================================================
   RequireAuth.jsx — 보호 라우트 가드
   세션 확인이 끝나기 전에는 자식(보호 콘텐츠)을 아예 마운트하지 않는다.
   세션이 없으면 그리지 않은 채 미궁으로 되돌린다.
   ========================================================================= */

import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../session/SessionProvider.jsx";
import { MAZE_PATH } from "../lib/auth.js";
import AuthVeil from "../components/AuthVeil.jsx";

export default function RequireAuth({ children }) {
  const { status } = useSession();
  const location = useLocation();

  // 확인 중에는 보호 콘텐츠를 렌더링하지 않는다
  if (status === "loading") return <AuthVeil />;

  if (status !== "authenticated") {
    return <Navigate to={MAZE_PATH} replace state={{ from: location.pathname }} />;
  }

  return children;
}
