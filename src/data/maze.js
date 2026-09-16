/* =========================================================================
   maze.js — 미궁의 모든 문구와 질문 데이터
   화면 로직은 이 파일만 읽는다. 문구 수정은 전부 여기서 한다.
   ========================================================================= */

/** 진행 표시에 쓰는 서수. "n번째 벽" 형태로만 노출한다. */
export const ORDINAL = ["첫", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"];

/** 확대된 벽판의 WALL 표시 */
export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** 벽판 상단 각인 */
export const SEALS = [
  "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH",
  "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "FINAL",
];

/** 벽판에 새겨진 상징 문양 */
export const SYMBOLS = ["✦", "✧", "❖", "✵", "✶", "❈", "✹", "✷", "✸", "✺"];

/**
 * 열 개의 벽.
 *
 * 벽은 두 종류다.
 *   kind: "text"   주관식. 직접 적어 넣는다. accept 중 하나와 같으면 통과.
 *                  띄어쓰기·문장부호는 무시하고 비교한다(lib/answers.js).
 *   kind: "choice" 객관식. answers 중 correct 번째를 고르면 통과.
 *                  correct: "any" 로 두면 무엇을 골라도 통과한다.
 *
 * @typedef {Object} Wall
 * @property {"text"|"choice"} kind
 * @property {string}   question  벽판에 새겨진 질문
 * @property {string}   copy      질문 아래 짧은 보조 문장
 * @property {string}   success   정답 직후 표시할 짧은 문장
 *
 * -- kind: "text" --
 * @property {string[]=} accept       받아줄 대답들
 * @property {string=}   placeholder  입력칸 힌트
 * @property {boolean=}  gateDate     사귄 날을 묻는 벽(세 번째).
 *                                    accept 대신 GATE_DATE 로 판정하고,
 *                                    통과한 값을 마지막 봉인에 그대로 넘긴다.
 * @property {string=}   inputMode    숫자만 받을 때 "numeric"
 *
 * -- kind: "choice" --
 * @property {string[]=} answers
 * @property {number|"any"=} correct
 * @property {number=}   evadeIndex  커서를 피해 달아날 선택지(열 번째 벽 전용)
 */
export const WALLS = [
  {
    kind: "text",
    question: "이름이 무엇인가요?",
    copy: "첫 번째 벽은 이름을 기억하는 사람에게만 열립니다.",
    accept: ["윤영", "최윤영"],
    placeholder: "이름을 적어주세요",
    success: "이름이 확인되었어요. 첫 번째 봉인이 풀립니다.",
  },
  {
    kind: "text",
    question: "이 선물을 준비한 사람이 누구일까요?",
    copy: "아주 많은 시간을 들여 이곳을 세워 둔 사람이 있습니다.",
    accept: ["유민석", "민석", "멍청민석"],
    placeholder: "이름을 적어주세요",
    success: "맞아요. 그 사람은 문 너머에서 기다리고 있어요.",
  },
  {
    /* 이 벽이 곧 마지막 봉인이다. 여기서 통과한 날짜를 그대로 들고 가서
       열 번째 벽을 지난 뒤 세션을 연다. 정답은 lib/auth.js 의 GATE_DATE. */
    kind: "text",
    gateDate: true,
    question: "우리가 사귄 날은?",
    copy: "여덟 자리 숫자로 적어주세요. 예: 20240101",
    placeholder: "YYYYMMDD",
    inputMode: "numeric",
    success: "그 날을 잊지 않았군요. 세 번째 봉인이 풀립니다.",
  },
  {
    kind: "text",
    question: "우리의 첫 데이트 장소는 어디인가요?",
    copy: "처음으로 나란히 걸었던 곳이에요.",
    /* 띄어쓰기는 무시하고 비교하므로 "더 현대" 와 "더현대" 는 같은 대답이다.
       아래 목록은 어디까지 받아줄 생각인지를 적어 둔 것이다. */
    accept: ["더 현대", "더현대", "더현대 서울", "더현대서울", "더 현대 서울"],
    placeholder: "장소 이름을 적어주세요",
    success: "맞아요. 그 날, 그 곳이었어요.",
  },
  {
    kind: "text",
    question: "우리의 첫 여행 장소는 어디인가요?",
    copy: "둘이서 처음으로 멀리 다녀온 곳입니다.",
    accept: ["강릉"],
    placeholder: "장소 이름을 적어주세요",
    success: "바다가 있던 그 곳이 맞아요.",
  },
  {
    kind: "choice",
    question: "제가 가장 좋아하는 당신의 모습은 무엇인가요?",
    copy: "하나만 고르기 어려운 문제일지도 몰라요.",
    answers: ["잠 자는 당신", "밥 먹는 당신", "애교부리는 당신", "말랑이 만지는 당신"],
    correct: "any",
    success: "무엇을 골라도 정답이에요. 사실은 전부 다예요.",
  },
  {
    kind: "choice",
    question: "윤영님을 가장 사랑하는 사람이 누구일까요?",
    copy: "이건 앞으로도 바뀌지 않을 답입니다.",
    answers: ["유민석", "민석", "멍청민석"],
    correct: "any",
    success: "어떻게 불러도 결국 같은 사람이에요.",
  },
  {
    /* TODO(윤영): 여덟 번째 벽 — 아직 질문을 정하지 않아 예전 문항을 그대로 뒀다.
       바꿀 때는 question / copy / answers / correct / success 만 고치면 된다. */
    kind: "choice",
    question: "이 미궁의 끝에는 무엇이 기다리고 있을까요?",
    copy: "여기까지 온 이유를 생각해보세요.",
    answers: ["또 다른 시험", "보물 상자", "우리의 이야기"],
    correct: 2,
    success: "처음부터 이 길은 우리의 이야기로 이어져 있었어요.",
  },
  {
    /* TODO(윤영): 아홉 번째 벽 — 위와 같다. 원하는 질문으로 갈아 끼우면 된다. */
    kind: "choice",
    question: "우리의 이야기는 어디까지 이어질까요?",
    copy: "아홉 번째 벽에는 아직 끝이 적혀 있지 않습니다.",
    answers: ["아주 먼 미래까지", "여기까지만"],
    correct: 0,
    success: "아직 쓰지 않은 이야기가 우리 앞에 많이 남아 있어요.",
  },
  {
    kind: "choice",
    question: "앞으로도 저랑 함께해주실래요?",
    copy: "마지막 벽은 대답 하나만을 기다리고 있습니다.",
    answers: ["예", "아니오"],
    correct: 0,
    success: "열 번째 봉인이 풀렸어요.",
    /** 이 인덱스의 선택지는 커서를 피해 달아난다. */
    evadeIndex: 1,
  },
];

/** 오답 안내 — 공격적이지 않게, 순환해서 보여준다. */
export const WRONG_MESSAGES = [
  "벽판이 반응하지 않아요. 다른 답을 찾아보세요.",
  "문은 아직 조용해요. 한 번 더 생각해볼까요?",
  "이 답은 벽을 열지 못했어요. 천천히 다시 골라주세요.",
];

/** 열 번째 벽의 아니오 버튼 문구 */
export const EVADE_MESSAGE = "그 대답은 마지막 벽이 허락하지 않아요.";
export const EVADE_TOUCH_MESSAGE =
  "그 대답은 마지막 벽이 허락하지 않아요. 옆의 대답이 기다리고 있어요.";

/**
 * 첫 화면 — 문보다 먼저 나오는 표지.
 * 설명하지 않는다. 어디에 서 있는지만 알려주고 답을 기다린다.
 */
export const INTRO_COPY = {
  kicker: "A PRIVATE PLACE",
  title: "이 공간은 비밀 공간입니다.",
  ask: "입장하시겠습니까?",
  enter: "네, 들어갈게요",
  wait: "조금 더 있다가요",
  waitReply: "괜찮아요. 문은 닫지 않고 여기서 기다릴게요.",
};

/** 벽판·가이드 문구 */
export const COPY = {
  plaqueHint: "가까이 다가가기",
  guideFirst: "벽에 걸린 문장을 눌러 가까이 다가가세요.",
  /** @param {string} ordinal 예: "두" */
  guideNext: (ordinal) => `${ordinal} 번째 벽 — 벽판을 눌러 다음 봉인을 확인하세요.`,
  progress: (ordinal) => `${ordinal} 번째 벽`,
  doorOpening: "문이 열립니다.",
  /** 주관식 벽의 대답 버튼 */
  answerSubmit: "대답하기",
};

/**
 * 마지막 화면 문구.
 * 사귄 날은 세 번째 벽에서 이미 받았으므로 보통은 다시 묻지 않는다.
 * form* 문구는 그 날짜를 잃어버렸을 때만 쓰는 되물음용이다.
 */
export const GATE_COPY = {
  kicker: "ALL TEN SEALS ARE OPEN",
  title: "열 개의 봉인이 모두 풀렸어요.",
  lead: "이제 마지막 문을 열게요.",
  unsealing: "문을 여는 중이에요…",
  success: "봉인이 풀렸어요. 우리의 이야기로 들어갈게요…",

  /* ---- 되물음(예외 상황) ---- */
  formLead: "마지막으로 한 번만 더 확인할게요.",
  label: "우리가 사귄 날",
  placeholder: "YYYY.MM.DD",
  hint: "YYYY.MM.DD 형식으로 입력해주세요.",
  submit: "우리의 이야기 열기",
  checking: "봉인을 확인하는 중이에요…",
  /** 정답을 유추할 수 있는 단서를 주지 않는 단일 실패 문구 */
  failed: "그 날짜로는 마지막 봉인이 열리지 않아요.",
  locked: (seconds) => `잠시 후에 다시 시도해주세요. (${seconds}초)`,
};

/** 연출 타이밍(ms). maze.css의 --t-* 값과 맞춰 둔다. */
export const TIMING = {
  cameraIn: 950,     // 벽판 앞으로 시점 이동
  panelDelay: 480,   // 카메라가 거의 도착했을 때 벽판 내용 표시
  successHold: 1000, // 성공 문구를 읽는 시간
  panelClose: 520,   // 확대된 벽판이 닫히는 시간
  cameraOut: 950,    // 원래 거리로 복귀
  doorOpen: 1350,    // 문 개방
  lightHold: 500,    // 문틈의 노란빛이 차오르는 시간
  enter: 1100,       // 문 안으로 전진
};
