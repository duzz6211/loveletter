/* =========================================================================
   AboutYunyeong.jsx — 유냉 사용설명서. 낱장이 아니라 한 권으로 묶인 책이다.

   방 책상 위의 설명서를 누르면 카메라가 그 물건 안으로 들어온다(RoomScene).
   그래서 도착한 화면은 그 설명서가 펼쳐진 모습이어야 한다 —
   항목 하나가 한 쪽이고, 넘기면 낱장이 실제로 돌아간다.

   넓은 화면은 두 쪽을 마주 보게 펼치고, 좁은 화면은 한 쪽씩 본다.

   ---- 낱장이 도는 동안 무엇이 보이는가 ----
   넘기는 순간 쪽 번호(at)는 이미 새 자리로 가 있고, 도는 낱장 한 장만
   옛 쪽을 들고 있다. 그래서 슬롯을 이렇게 나눠 준다(dir = 1, 앞으로).

     왼쪽 슬롯   옛 왼쪽      (낱장이 덮을 때까지 그대로 있어야 한다)
     오른쪽 슬롯 새 오른쪽    (낱장이 걷히면서 드러난다)
     낱장 앞면   옛 오른쪽    (지금 들고 넘기는 쪽)
     낱장 뒷면   새 왼쪽      (넘겨서 내려놓는 쪽)

   다 돌면 낱장을 치우는데, 그때 뒷면이 놓여 있던 자리에 같은 내용이
   이미 깔려 있으므로 바뀌는 것이 없다. 뒤로 넘길 때는 이 표가 좌우로 뒤집힌다.

   모양은 styles/manual-book.css 에 있다.
   ========================================================================= */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DataNotice from "../components/DataNotice.jsx";
import useCollection from "../lib/useCollection.js";
import useDoorTransition from "../components/room/useDoorTransition.js";
import { toParagraphs } from "../lib/content.js";
import { ARCHIVE_PATH } from "../lib/auth.js";

/** 낱장 한 장이 도는 시간(ms) — CSS 의 bk-turn 과 맞춘다 */
const TURN_MS = 560;

/** 이 폭부터는 두 쪽을 마주 보게 펼친다 */
const SPREAD_AT = "(min-width: 721px)";

