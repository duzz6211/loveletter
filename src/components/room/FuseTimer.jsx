/* =========================================================================
   FuseTimer.jsx — 미래 편지의 남은 시간 표시창

   폭탄의 심지가 타 들어가듯, 남은 시간이 줄어드는 걸 눈으로 보게 한다.
   심지 길이는 "앞으로 30일"을 가득 찬 상태로 보고 그린다.
   (편지를 언제 써 두었는지는 서버에 없으므로, 눈에 보이는 기준을 하나 정했다)
   ========================================================================= */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 심지가 가득 차 보이는 기준 구간 */
const FUSE_WINDOW = 30 * DAY;

const pad = (value) => String(value).padStart(2, "0");

/**
 * @param {number} remaining 남은 밀리초. 0 이하면 이미 열린 편지.
 */
export default function FuseTimer({ remaining }) {
  const left = Math.max(0, remaining);

  const days = Math.floor(left / DAY);
  const hours = Math.floor((left % DAY) / HOUR);
  const minutes = Math.floor((left % HOUR) / MINUTE);
  const seconds = Math.floor((left % MINUTE) / SECOND);

  const burn = Math.min(100, (left / FUSE_WINDOW) * 100);

  const readable =
    days > 0
      ? `${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남음`
      : `${hours}시간 ${minutes}분 ${seconds}초 남음`;

  return (
    <>
      <div className="fuse-readout" role="timer" aria-live="off" aria-label={readable}>
        <span className="fuse-unit">
          <span className="fuse-num">{days}</span>
          <span className="fuse-label">DAYS</span>
        </span>
        <span className="fuse-sep" aria-hidden="true">:</span>
        <span className="fuse-unit">
          <span className="fuse-num">{pad(hours)}</span>
          <span className="fuse-label">HRS</span>
        </span>
        <span className="fuse-sep" aria-hidden="true">:</span>
        <span className="fuse-unit">
          <span className="fuse-num">{pad(minutes)}</span>
          <span className="fuse-label">MIN</span>
        </span>
        <span className="fuse-sep" aria-hidden="true">:</span>
        <span className="fuse-unit">
          <span className="fuse-num">{pad(seconds)}</span>
          <span className="fuse-label">SEC</span>
        </span>
      </div>

      <div className="fuse-track" aria-hidden="true">
        <div className="fuse-burn" style={{ "--burn": `${burn}%` }} />
      </div>
    </>
  );
}

export { DAY };
