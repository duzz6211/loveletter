/* =========================================================================
   answers.js — 주관식 대답 맞추기

   받아쓰기 시험이 아니다. "더 현대", "더현대 서울", "더현대서울" 은 모두
   같은 대답으로 친다. 그래서 비교하기 전에 양쪽을 같은 모양으로 눕힌다.

     · 앞뒤·중간 공백을 전부 없앤다
     · 영문은 소문자로
     · 문장부호(마침표·물결·따옴표·괄호…)를 없앤다

   이렇게 눕히고 나면 maze.js 의 accept 목록에 같은 말을 여러 번 적어도
   손해가 없다. 목록은 "어떤 대답까지 받아줄 생각인지" 를 보여주는 자리다.
   ========================================================================= */

/** 비교용으로 눕힌 문자열. 빈 대답은 빈 문자열이 된다. */
export function normalizeAnswer(raw) {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?~·・…"'`’‘“”\-_/\\|()[\]{}<>:;]/g, "");
}

/**
 * 입력이 허용 목록 중 하나와 같은가.
 * @param {string} raw      사용자가 적은 그대로
 * @param {string[]} accept 받아줄 대답들 (여기 적힌 것도 같이 눕혀서 비교한다)
 */
export function matchesAnswer(raw, accept) {
  const value = normalizeAnswer(raw);
  if (!value) return false;
  return (accept ?? []).some((candidate) => normalizeAnswer(candidate) === value);
}
