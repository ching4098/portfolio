import { motion } from "framer-motion";
import { ditherPattern } from "@/lib/dither-pattern";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const { cols, rows, cells, revealRank } = ditherPattern;
const EASE = [0.16, 1, 0.3, 1];

export function DitherMark({ variant = "intro", className = "", animate: shouldAnimate = true }) {
  const reduceMotion = usePrefersReducedMotion();
  const resolved = !shouldAnimate || reduceMotion;
  const label = variant === "contact" ? "Pixelated coffee cup, signing off" : "Pixelated coffee cup";

  return (
    <svg viewBox={`0 0 ${cols} ${rows}`} className={className} role="img" aria-label={label}>
      {cells.map((cell, i) => (
        <motion.rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={1}
          height={1}
          className="fill-current"
          initial={resolved ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: resolved ? 0 : (revealRank[i] / cells.length) * 1.1,
            ease: EASE,
          }}
          style={{ transformOrigin: `${cell.x + 0.5}px ${cell.y + 0.5}px` }}
        />
      ))}
    </svg>
  );
}
