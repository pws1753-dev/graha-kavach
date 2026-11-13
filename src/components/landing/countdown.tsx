"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { countdownState, showsDays, splitSeconds, type CountdownConfig } from "@/lib/landing/countdown";

type Parts = { dd: string; hh: string; mm: string; ss: string };
type Clock = { parts: Parts; /** A fixed multi-day deadline shows days too. */ showDays: boolean };

const PLACEHOLDER: Parts = { dd: "00", hh: "00", mm: "00", ss: "00" };
const CountdownContext = createContext<Clock | null>({ parts: PLACEHOLDER, showDays: false });

/**
 * One ticking clock shared by every timer on the page. Until it mounts it shows
 * zeros, because the server cannot know the visitor's moment.
 */
export function CountdownProvider({
  config,
  enabled = true,
  children,
}: {
  config: CountdownConfig;
  /** False for a campaign with no deadline: every timer renders nothing. */
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const [parts, setParts] = useState<Parts>(PLACEHOLDER);
  // Before the first tick, guess from the settings so the boxes do not jump.
  const [showDays, setShowDays] = useState(() => showsDays(config));
  const { endTime, endsAt, cycleDays } = config;

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const state = countdownState({ endTime, endsAt, cycleDays });
      setParts(splitSeconds(state.seconds));
      setShowDays(state.showDays);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime, endsAt, cycleDays, enabled]);

  return <CountdownContext.Provider value={enabled ? { parts, showDays } : null}>{children}</CountdownContext.Provider>;
}

/** Null when the page has no countdown. */
export function useCountdown(): Clock | null {
  return useContext(CountdownContext);
}

type DayStyle = "short" | "word" | "small";

/**
 * HH:MM:SS as text, with days in front when the deadline is a fixed date.
 * `short` reads "02d 05:12:33", `word` reads "02 दिन 05:12:33" and `small`
 * sets the word in a smaller size beside large digits.
 */
export function Timer({ className, dayStyle = "short", dayWord = "दिन" }: { className?: string; dayStyle?: DayStyle; dayWord?: string }) {
  const clock = useCountdown();
  if (!clock) return null;
  const { parts, showDays } = clock;

  let days: React.ReactNode = null;
  if (showDays) {
    if (dayStyle === "short") days = <>{parts.dd}d </>;
    else if (dayStyle === "word") days = <>{parts.dd} {dayWord} </>;
    else
      days = (
        <>
          {parts.dd}
          <span className="text-[18px] text-[#a8a29e]"> {dayWord} </span>
        </>
      );
  }

  return (
    <span className={`lp-timer ${className ?? ""}`} suppressHydrationWarning>
      {days}
      {parts.hh}:{parts.mm}:{parts.ss}
    </span>
  );
}

/**
 * The countdown boxes in the hero: hours, minutes and seconds, plus days when
 * the deadline is a fixed date. `units` holds the labels, days first.
 */
export function TimerBoxes({ units }: { units: string[] }) {
  const clock = useCountdown();
  if (!clock) return null;
  const { parts, showDays } = clock;

  // Four labels when days are shown, otherwise the last three.
  const labels = showDays ? [units[units.length - 4] ?? "दिन", ...units.slice(-3)] : units.slice(-3);
  const values = showDays ? [parts.dd, parts.hh, parts.mm, parts.ss] : [parts.hh, parts.mm, parts.ss];
  const compact = values.length > 3;

  return (
    <div className={`flex items-start justify-center ${compact ? "gap-1" : "gap-1.5"}`}>
      {values.map((value, index) => (
        <div key={index} className={`flex items-start ${compact ? "gap-1" : "gap-1.5"}`}>
          {index > 0 ? <div className={`lp-timer text-accent ${compact ? "text-xl leading-[46px]" : "text-2xl leading-[52px]"}`}>:</div> : null}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`lp-timer rounded-[10px] bg-[#2a2a2a] text-center leading-none ${
                compact ? "min-w-[54px] px-1 py-2 text-[27px]" : "min-w-[68px] px-1.5 py-2 text-[34px]"
              } ${index === values.length - 1 ? "text-accent" : "text-white"}`}
              suppressHydrationWarning
            >
              {value}
            </div>
            <div className="text-xs text-[#a8a29e]">{labels[index] ?? ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
