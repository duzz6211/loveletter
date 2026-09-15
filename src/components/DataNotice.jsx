/** 데이터 출처 안내 — db 파일이 비었거나 못 읽었을 때만 나온다 */
export default function DataNotice({ children }) {
  if (!children) return null;
  return <p className="room-notice" id="notice">{children}</p>;
}
