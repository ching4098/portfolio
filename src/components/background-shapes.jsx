import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const SECTION_ORDER = ["home", "work", "what-i-do", "projects", "publication", "education", "skills", "about", "contact"];
const SHAPES = ["line", "circle", "curve", "line", "circle", "curve", "line", "circle", "curve", "line"];

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

function LineShape({ className }) {
  return <div className={`h-0.5 w-36 bg-current ${className}`} />;
}

function CurveShape({ className }) {
  return (
    <svg viewBox="0 0 100 50" className={`h-12 w-32 ${className}`}>
      <path d="M2,4 Q50,46 98,12" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function CircleShape({ className }) {
  return <div className={`h-14 w-14 rounded-full border-[1.5px] border-current ${className}`} />;
}

const RENDERERS = { line: LineShape, curve: CurveShape, circle: CircleShape };

export function BackgroundShapes({ active, tone }) {
  const reduceMotion = usePrefersReducedMotion();
  const colorClass = tone === "ink" ? "text-paper/35" : "text-ink/30";

  return (
    <div className="pointer-events-none fixed inset-0 z-10 hidden lg:block" aria-hidden="true">
      {SHAPES.map((type, i) => {
        const { x, y, rotate, scale } = targetFor(active, i);
        const Render = RENDERERS[type];
        return (
          <motion.div
            key={i}
            className="absolute left-0 top-0"
            animate={reduceMotion ? { x, y } : { x, y, rotate, scale }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Render className={colorClass} />
          </motion.div>
        );
      })}
    </div>
  );
}
