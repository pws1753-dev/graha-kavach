/**
 * Offer countdown, evaluated in India time so every visitor sees the same
 * deadline whatever their device clock says.
 *
 * Three modes, in this order:
 *  1. `endsAt` ("YYYY-MM-DD HH:MM"): a fixed deadline, used only while it is
 *     still in the future. Once it passes, the timer never sits at 00:00:00:
 *     it falls through to the next mode.
 *  2. `cycleDays` (default 3): a rolling cycle. The offer ends every N days on
 *     a grid anchored at 8 Nov 2026 00:00 IST, and the next cycle starts the
 *     moment one ends:
 *       end = anchor + ceil((now - anchor) / cycle) * cycle
 *  3. `cycleDays` = 0: `endTime` ("HH:MM", default 23:59), a daily cut-off.
 */
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 2026-11-08 00:00 IST, expressed as a UTC instant. */
const CYCLE_ANCHOR_MS = Date.UTC(2026, 10, 8, 0, 0, 0) - IST_OFFSET_MS;
const DEFAULT_CYCLE_DAYS = 3;

export type CountdownConfig = { endTime: string; endsAt: string; cycleDays?: string };

/** Whole days per cycle. Empty or unreadable means the default; 0 turns the cycle off. */
export function cycleLengthDays(raw: string | undefined): number {
  const text = (raw ?? "").trim();
  if (text === "") return DEFAULT_CYCLE_DAYS;
  const days = Math.floor(Number(text));
  return Number.isFinite(days) && days >= 0 ? days : DEFAULT_CYCLE_DAYS;
}

function fixedEndMs(endsAt: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/.exec(endsAt.trim());
  if (!match) return null;
  // The fields are India wall-clock time; the offer lasts to the end of that minute.
  return Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], 59) - IST_OFFSET_MS;
}

/** Whether the countdown shows a days box, before the clock has been read. */
export function showsDays(config: CountdownConfig): boolean {
  return cycleLengthDays(config.cycleDays) >= 2 || fixedEndMs(config.endsAt) !== null;
}

/** Seconds left, never negative, and whether the days box applies right now. */
export function countdownState(config: CountdownConfig, now = Date.now()): { seconds: number; showDays: boolean } {
  const fixed = fixedEndMs(config.endsAt);
  if (fixed !== null && fixed > now) {
    return { seconds: Math.floor((fixed - now) / 1000), showDays: true };
  }

  const cycleDays = cycleLengthDays(config.cycleDays);
  if (cycleDays > 0) {
    const cycleMs = cycleDays * DAY_MS;
    const end = CYCLE_ANCHOR_MS + Math.ceil((now - CYCLE_ANCHOR_MS) / cycleMs) * cycleMs;
    return { seconds: Math.max(0, Math.floor((end - now) / 1000)), showDays: cycleDays >= 2 };
  }

  const daily = /^(\d{1,2}):(\d{2})$/.exec(config.endTime.trim());
  const hours = daily ? Math.min(23, +daily[1]) : 23;
  const minutes = daily ? Math.min(59, +daily[2]) : 59;

  // Shift to IST, then read the UTC fields as IST wall-clock time.
  const istNow = now + IST_OFFSET_MS;
  const today = new Date(istNow);
  let end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hours, minutes, 59);
  if (end < istNow) end += DAY_MS;

  return { seconds: Math.max(0, Math.floor((end - istNow) / 1000)), showDays: false };
}

export function splitSeconds(total: number) {
  const two = (n: number) => String(n).padStart(2, "0");
  return {
    dd: two(Math.floor(total / 86400)),
    hh: two(Math.floor((total % 86400) / 3600)),
    mm: two(Math.floor((total % 3600) / 60)),
    ss: two(total % 60),
  };
}
