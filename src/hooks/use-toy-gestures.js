import { useRef } from "react";
import { animate, useMotionValue } from "framer-motion";

// Click-to-spin for anything draggable. A click spins a quarter turn with a springy
// overshoot; a second click inside 380ms flips it. A click that ends a drag does nothing.
export function useToyGestures(reduceMotion = false) {
  const rot = useMotionValue(0);
  const flip = useMotionValue(1);
  const turns = useRef(0);
  const flipped = useRef(false);
  const lastTap = useRef(0);
  const down = useRef({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onClick = (e) => {
    if (Math.hypot(e.clientX - down.current.x, e.clientY - down.current.y) > 4) return;
    const now = performance.now();
    const double = now - lastTap.current < 380;
    lastTap.current = now;
    if (double) {
      flipped.current = !flipped.current;
      const to = flipped.current ? -1 : 1;
      if (reduceMotion) flip.set(to);
      else animate(flip, to, { type: "spring", stiffness: 230, damping: 13 });
    } else {
      turns.current += 90;
      if (reduceMotion) rot.set(turns.current);
      else animate(rot, turns.current, { type: "spring", stiffness: 260, damping: 8 });
    }
  };
  return { rot, flip, onPointerDown, onClick };
}

export const DRAG_FEEL = { power: 0.28, timeConstant: 280, bounceStiffness: 260, bounceDamping: 16 };

export function hasFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;
}
