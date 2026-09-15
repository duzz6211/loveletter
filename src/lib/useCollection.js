/* 보호 콘텐츠 한 묶음을 불러오는 공통 훅 */
import { useCallback, useEffect, useRef, useState } from "react";
import { loadCollection, noticeFor } from "./content.js";

export default function useCollection(key) {
  const [state, setState] = useState({ loading: true, rows: [], notice: null });
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    const result = await loadCollection(key);
    if (!aliveRef.current) return;
    setState({
      loading: false,
      rows: result.rows,
      notice: noticeFor(result, key),
    });
  }, [key]);

  useEffect(() => {
    aliveRef.current = true;
    load();
    return () => {
      aliveRef.current = false;
    };
  }, [load]);

  /** 다시 읽어온다. 미래 편지처럼 시각이 지나면 내용이 바뀌는 곳에서 쓴다. */
  return { ...state, refetch: load };
}
