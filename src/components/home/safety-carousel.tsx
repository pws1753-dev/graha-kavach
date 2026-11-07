"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export type SafetySlide = {
  key: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  title?: string;
};

export const DEFAULT_SAFETY_SLIDES: SafetySlide[] = [
  {
    key: "first-minute-fire-safety",
    src: "https://admin.grahakavach.in/wp-content/uploads/first_minute_fire_safety_kitchen_poster.webp",
    alt: "The First Minute of a Home Fire — Safety Guide Poster",
    title: "The First Minute of a Home Fire",
    width: 1254,
    height: 1254,
  },
  {
    key: "modern-fire-blanket-guide",
    src: "https://admin.grahakavach.in/wp-content/uploads/modern_fire_blanket_kitchen_safety_guide.webp",
    alt: "Fire Blanket Use for Kitchen Fires — Safety Guide Poster",
    title: "Fire Blanket Use for Kitchen Fires",
    width: 1254,
    height: 1254,
  },
  {
    key: "pass-technique-guide",
    src: "https://admin.grahakavach.in/wp-content/uploads/pass_technique_kitchen_safety_guide.webp",
    alt: "PASS Technique for the Extinguisher — Safety Guide Poster",
    title: "PASS Technique for the Extinguisher",
    width: 1254,
    height: 1254,
  },
  {
    key: "automatic-fire-ball-placement",
    src: "https://admin.grahakavach.in/wp-content/uploads/automatic_fire_ball_placement_guide.webp",
    alt: "Where to Place the Automatic Fire Ball — Safety Guide Poster",
    title: "Where to Place the Automatic Fire Ball",
    width: 1254,
    height: 1254,
  },
  {
    key: "small-fire-recovery-checklist",
    src: "https://admin.grahakavach.in/wp-content/uploads/after_a_small_fire_recovery_checklist.webp",
    alt: "After a Small Fire: Recovery Checklist — Safety Guide Poster",
    title: "After a Small Fire: Recovery Checklist",
    width: 1254,
    height: 1254,
  },
];

