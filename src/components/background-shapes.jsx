import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { world } from "@/lib/world";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { BAYER_4X4 } from "@/lib/dither-pattern";
import { useToyGestures, DRAG_FEEL } from "@/hooks/use-toy-gestures";

const SECTION_ORDER = ["home", "work", "what-i-do", "projects", "publication", "education", "skills", "about", "contact"];
const TYPES = ["line", "ring", "steam", "angle", "dither", "line", "ring", "steam", "angle", "dither", "line", "ring"];

function hash(seed) {
  const x = Math.sin(seed) * 43758.5453123;
  return x - Math.floor(x);
}

function targetFor(sectionId, shapeIndex) {
  const s = Math.max(SECTION_ORDER.indexOf(sectionId), 0);
  const base = shapeIndex * 91.7 + s * 233.1;
  const x = hash(base + 1) * 88 + 4;
  const y = hash(base + 2) * 86 + 5;
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

export function SteamShape({ className, w }) {
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
    <svg viewBox="0 0 44 80" className={className} style={{ width: size * 0.55, height: size }}>
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

// Box size and capsule collider (half segment + radius, before the section's scale) of every shape.
function dimsOf(type, w) {
  switch (type) {
    case "line": {
      const len = 56 + w * 96;
      return { w: len, h: w > 0.5 ? 1.5 : 1, hx: len / 2 - 4, hy: 0, r: 4 };
    }
    case "ring": {
      const o = 42 + w * 34;
      return { w: o, h: o, hx: 0, hy: 0, r: o / 2 };
    }
    case "steam": {
      const size = 52 + w * 24;
      const wd = size * 0.62;
      return { w: wd, h: size, hx: 0, hy: size / 2 - wd * 0.4, r: wd * 0.4 };
    }
    case "angle": {
      const size = 48 + w * 28;
      return { w: size * 0.55, h: size, hx: 0, hy: size * 0.16, r: size * 0.2 };
    }
    default: {
      const cell = 4 + w * 2;
      return { w: cell * 6, h: cell * 6, hx: 0, hy: 0, r: cell * 2.7 };
    }
  }
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const RAD = Math.PI / 180;

function Shape({ index, type, active, dark, reduceMotion }) {
  const { x, y, rotate, scale } = targetFor(active, index);
  const { w, opacity: baseOpacity } = weightFor(index);
  const opacity = dark ? baseOpacity : baseOpacity * 0.55;
  const Render = RENDERERS[type];
  const g = useToyGestures(reduceMotion);
  const dims = dimsOf(type, w);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const squash = useMotionValue(1);
  const bodyRef = useRef(null);
  const prev = useRef(null);
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;

  // The shape is a body in the shared physics world: the section only moves its goal.
  useEffect(() => {
    const t = targetFor(active, index);
    const center = (tt) => [(tt.x / 100) * window.innerWidth + dims.w / 2, (tt.y / 100) * window.innerHeight + dims.h / 2];
    const [cx, cy] = center(t);
    const r0 = dims.r * t.scale;
    const b = {
      kind: "shape",
      x: cx,
      y: cy,
      hx: dims.hx * t.scale,
      hy: dims.hy * t.scale,
      hxT: dims.hx * t.scale,
      hyT: dims.hy * t.scale,
      r: r0,
      rT: r0,
      ang: t.rotate * RAD,
      angT: t.rotate * RAD,
      mass: clamp(0.1 + (r0 * r0) / 12000, 0.08, 0.6),
      damp: 2.2,
      bounds: () => {
        const c = Math.cos(b.angT);
        const s = Math.sin(b.angT);
        const ex = Math.abs(b.hxT * c) + Math.abs(b.hyT * s) + b.rT;
        const ey = Math.abs(b.hxT * s) + Math.abs(b.hyT * c) + b.rT;
        const W = window.innerWidth;
        const H = window.innerHeight;
        return { l: Math.min(8 + ex, W / 2), r: Math.max(W - 8 - ex, W / 2), t: Math.min(8 + ey, H / 2), b: Math.max(H - 8 - ey, H / 2) };
      },
      sync: () => {
        px.set(b.x - dims.w / 2);
        py.set(b.y - dims.h / 2);
      },
      hit: ({ speed }) => {
        if (reduceRef.current) return;
        squash.set(1 - 0.06 * clamp(speed / 1500, 0.15, 1));
        animate(squash, 1, { type: "spring", stiffness: 330, damping: 7 });
      },
    };
    bodyRef.current = b;
    prev.current = { t, ox: 0, oy: 0 };
    b.sync();
    const remove = world.add(b);
    return remove;
    // The body is created once per shape; section changes steer it through its goal below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New section: keep the visitor's offset, aim at the new target, and let physics get it there.
  useEffect(() => {
    const b = bodyRef.current;
    const p = prev.current;
    if (!b || !p) return;
    const center = (tt) => [(tt.x / 100) * window.innerWidth + dims.w / 2, (tt.y / 100) * window.innerHeight + dims.h / 2];
    const t = { x, y, rotate, scale };
    const [pcx, pcy] = center(p.t);
    const offx = b.x - pcx;
    const offy = b.y - pcy;
    const [ncx, ncy] = center(t);
    p.t = t;
    b.hxT = dims.hx * scale;
    b.hyT = dims.hy * scale;
    b.rT = dims.r * scale;
    b.angT = rotate * RAD;
    b.mass = clamp(0.1 + (b.rT * b.rT) / 12000, 0.08, 0.6);
    b.invMass = 1 / b.mass;
    const B = b.bounds();
    b.goal = { x: clamp(ncx + offx, B.l, B.r), y: clamp(ncy + offy, B.t, B.b) };
    if (reduceRef.current) {
      b.r = b.rT;
      b.hx = b.hxT;
      b.hy = b.hyT;
      b.ang = b.angT;
    }
    world.wake();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, x, y, rotate, scale]);

  useEffect(() => {
    const onResize = () => {
      const b = bodyRef.current;
      if (!b) return;
      const B = b.bounds();
      b.x = clamp(b.x, B.l, B.r);
      b.y = clamp(b.y, B.t, B.b);
      b.sync();
      world.needsRelax = true;
      world.wake();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <motion.div className="absolute left-0 top-0" style={{ x: px, y: py }}>
      <motion.div
        className="absolute left-0 top-0"
        animate={reduceMotion ? { opacity } : { rotate, scale, opacity }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div style={{ scale: squash }}>
          <motion.div
            className="toy pointer-events-auto relative"
            whileHover={{ scale: 1.18 }}
            whileDrag={{ scale: 1.25 }}
            onPointerDown={(e) => {
              g.onPointerDown(e);
              if (e.button > 0 || !bodyRef.current) return;
              world.startDrag(bodyRef.current, e);
            }}
            onClick={g.onClick}
            style={{ rotate: g.rot, scaleX: g.flip, touchAction: "none" }}
          >
            {type === "line" && <span className="absolute -inset-y-2.5 inset-x-0" />}
            <Render className={dark ? "text-milk" : "text-espresso"} w={w} seed={index} />
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function useWide() {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return wide;
}

export function BackgroundShapes({ active, dark = false }) {
  const reduceMotion = usePrefersReducedMotion();
  const wide = useWide();
  useEffect(() => {
    world.reduce = reduceMotion;
  }, [reduceMotion]);
  if (!wide) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[25]" aria-hidden="true">
      {TYPES.map((type, i) => (
        <Shape key={i} index={i} type={type} active={active} dark={dark} reduceMotion={reduceMotion} />
      ))}
    </div>
  );
}
