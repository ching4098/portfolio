import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { DitherMark } from "@/components/dither-mark";
import { EASE } from "@/lib/motion";

/* 01 · The shot pulls: one espresso stream drops into the cup, then the screen lifts away. */
export function ShotIntro({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 1500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" }}
      animate={{ clipPath: "polygon(0 0, 100% 0, 100% 0%, 0 0%)" }}
      transition={{ duration: 0.55, ease: EASE, delay: 0.95 }}
      className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink text-paper"
      aria-hidden="true"
    >
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: [0, 1, 1, 0] }}
        transition={{ duration: 0.95, times: [0, 0.35, 0.8, 1], ease: "easeIn" }}
        style={{ transformOrigin: "top" }}
        className="absolute left-1/2 top-0 h-[44vh] w-[3px] -translate-x-1/2 bg-[var(--crema)]"
      />
      <div className="relative mt-[10vh]">
        <DitherMark variant="intro" className="h-24 w-20 sm:h-32 sm:w-28" />
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE }}
          style={{ transformOrigin: "bottom" }}
          className="absolute inset-x-[18%] bottom-[14%] top-[44%] bg-[var(--crema)] mix-blend-screen opacity-60"
        />
      </div>
      <motion.span
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={{ opacity: 1, letterSpacing: "0.12em" }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        className="font-mono mt-5 text-[11px] uppercase text-ash"
      >
        pulling a shot · 25s
      </motion.span>
    </motion.div>
  );
}

/* 02 · The pour follows you: a thin stream down the right edge, espresso turning to milk. */
export function PourStream() {
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const height = useTransform(scrollYProgress, [0, 1], ["4%", "100%"]);
  const color = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ["#3a1b12", "#6b4228", "#b07a4c", "#efe3d3"]);
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed right-[4.6rem] top-0 z-30 hidden h-screen w-[3px] sm:block" aria-hidden="true">
      <motion.div style={{ height, backgroundColor: color }} className="w-full rounded-b-full" />
      <motion.div
        style={{ top: height, backgroundColor: color }}
        animate={{ y: [0, 10, 0], opacity: [1, 0.4, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
      />
    </div>
  );
}

/* 03 · Milk rises: a jagged band pours up through a section the first time you reach it. */
export function MilkRise({ tone }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = usePrefersReducedMotion();
  const fill = tone === "ink" ? "var(--crema-dark)" : "var(--milk)";
  if (reduce) return <div ref={ref} className="absolute inset-0" aria-hidden="true" style={{ pointerEvents: "none" }} />;
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-[25] overflow-hidden" aria-hidden="true">
      <motion.div
        initial={{ y: "100%" }}
        animate={inView ? { y: ["100%", "0%", "-105%"] } : { y: "100%" }}
        transition={{ duration: 1.05, times: [0, 0.45, 1], ease: [0.65, 0, 0.35, 1] }}
        className="absolute inset-0"
        style={{
          background: fill,
          clipPath: "polygon(0 6%, 9% 2%, 21% 7%, 34% 1%, 47% 6%, 61% 0, 74% 5%, 88% 1%, 100% 5%, 100% 100%, 0 100%)",
        }}
      />
    </div>
  );
}

