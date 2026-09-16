/* =========================================================================
   motion.js — 연출에 쓰는 공통 조각
   ========================================================================= */

import { useEffect, useState } from "react";

/** 초침 하나. 1초마다 지금 시각을 새로 준다. */
export function useTick() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
