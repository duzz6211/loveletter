/* =========================================================================
   PrivateMedia.jsx — 방에 걸리는 사진·영상

   파일은 public/media/ 에 둔다. 배포하면 그대로 정적 파일이 되므로,
   주소를 아는 사람은 봉인과 무관하게 받을 수 있다.
   (예전에는 Supabase 비공개 버킷에서 서명 URL을 받아 왔다.)
   ========================================================================= */

import { useState } from "react";
import { mediaUrl } from "../lib/content.js";

export default function PrivateMedia({ path, alt, emptyLabel = "[사진 자리]" }) {
  const [failed, setFailed] = useState(false);
  const url = mediaUrl(path);

  if (!url) return <div className="media-slot">{emptyLabel}</div>;
  if (failed) return <div className="media-slot">[파일을 불러오지 못했어요]</div>;

  const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(path);
  return (
    <div className="media-slot">
      {isVideo ? (
        <video src={url} controls playsInline onError={() => setFailed(true)} />
      ) : (
        <img src={url} alt={alt ?? ""} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
