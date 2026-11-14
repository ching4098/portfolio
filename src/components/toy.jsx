import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useToyGestures, DRAG_FEEL, hasFinePointer } from "@/hooks/use-toy-gestures";

// Wraps a decorative mark so it can be dragged (with momentum) and clicked to spin.
// Touch screens keep native scrolling, so there the mark stays inert.
// passThrough: the wrapper ignores the pointer and only children marked .toy-hit catch it.
export function Toy({ className = "", style, passThrough = false, children }) {
  const reduce = usePrefersReducedMotion();
  const g = useToyGestures(reduce);
  const fine = hasFinePointer();
  if (!fine) {
    return (
      <div className={className} style={{ ...style, pointerEvents: "none" }} aria-hidden="true">
        {children}
      </div>
    );
  }
  return (
    <motion.div
      aria-hidden="true"
      drag
      dragMomentum
      dragElastic={0.14}
      dragTransition={DRAG_FEEL}
      whileHover={{ scale: 1.05 }}
      whileDrag={{ scale: 1.1 }}
      onPointerDown={g.onPointerDown}
      onClick={g.onClick}
      className={`${passThrough ? "" : "toy"} ${className}`}
      style={{ ...style, rotate: g.rot, scaleX: g.flip, pointerEvents: passThrough ? "none" : "auto" }}
    >
      {children}
    </motion.div>
  );
}