/** 화면이 넓으면 2, 좁으면 1. 한 번에 넘기는 쪽수이기도 하다. */
function usePerSpread() {
  const [wide, setWide] = useState(() => window.matchMedia(SPREAD_AT).matches);

  useEffect(() => {
    const mq = window.matchMedia(SPREAD_AT);
    const onChange = (event) => setWide(event.matches);
    setWide(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return wide ? 2 : 1;
}

/** 쪽 하나. 표지는 표지대로, 항목은 항목대로 짜인다. */
function Page({ page, side }) {
  if (!page) {
    return <div className={`bk-page bk-page--${side} is-blank`} aria-hidden="true" />;
  }

  if (page.kind === "title") {
    return (
      <div className={`bk-page bk-page--${side} bk-page--title`}>
        <p className="bk-imprint">YUNYEONG</p>
        <h1 className="bk-booktitle">
          유냉
          <br />
          사용설명서
        </h1>
        <i className="bk-rule" aria-hidden="true" />
        <p className="bk-sub">좋아하는 것 · 습관 · 내가 좋아하는 모습</p>
        <p className="bk-colophon">계속 늘어나는 중 · 개정판</p>
      </div>
    );
  }

  const { row, folio } = page;
  return (
    <div className={`bk-page bk-page--${side}`}>
      <p className="bk-head">{row.category ?? "기타"}</p>
      <h2 className="bk-label">{row.label ?? "[항목]"}</h2>
      <div className="bk-body">
        {toParagraphs(row.body).map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </div>
      <span className="bk-folio">{folio}</span>
    </div>
  );
}

export default function AboutYunyeong() {
  /* 나가는 연출은 방·휴대폰과 같은 것을 쓴다 — 단추를 누르면 뒤로 물러난다 */
  const { exiting, flashing, leave } = useDoorTransition();
  const { loading, rows, notice } = useCollection("about");
  const per = usePerSpread();

  /* 표지 한 장을 앞에 세워야 "낱장 묶음"이 아니라 "한 권"이 된다 */
  const pages = useMemo(
    () => [
      { id: "__title", kind: "title" },
      ...rows.map((row, i) => ({
        id: row.id ?? `p${i}`,
        kind: "entry",
        row,
        folio: i + 1,
      })),
    ],
    [rows]
  );

  /** 지금 펼친 자리 = 왼쪽 쪽의 번호. 늘 per 의 배수로 둔다. */
  const [at, setAt] = useState(0);
  /** 도는 중인 낱장. { dir, from } — from 은 넘기기 직전의 자리. */
  const [turn, setTurn] = useState(null);
  const turnTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(turnTimer.current), []);

  /* 펼침이 한 쪽 ↔ 두 쪽으로 바뀌면 자리를 per 의 배수로 다시 맞춘다 */
  useEffect(() => {
    setAt((current) => current - (current % per));
  }, [per]);

  const go = useCallback(
    (dir) => {
      if (turn) return;
      const next = at + dir * per;
      if (next < 0 || next >= pages.length) return;

      setAt(next);
      /* 한 쪽씩 볼 때도 방향은 기억해 둔다 — 넘겨 들어오는 쪽이 갈린다 */
      setTurn({ dir, from: at });
      turnTimer.current = window.setTimeout(
        () => setTurn(null),
        per === 2 ? TURN_MS : 380
      );
    },
    [at, pages.length, per, turn]
  );

  /* 책이니까 좌우 방향키로도 넘어가야 한다 */
  useEffect(() => {
    function onKey(event) {
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /* ---- 슬롯 나누기 (파일 첫머리의 표 그대로) ---- */
  const spread = per === 2;
  let leftSlot = pages[at] ?? null;
  let rightSlot = spread ? pages[at + 1] ?? null : null;
  let leafFront = null;
  let leafBack = null;

  if (turn && spread) {
    if (turn.dir === 1) {
      leftSlot = pages[turn.from] ?? null;
      rightSlot = pages[at + 1] ?? null;
      leafFront = pages[turn.from + 1] ?? null;
      leafBack = pages[at] ?? null;
    } else {
      leftSlot = pages[at] ?? null;
      rightSlot = pages[turn.from + 1] ?? null;
      leafFront = pages[at + 1] ?? null;
      leafBack = pages[turn.from] ?? null;
    }
  }

  const last = Math.max(0, pages.length - per);
  /* 마지막 펼침의 오른쪽이 빈 면이면 쪽수도 한 쪽만 센다 */
  const shown =
    spread && at + 1 < pages.length ? `${at + 1}–${at + 2}` : `${at + 1}`;

  if (loading || rows.length === 0) {
    return (
      <div className="bk">
        <div className="bk-book bk-book--single bk-book--flat">
          <div className="bk-spread">
            <div className="bk-page bk-page--l bk-page--title">
              <h1 className="bk-booktitle">
                유냉
                <br />
                사용설명서
              </h1>
              <i className="bk-rule" aria-hidden="true" />
              <p className="bk-sub">
                {loading
                  ? "펼치는 중…"
                  : "아직 아무것도 적히지 않았어요. db/about.json 에 내용을 넣어주세요."}
              </p>
              <DataNotice>{notice}</DataNotice>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bk${exiting ? " is-exiting" : ""}`}>
      {/* --read 로 왼쪽·오른쪽 낱장 단면의 두께가 갈린다 — 읽은 만큼 왼쪽이 두꺼워진다 */}
      <div
        className={`bk-book${spread ? "" : " bk-book--single"}`}
        style={{ "--read": pages.length > 1 ? at / (pages.length - 1) : 0 }}
      >
        <i className="bk-edge bk-edge--l" aria-hidden="true" />
        <i className="bk-edge bk-edge--r" aria-hidden="true" />

        <div className="bk-spread">
          {spread ? (
            <>
              <Page page={leftSlot} side="l" />
              <Page page={rightSlot} side="r" />
            </>
          ) : (
            /* 한 쪽씩 볼 때는 낱장을 돌릴 자리가 없다 — key 로 다시 그린다 */
            <div className="bk-single" key={at} data-dir={turn?.dir ?? 1}>
              <Page page={leftSlot} side="l" />
            </div>
          )}

          {/* 가운데 접힘. 쪽 위에 얹혀야 종이가 골로 말려 들어간 것으로 보인다. */}
          <i className="bk-gutter" aria-hidden="true" />

          {turn && spread && (
            <div
              className={`bk-leaf${turn.dir === -1 ? " is-back" : ""}`}
              aria-hidden="true"
            >
              <div className="bk-leaf-face bk-leaf-face--front">
                <Page page={leafFront} side="r" />
              </div>
              <div className="bk-leaf-face bk-leaf-face--back">
                <Page page={leafBack} side="l" />
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="bk-nav" aria-label="설명서 넘기기">
        <button
          className="bk-turn"
          type="button"
          onClick={() => go(-1)}
          disabled={at === 0 || !!turn}
          aria-label="앞 쪽으로"
        >
          ‹
        </button>

        <span className="bk-count">
          {shown} <small>/ {pages.length}</small>
        </span>

        <button
          className="bk-turn"
          type="button"
          onClick={() => go(1)}
          disabled={at >= last || !!turn}
          aria-label="다음 쪽으로"
        >
          ›
        </button>

        <button
          className="bk-close"
          type="button"
          onClick={() => leave(ARCHIVE_PATH)}
        >
          책을 덮는다
        </button>
      </nav>

      <DataNotice>{notice}</DataNotice>

      <div className={`space-flash${flashing ? " is-active" : ""}`} aria-hidden="true" />
    </div>
  );
}
