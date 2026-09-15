/* =========================================================================
   SessionProvider.jsx — 앱 전체가 공유하는 하나의 세션 상태
   status: "loading" 확인 중 | "authenticated" 봉인을 지남 | "anonymous" 아직

   서버가 없으므로 확인은 즉시 끝난다. 그래도 "loading" 단계를 남겨 두는 건
   RequireAuth 가 확인 전에 보호 화면을 그리지 않게 하기 위해서다.
   ========================================================================= */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { signInWithMeetingDate, signOut as doSignOut, isGateConfigured } from "../lib/auth.js";
import { readSession, onSessionChange } from "../lib/session.js";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [state, setState] = useState({ status: "loading", session: null });

  useEffect(() => {
    const session = readSession();
    setState({ status: session ? "authenticated" : "anonymous", session });
    return onSessionChange((next) => {
      setState({ status: next ? "authenticated" : "anonymous", session: next });
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      /** 봉인 날짜를 정해 두었는지. 안 정했으면 아무 날짜나 통과한다. */
      configured: isGateConfigured(),
      /** 날짜로 봉인 열기. 성공하면 onSessionChange 가 상태를 갱신한다. */
      signIn: signInWithMeetingDate,
      signOut: doSignOut,
    }),
    [state]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession은 SessionProvider 안에서만 쓸 수 있습니다.");
  return context;
}
