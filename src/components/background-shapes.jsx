import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { BAYER_4X4 } from "@/lib/dither-pattern";

const SECTION_ORDER = ["home", "work", "what-i-do", "projects", "publication", "education", "skills", "about", "contact"];
const TYPES = ["line", "ring", "steam", "angle", "dither", "line", "ring", "steam", "angle", "dither", "line", "ring"];

function hash(seed) {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
}

function targetFor(sectionId, shapeIndex) {
  const s = Math.max(SECTION_ORDER.indexOf(sectionId), 0);
  const base = shapeIndex * 91.7 + s * 233.1;
  const x = `${(hash(base + 1) * 88 + 4).toFixed(1)}vw`;
  const y = `${(hash(base + 2) * 86 + 5).toFixed(1)}vh`;
  const rotate = hash(base + 3) * 360 - 180;
  const scale = 0.35 + hash(base + 4) * 2;
  return { x, y, rotate, scale };
}

function weightFor(shapeIndex) {
  const w = hash(shapeIndex * 17.3 + 5);
  return { w, opacity: 0.16 + w * 0.36 };
}

function LineShape({ className, w }) {
  const length = 56 + w * 96;
  return <div className={`bg-current ${className}`} style={{ width: length, height: w > 0.5 ? 1.5 : 1 }} />;
}

function RingShape({ className, w }) {
  const outer = 42 + w * 34;
  return (
    <div className={`relative ${className}`} style={{ width: outer, height: outer }}>
      <div className="absolute inset-0 rounded-full border-current" style={{ borderWidth: 1.5 }} />
      <div className="absolute rounded-full border-current opacity-50" style={{ inset: outer * 0.24, borderWidth: 1 }} />
    </div>
  );
}

function SteamShape({ className, w }) {
  const size = 52 + w * 24;
  return (
    <svg viewBox="0 0 60 90" className={className} style={{ width: size * 0.62, height: size }}>
      <path d="M20,85 C35,70 5,55 22,40 C38,26 8,15 24,2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M38,85 C50,72 26,58 40,44" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
    </svg>
  );
}

function AngleShape({ className, w }) {
  const size = 48 + w * 28;
  return (
    <svg viewBox="0 0 80 80" className={className} style={{ width: size, height: size }}>
      <path d="M4,4 L40,40 L4,76" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ditherCells(seed) {
  const size = 6;
  const cx = 2.5 + (hash(seed * 3.1 + 9) - 0.5) * 1.4;
  const cy = 2.5 + (hash(seed * 3.1 + 11) - 0.5) * 1.4;
  const radius = 2 + hash(seed * 3.1 + 13) * 1.2;
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const d = Math.hypot(c - cx, r - cy) / radius;
      if (d > 1) continue;
      if (1 - d >= BAYER_4X4[r % 4][c % 4]) cells.push({ x: c, y: r });
    }
  }
  return cells;
}

function DitherShape({ className, w, seed }) {
  const cellPx = 4 + w * 2;
  const cells = ditherCells(seed);
  return (
    <div className={`relative ${className}`} style={{ width: 6 * cellPx, height: 6 * cellPx }}>
      {cells.map((cell, i) => (
        <div key={i} className="absolute bg-current" style={{ left: cell.x * cellPx, top: cell.y * cellPx, width: cellPx, height: cellPx }} />
      ))}
    </div>
  );
}

const RENDERERS = { line: LineShape, ring: RingShape, steam: SteamShape, angle: AngleShape, dither: DitherShape };

export function BackgroundShapes({ active, tone }) {
  const reduceMotion = usePrefersReducedMotion();
  const colorClass = tone === "ink" ? "text-paper" : "text-ink";

  return (
    <div className="pointer-events-none fixed inset-0 z-10 hidden lg:block" aria-hidden="true">
      {TYPES.map((type, i) => {
        const { x, y, rotate, scale } = targetFor(active, i);
        const { w, opacity } = weightFor(i);
        const Render = RENDERERS[type];
        return (
          <motion.div
            key={i}
            className="absolute left-0 top-0"
            animate={reduceMotion ? { x, y, opacity } : { x, y, rotate, scale, opacity }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Render className={colorClass} w={w} seed={i} />
          </motion.div>
        );
      })}
    </div>
  );
}