type Props = {
  slides?: SafetySlide[];
  autoplaySeconds?: number | null;
  label?: string;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function SafetyCarousel({
  slides = DEFAULT_SAFETY_SLIDES,
  autoplaySeconds = 5,
  label = "Safety Guides",
}: Props) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  // False on the server and during hydration, true afterwards: the portal needs document.body.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const count = slides.length;
  const loop = count > 1;
  const clones = count;

  const extended = useMemo(() => {
    if (!loop) return slides;
    return [
      ...slides.map((slide, i) => ({ ...slide, key: `${slide.key}-pre-${i}` })),
      ...slides,
      ...slides.map((slide, i) => ({ ...slide, key: `${slide.key}-post-${i}` })),
    ];
  }, [slides, loop]);

  const posRef = useRef(clones);

  const autoplayMs =
    typeof autoplaySeconds === "number" && autoplaySeconds > 0 ? autoplaySeconds * 1000 : 0;

  const scrollToChild = useCallback((target: number, smooth: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[target] as HTMLElement | undefined;
    if (!child) return;

    track.scrollTo({
      left: child.offsetLeft - track.offsetLeft,
      behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto",
    });
  }, []);

  const goToExtended = useCallback(
    (target: number, smooth = true) => {
      posRef.current = target;
      scrollToChild(target, smooth);
    },
    [scrollToChild],
  );

  const goToReal = useCallback(
    (target: number) => {
      goToExtended(clones + target, true);
    },
    [goToExtended, clones],
  );

  const nearestChild = useCallback((track: HTMLUListElement) => {
    const point = track.scrollLeft + track.offsetLeft;
    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < track.children.length; i += 1) {
      const child = track.children[i] as HTMLElement;
      const distance = Math.abs(child.offsetLeft - point);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    }
    return nearest;
  }, []);

  useLayoutEffect(() => {
    if (!loop) return;
    posRef.current = clones;
    scrollToChild(clones, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extended]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    let settleTimer = 0;

    function handleScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!track) return;
        const nearest = nearestChild(track);
        const real = loop ? (((nearest - clones) % count) + count) % count : nearest;
        setIndex(real);

        if (!loop) return;

        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          if (!track) return;
          const settledAt = nearestChild(track);
          posRef.current = settledAt;

          if (settledAt < clones || settledAt >= clones + count) {
            const realAt = (((settledAt - clones) % count) + count) % count;
            const canonical = clones + realAt;
            posRef.current = canonical;
            scrollToChild(canonical, false);
          }
        }, 140);
      });
    }

    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      track.removeEventListener("scroll", handleScroll);
    };
  }, [count, loop, clones, nearestChild, scrollToChild]);

  // Autoplay pause when modal is open
  useEffect(() => {
    if (!autoplayMs || !loop || paused || activeModalIndex !== null || prefersReducedMotion()) return;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      goToExtended(posRef.current + 1, true);
    }, autoplayMs);

    return () => window.clearInterval(timer);
  }, [autoplayMs, loop, paused, activeModalIndex, goToExtended]);

  const isPointerDown = useRef(false);
  const dragCapturedId = useRef<number | null>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const dragMoved = useRef(false);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLUListElement>) => {
    if (event.pointerType !== "mouse") return;
    const track = trackRef.current;
    if (!track) return;

    isPointerDown.current = true;
    dragMoved.current = false;
    dragStartX.current = event.clientX;
    dragStartScroll.current = track.scrollLeft;
    setPaused(true);
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLUListElement>) => {
    if (!isPointerDown.current) return;
    const track = trackRef.current;
    if (!track) return;

    const delta = event.clientX - dragStartX.current;
    if (!dragMoved.current && Math.abs(delta) > 5) {
      dragMoved.current = true;
      setDragging(true);
      track.setPointerCapture(event.pointerId);
      dragCapturedId.current = event.pointerId;
    }

    if (dragMoved.current) {
      track.scrollLeft = dragStartScroll.current - delta;
    }
  }, []);

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLUListElement>) => {
      if (!isPointerDown.current) return;
      isPointerDown.current = false;

      const track = trackRef.current;
      if (dragCapturedId.current !== null) {
        try {
          track?.releasePointerCapture(dragCapturedId.current);
        } catch {
          // pointer capture already lost
        }
        dragCapturedId.current = null;
      }

      setDragging(false);
      setPaused(false);

      if (track && dragMoved.current) {
        const nearest = nearestChild(track);
        goToExtended(nearest, true);
        setTimeout(() => {
          dragMoved.current = false;
        }, 80);
      }
    },
    [nearestChild, goToExtended],
  );

  // Keyboard navigation & body scroll lock for Lightbox
  useEffect(() => {
    if (activeModalIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveModalIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveModalIndex((prev) => (prev === null ? null : (prev === 0 ? count - 1 : prev - 1)));
      } else if (e.key === "ArrowRight") {
        setActiveModalIndex((prev) => (prev === null ? null : (prev === count - 1 ? 0 : prev + 1)));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeModalIndex, count]);

  if (count === 0) return null;

  const activeSlide = activeModalIndex !== null ? slides[activeModalIndex] : null;

  return (
    <div
      className="relative w-full"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative">
        <ul
          ref={trackRef}
          tabIndex={0}
          aria-label="Safety guide posters, use arrow keys, drag, or swipe"
          className={cn(
            // Generous vertical padding to prevent shadow clipping from overflow-x-auto
            "flex gap-4 sm:gap-5 lg:gap-6 py-4 px-1 -my-2",
            dragging
              ? "cursor-grabbing overflow-x-auto scroll-auto [scroll-snap-type:none] select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              : "gk-scroll-x cursor-grab",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              goToExtended(posRef.current + 1, true);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              goToExtended(posRef.current - 1, true);
            }
          }}
        >
          {extended.map((slide, position) => {
            const realIndex = position % count;
            return (
              <li
                key={slide.key}
                role="group"
                aria-roledescription="slide"
                aria-label={`${realIndex + 1} of ${count}`}
                className="w-full shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3rem)/3)]"
              >
                <button
                  type="button"
                  aria-label={`Open full guide: ${slide.title || slide.alt}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragMoved.current) return;
                    setActiveModalIndex(realIndex);
                  }}
                  className="group relative block w-full text-left cursor-pointer overflow-hidden rounded-[20px] border border-border/80 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    width={slide.width}
                    height={slide.height}
                    draggable={false}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="block h-auto w-full rounded-[20px] object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                    style={{ aspectRatio: "1 / 1" }}
                  />

                  {/* Zoom hint badge on hover */}
                  <div className="pointer-events-none absolute top-3.5 right-3.5 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4.5"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                      <path d="M11 8v6" />
                      <path d="M8 11h6" />
                    </svg>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => goToExtended(posRef.current - 1, true)}
              aria-label="Previous safety guide"
              className="absolute top-1/2 -left-3 lg:-left-5 xl:-left-6 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-white hover:scale-105 active:scale-95 lg:grid border border-border/50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => goToExtended(posRef.current + 1, true)}
              aria-label="Next safety guide"
              className="absolute top-1/2 -right-3 lg:-right-5 xl:-right-6 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur-sm transition hover:bg-white hover:scale-105 active:scale-95 lg:grid border border-border/50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden="true"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="mt-8 flex items-center justify-center gap-2">
          {slides.map((slide, position) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => goToReal(position)}
              aria-label={`Go to slide ${position + 1}: ${slide.title || slide.alt}`}
              aria-current={position === index ? "true" : undefined}
              className="grid h-7 place-items-center px-1"
            >
              <span
                className={cn(
                  "block h-1.5 rounded-full transition-all duration-300",
                  position === index ? "w-6 bg-primary" : "w-1.5 bg-border-strong hover:bg-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Fullscreen Lightbox Modal when clicked */}
      {mounted && activeModalIndex !== null && activeSlide && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeSlide.title || "Safety Guide Poster"}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/92 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 select-none"
          onClick={() => setActiveModalIndex(null)}
        >
          {/* Top Bar with title and close button */}
          <div
            className="flex w-full max-w-4xl items-center justify-between text-white shrink-0 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wider text-white/60">
                Guide {activeModalIndex + 1} of {count}
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {activeSlide.title || activeSlide.alt}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalIndex(null)}
              aria-label="Close lightbox"
              className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 active:scale-95 cursor-pointer shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Centered Large Image with Arrows */}
          <div
            className="relative flex flex-1 w-full max-w-5xl items-center justify-center my-auto min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {count > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveModalIndex((prev) => (prev === null ? null : (prev === 0 ? count - 1 : prev - 1)))
                }
                aria-label="Previous guide"
                className="absolute left-2 sm:left-4 z-20 flex size-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md transition active:scale-90 shadow-xl cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            ) : null}

            {/* Square image container with explicit responsive sizing */}
            <div className="relative w-[min(88vw,72vh)] aspect-square overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
              <Image
                src={activeSlide.src}
                alt={activeSlide.alt}
                fill
                sizes="(max-width: 768px) 88vw, 72vh"
                priority
                className="object-contain select-none"
              />
            </div>

            {count > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveModalIndex((prev) => (prev === null ? null : (prev === count - 1 ? 0 : prev + 1)))
                }
                aria-label="Next guide"
                className="absolute right-2 sm:right-4 z-20 flex size-12 items-center justify-center rounded-full bg-white/20 hover:bg-white/35 text-white backdrop-blur-md transition active:scale-90 shadow-xl cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Dots inside lightbox for quick navigation */}
          {count > 1 ? (
            <div
              className="flex items-center justify-center gap-2.5 py-3 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {slides.map((s, idx) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActiveModalIndex(idx)}
                  aria-label={`View guide ${idx + 1}`}
                  className="grid h-8 place-items-center px-1 cursor-pointer"
                >
                  <span
                    className={cn(
                      "block h-2 rounded-full transition-all duration-300",
                      idx === activeModalIndex ? "w-8 bg-white shadow-sm" : "w-2 bg-white/40 hover:bg-white/70",
                    )}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>,
        document.body,
      )}
    </div>
  );
}
