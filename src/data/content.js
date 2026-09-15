/* =========================================================================
   content.js — 방마다 어떤 기록을 읽어 오는지

   실제 내용은 루트의 db/*.json 에 있다(src/data/db.js 참고).
   여기서는 화면에 띄울 이름만 정한다 — "아직 비어 있어요" 같은 안내에서
   어느 파일을 고쳐야 하는지 알려주기 위해서다.
   ========================================================================= */

/** 방 키 → 안내 문구에 쓸 파일 이름 */
export const COLLECTIONS = {
  timeline: { file: "db/timeline.json" },
  about: { file: "db/about.json" },
  messages: { file: "db/messages.json" },
  future: { file: "db/future-letters.json" },
  places: { file: "db/places.json" },
  secret: { file: "db/secret-notes.json" },
};

/** 사진·영상을 두는 곳. public/ 아래라 배포하면 그대로 정적 파일이 된다. */
export const MEDIA_BASE = "/media";
