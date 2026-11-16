import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useToyGestures, DRAG_FEEL, hasFinePointer } from "@/hooks/use-toy-gestures";
import { registerDoodle } from "@/lib/avoid";

// Wraps a decorative mark so it can be dragged (with momentum) and clicked to spin.
// Touch screens keep native scrolling, so there the mark stays inert.
// passThrough: the wrapper ignores the pointer and only children marked .toy-hit catch it.
// Every mark registers with the text-avoidance pass, which can nudge, shrink or hide it so it
// never starts out covering readable text.
export function Toy({ className = "", style, passThrough = false, children }) {
  const reduce = usePrefersReducedMotion();
  const g = useToyGestures(reduce);
  const fine = hasFinePointer();
  const ref = useRef(null);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const fit = useMotionValue(1);
  const st = useRef({ dx: 0, dy: 0, fit: 1 });

  useEffect(() => {
    const api = {
      el: () => ref.current,
      // The visible mark: its scaled wrapper and every rotated descendant, as one box.
      rect: () => {
        const el = ref.current?.firstElementChild;
        if (!el) return null;
        let l = Infinity;
        let t = Infinity;
        let r = -Infinity;
        let b = -Infinity;
        for (const n of [el, ...el.querySelectorAll("*")]) {
          const q = n.getBoundingClientRect();
          if (q.width < 0.5 && q.height < 0.5) continue;
          l = Math.min(l, q.left);
          t = Math.min(t, q.top);
          r = Math.max(r, q.right);
          b = Math.max(b, q.bottom);
        }
        return r < l ? null : { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t };
      },
      state: () => st.current,
      set: (dx, dy, f, instant) => {
        st.current = { dx, dy, fit: f };
        const to = (mv, v) => (reduce || instant ? mv.set(v) : animate(mv, v, { type: "spring", stiffness: 120, damping: 18 }));
        to(nx, dx);
        to(ny, dy);
        to(fit, f);
      },
    };
    return registerDoodle(api);
  }, [reduce, nx, ny, fit]);

  return (
    <motion.div
      ref={ref}
      data-doodle=""
      aria-hidden="true"
      drag={fine}
      dragMomentum
      dragElastic={0.14}
      dragTransition={DRAG_FEEL}
      whileHover={fine ? { scale: 1.05 } : undefined}
      whileDrag={fine ? { scale: 1.1 } : undefined}
      onPointerDown={fine ? g.onPointerDown : undefined}
      onClick={fine ? g.onClick : undefined}
      className={`${passThrough || !fine ? "" : "toy"} ${className}`}
      style={{
        ...style,
        x: nx,
        y: ny,
        rotate: g.rot,
        scaleX: g.flip,
        pointerEvents: passThrough || !fine ? "none" : "auto",
      }}
    >
      <motion.div className="h-full w-full" style={{ scale: fit }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
