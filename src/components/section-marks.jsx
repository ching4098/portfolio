import { motion, useMotionValue, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

export function VerticalLabel({ children, className = "", progress }) {
  const reduceMotion = usePrefersReducedMotion();
  const fallback = useMotionValue(0);
  const source = progress ?? fallback;
  const active = Boolean(progress) && !reduceMotion;
  const y = useTransform(source, (p) => (active ? p * -16 : 0));
  const opacity = useTransform(source, active ? [0, 0.15, 0.85, 1] : [0, 1], active ? [0, 1, 1, 0] : [1, 1]);
  return (
    <motion.span
      aria-hidden
      style={{ y, opacity, rotate: 180, writingMode: "vertical-rl" }}
      className={`pointer-events-none absolute font-display text-[11px] uppercase tracking-[0.25em] ${className}`}
    >
      {children}
    </motion.span>
  );
}