/* 05 · Latte art taps: every click drops milk that rings outward. */
export function LatteRipple() {
  const reduce = usePrefersReducedMotion();
  const [drops, setDrops] = useState([]);
  useEffect(() => {
    if (reduce) return;
    let id = 0;
    const onDown = (e) => {
      const drop = { id: id++, x: e.clientX, y: e.clientY };
      setDrops((d) => [...d.slice(-5), drop]);
      setTimeout(() => setDrops((d) => d.filter((x) => x.id !== drop.id)), 900);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [reduce]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[55]" aria-hidden="true">
      {drops.map((d) => (
        <span key={d.id} className="absolute" style={{ left: d.x, top: d.y }}>
          {[0, 0.12, 0.24].map((delay) => (
            <motion.span
              key={delay}
              initial={{ scale: 0.1, opacity: 0.9 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.75, delay, ease: "easeOut" }}
              className="absolute -left-8 -top-8 h-16 w-16 rounded-full border-2 border-[var(--milk)] mix-blend-difference"
              style={{ borderRadius: "48% 52% 46% 54%" }}
            />
          ))}
        </span>
      ))}
    </div>
  );
}

/* 06 · Steam trail: the cursor leaves faint steam, only over dark espresso sections. */
export function SteamTrail() {
  const reduce = usePrefersReducedMotion();
  const [puffs, setPuffs] = useState([]);
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    let id = 0;
    let last = 0;
    const onMove = (e) => {
      const now = performance.now();
      if (now - last < 70) return;
      last = now;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || !el.closest("section.dark")) return;
      const puff = { id: id++, x: e.clientX + (Math.random() * 10 - 5), y: e.clientY, r: Math.random() * 30 - 15 };
      setPuffs((p) => [...p.slice(-14), puff]);
      setTimeout(() => setPuffs((p) => p.filter((x) => x.id !== puff.id)), 1100);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[45]" aria-hidden="true">
      {puffs.map((p) => (
        <motion.svg
          key={p.id}
          viewBox="0 0 20 40"
          className="absolute h-8 w-4 text-paper"
          style={{ left: p.x, top: p.y - 24 }}
          initial={{ opacity: 0.45, y: 0, rotate: p.r }}
          animate={{ opacity: 0, y: -42, rotate: p.r * 1.6, scaleX: 1.5 }}
          transition={{ duration: 1.05, ease: "easeOut" }}
        >
          <path d="M10 38 C3 30 17 22 9 13 C4 7 12 3 10 1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </motion.svg>
      ))}
    </div>
  );
}

/* 04 · Crema swirl: a little cup that spins its crema while you hover the card it sits on. */
export function CremaCup({ spinning, size = 44, className = "" }) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 60 60"
      className={className}
      style={{ width: size, height: size }}
      animate={spinning && !reduce ? { rotate: 360 } : { rotate: 0 }}
      transition={spinning ? { duration: 2.6, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
    >
      <circle cx="30" cy="30" r="28" fill="var(--crema-dark)" />
      <circle cx="30" cy="30" r="22" fill="var(--crema)" opacity="0.9" />
      <path d="M30 9 C44 18 42 30 30 30 C18 30 16 43 30 51" fill="none" stroke="var(--milk)" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 22 C20 26 22 34 17 40" fill="none" stroke="var(--milk)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
    </motion.svg>
  );
}

/* 07 · Bubbles pop: microfoam drifting in the section, each hiding a tasting note. */
export function FoamBubbles({ notes }) {
  const reduce = usePrefersReducedMotion();
  const [popped, setPopped] = useState({});
  const spots = [
    { left: "4%", top: "12%", s: 96 },
    { left: "78%", top: "6%", s: 64 },
    { left: "88%", top: "58%", s: 110 },
    { left: "58%", top: "80%", s: 58 },
    { left: "14%", top: "78%", s: 76 },
    { left: "40%", top: "4%", s: 50 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      {notes.slice(0, spots.length).map((note, i) => {
        const s = spots[i];
        const isPopped = popped[i];
        return (
          <div key={note} className="absolute" style={{ left: s.left, top: s.top }}>
            <AnimatePresence mode="wait">
              {!isPopped ? (
                <motion.button
                  key="bubble"
                  type="button"
                  aria-label={`Pop a foam bubble to read a tasting note`}
                  onClick={() => setPopped((p) => ({ ...p, [i]: true }))}
                  className="pointer-events-auto rounded-full border-2 border-paper/50 transition-colors hover:border-[var(--crema)]"
                  style={{ width: s.s, height: s.s, borderRadius: i % 2 ? "47% 53% 52% 48%" : "52% 48% 45% 55%" }}
                  animate={reduce ? {} : { y: [0, -8 - i, 0] }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 3 + i * 0.4, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
                />
              ) : (
                <motion.span
                  key="note"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="font-hand pointer-events-auto block text-2xl text-[var(--crema)]"
                  style={{ transform: `rotate(${(i % 3) * 4 - 4}deg)` }}
                >
                  {note}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* 09 · Empty cup: at the bottom the cup tips over. Refill scrolls back up and pulls a new shot. */
export function EmptyCup({ onRefill }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.6 });
  const reduce = usePrefersReducedMotion();
  return (
    <div ref={ref} className="flex items-end gap-4">
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 110 110"
        className="h-20 w-20 text-paper"
        style={{ transformOrigin: "30% 90%" }}
        animate={inView && !reduce ? { rotate: -32 } : { rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 9, delay: 0.3 }}
      >
        <path d="M15 30 L85 30 L78 92 Q76 100 66 100 L34 100 Q24 100 22 92 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M85 42 Q104 42 104 58 Q104 74 82 74" fill="none" stroke="currentColor" strokeWidth="3" />
      </motion.svg>
      <button
        type="button"
        onClick={onRefill}
        className="font-mono mb-2 border border-paper/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-paper transition hover:-translate-y-0.5 hover:bg-paper hover:text-ink active:translate-y-0"
      >
        Refill ↺
      </button>
    </div>
  );
}

