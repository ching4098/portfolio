import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useDragControls, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CUP_VB, capacityAt, liquidPaths, lowLip } from "@/lib/cup-geometry";
import { Spill } from "@/lib/spill";
import { Brewer } from "@/components/brew/brewer";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const LIQUID = "#5A3622";
const CREMA = "#C8955B";
const DROP_COUNT = 30;
const STAIN_COUNT = 14;
const WISPS = [
  { d: "M52 66 C44 54 62 46 54 34 C50 28 56 24 54 18", delay: "0s" },
  { d: "M80 70 C72 56 90 48 82 34 C78 28 84 22 80 14", delay: "1.05s" },
  { d: "M108 66 C101 56 116 48 110 38 C107 33 111 30 110 24", delay: "2.1s" },
];

function cupSizeFor(w) {
  return w >= 1024 ? 176 : w >= 640 ? 128 : 88;
}

function startPose(size) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const h = (size * CUP_VB.h) / CUP_VB.w;
  return { x: W - size - Math.max(12, W * 0.015), y: H - h - (W >= 1024 ? 72 : 76) };
}

// The one cup. It lives in a fixed layer so it follows you down the page: drag it around,
// tip it (wheel, rim handle, arrow keys, or the tip button), pour it out, and a moka pot
// swoops in to fill it again.
export function CoffeeToys({ dark = false }) {
  const reduce = usePrefersReducedMotion();
  const [size, setSize] = useState(() => cupSizeFor(window.innerWidth));
  const h = (size * CUP_VB.h) / CUP_VB.w;
  const k = size / CUP_VB.w;

  const layerRef = useRef(null);
  const boxRef = useRef(null);
  const wakeRef = useRef(() => {});
  const spillRef = useRef(null);
  const phase = useRef("idle");
  const tipAnim = useRef(null);
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const sizeRef = useRef({ size, h, k });
  sizeRef.current = { size, h, k };
  const dragControls = useDragControls();

  const start = useMemo(() => startPose(size), []); // eslint-disable-line react-hooks/exhaustive-deps
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const angle = useMotionValue(0);
  const swayTarget = useMotionValue(0);
  const sway = useSpring(swayTarget, { stiffness: 130, damping: 7, mass: 0.7 });
  const rotation = useTransform([angle, sway], ([a, s]) => a + s);
  const level = useMotionValue(1);
  const fillD = useTransform([level, rotation], ([l, r]) => liquidPaths(l, r).fill);
  const surfD = useTransform([level, rotation], ([l, r]) => liquidPaths(l, r).surface);
  const steamOpacity = useTransform([level, rotation], ([l, r]) => (l < 0.04 ? 0 : 1 - clamp((Math.abs(r) - 18) / 24, 0, 1)));
  const [empty, setEmpty] = useState(false);
  const [tipped, setTipped] = useState(false);
  const [bounds, setBounds] = useState(() => ({ left: 0, top: 0, right: window.innerWidth - size, bottom: window.innerHeight - h - 44 }));

  // Keep the cup on screen when the window changes.
  useEffect(() => {
    const onResize = () => {
      const s = cupSizeFor(window.innerWidth);
      const hh = (s * CUP_VB.h) / CUP_VB.w;
      setSize(s);
      setBounds({ left: 0, top: 0, right: window.innerWidth - s, bottom: window.innerHeight - hh - 44 });
      x.set(clamp(x.get(), 0, Math.max(0, window.innerWidth - s)));
      y.set(clamp(y.get(), 0, Math.max(0, window.innerHeight - hh - 44)));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [x, y]);

  const setUserAngle = useCallback(
    (v) => {
      tipAnim.current?.stop();
      angle.set(clamp(v, -170, 170));
    },
    [angle]
  );

  const tipTo = useCallback(
    (deg) => {
      tipAnim.current?.stop();
      tipAnim.current = animate(angle, deg, { type: "spring", stiffness: 85, damping: 11 });
      return tipAnim.current;
    },
    [angle]
  );

  const upright = useCallback(() => {
    tipAnim.current?.stop();
    tipAnim.current = animate(angle, 0, { type: "spring", stiffness: 140, damping: 15 });
    return tipAnim.current;
  }, [angle]);

  // Physics and particles: one rAF loop that sleeps whenever nothing is pouring or flying.
  useEffect(() => {
    const layer = layerRef.current;
    const spill = new Spill(layer);
    spillRef.current = spill;
    let raf = 0;
    let running = false;
    let last = 0;

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const phi = rotation.get();
      const a = Math.abs(phi);
      const lv = level.get();
      const { k: kk } = sizeRef.current;
      let pouring = false;
      if (phase.current !== "refill" && lv > 0 && a >= 55) {
        const floor = a >= 85 ? 0 : capacityAt(phi);
        if (lv > floor + 0.002) {
          const excess = clamp((a - 50) / 45, 0.25, 1);
          level.set(Math.max(floor, lv - 0.286 * excess * dt));
          pouring = true;
          if (!reduceRef.current) {
            const { point, dir } = lowLip(phi, x.get(), y.get(), kk);
            const speed = 70 + 190 * excess;
            const H = window.innerHeight;
            const x0 = point[0] + dir[0] * 3;
            const y0 = point[1] + dir[1] * 3;
            spill.setStream({
              x0,
              y0,
              vx: dir[0] * speed,
              vy: dir[1] * speed,
              w: (2.4 + 3.2 * excess) * (0.55 + 0.45 * Math.min(1, kk * 1.4)) * (0.5 + 0.5 * Math.min(1, lv * 2)),
              landY: Math.max(y0 + 10, Math.min(H - 4, y0 + H * 0.6)),
            });
          }
        }
      }
      if (!pouring) spill.setStream(null);
      const busy = spill.update(dt);
      if (pouring || busy) raf = requestAnimationFrame(tick);
      else running = false;
    };
    const wake = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;
    spill.wake = wake;
    const offRot = rotation.on("change", wake);

    const box = boxRef.current;
    const offLevel = level.on("change", (v) => {
      const pct = Math.round(v * 100);
      box.dataset.level = String(pct);
      box.setAttribute(
        "aria-label",
        `Coffee cup, ${pct}% full. Press T to tip, arrow keys rotate while focused, R to set it upright`
      );
      setEmpty(v <= 0.002);
    });
    box.dataset.level = "100";

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      offRot();
      offLevel();
      spill.clear();
    };
  }, [rotation, level, x, y]);

  // Mouse wheel over the cup tips it instead of paging.
  useEffect(() => {
    const box = boxRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setUserAngle(angle.get() + e.deltaY * 0.22);
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, [angle, setUserAngle]);

  useEffect(() => angle.on("change", (v) => setTipped(Math.abs(v) > 30)), [angle]);

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 15 : 6;
    let used = true;
    if (e.key === "ArrowLeft") setUserAngle(angle.get() - step);
    else if (e.key === "ArrowRight") setUserAngle(angle.get() + step);
    else if (e.key === "t" || e.key === "T" || e.key === "Enter" || e.key === " ") toggleTip();
    else if (e.key === "r" || e.key === "R" || e.key === "Escape") upright();
    else used = false;
    if (used) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const toggleTip = () => {
    if (Math.abs(angle.get()) > 30) upright();
    else {
      const cx = x.get() + sizeRef.current.size / 2;
      tipTo(cx > window.innerWidth / 2 ? -105 : 105);
    }
  };

  // Rim handle: drag around the cup's centre to rotate it.
  const handle = useRef(null);
  const onHandleDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = boxRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * (CUP_VB.oy / CUP_VB.h);
    const ang = (ev) => (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI;
    handle.current = { cx, cy, last: ang(e), ang };
    tipAnim.current?.stop();
  };
  const onHandleMove = (e) => {
    const hd = handle.current;
    if (!hd) return;
    const a = hd.ang(e);
    let d = a - hd.last;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    hd.last = a;
    setUserAngle(angle.get() + d);
  };
  const onHandleUp = () => {
    handle.current = null;
  };

  // Drag: sway with the motion, slosh on a hard flick.
  const onDrag = (_, info) => swayTarget.set(clamp(info.velocity.x * 0.011, -16, 16));
  const onDragEnd = (_, info) => {
    swayTarget.set(0);
    const speed = Math.hypot(info.velocity.x, info.velocity.y);
    if (speed > 1600 && level.get() > 0.05 && !reduceRef.current) {
      const { k: kk } = sizeRef.current;
      const { point } = lowLip(rotation.get(), x.get(), y.get(), kk);
      const nx = info.velocity.x / speed;
      const ny = info.velocity.y / speed;
      spillRef.current?.burst(point[0], point[1], nx * 0.6, ny * 0.6, 3 + Math.round(Math.min(4, speed / 1200)));
      level.set(Math.max(0, level.get() - 0.05));
    }
  };

  const colorClass = dark ? "text-milk" : "text-espresso";
  const cupBody = "M30 84 C28 84 118 82 138 84 C140 118 128 138 84 140 C42 138 30 118 30 84 Z";
  const earPath = "M138 94 C164 90 164 122 134 122";

  const cup = useMemo(() => ({ x, y, size, level, angle, phase, upright }), [x, y, size, level, angle, upright]);

  return (
    <div ref={layerRef} className="pointer-events-none fixed inset-0 z-[46] overflow-hidden">
      {Array.from({ length: STAIN_COUNT }, (_, i) => (
        <div key={i} data-stain className="absolute left-0 top-0" aria-hidden="true">
          <span className="absolute inset-0 rounded-[50%] opacity-0" style={{ background: "#7A4A2B" }} />
          <span className="absolute inset-0 rounded-[50%] border-2 opacity-0" style={{ borderColor: "#7A4A2B" }} />
        </div>
      ))}

      <motion.div
        className="group absolute left-0 top-0"
        style={{ x, y, width: size, height: h }}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum
        dragElastic={0.12}
        dragConstraints={bounds}
        dragTransition={{ power: 0.3, timeConstant: 300, bounceStiffness: 240, bounceDamping: 16 }}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
      >
        <div
          ref={boxRef}
          role="button"
          tabIndex={0}
          aria-label="Coffee cup, 100% full. Press T to tip, arrow keys rotate while focused, R to set it upright"
          data-level="100"
          data-testid="coffee-cup"
          onKeyDown={onKeyDown}
          className={`relative h-full w-full rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-dashed ${colorClass} transition-colors duration-500`}
          style={{ outlineColor: "#C8955B" }}
        >
          <motion.svg
            aria-hidden="true"
            viewBox={`0 0 ${CUP_VB.w} ${CUP_VB.h}`}
            className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500"
            style={{ opacity: steamOpacity }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            {WISPS.map((w, i) => (
              <path key={i} d={w.d} className="wisp" style={{ animationDelay: w.delay }} opacity="0.85" />
            ))}
          </motion.svg>

          <div className={empty && !tipped ? "cup-wobble h-full w-full" : "h-full w-full"}>
            <motion.svg
              aria-hidden="true"
              viewBox={`0 0 ${CUP_VB.w} ${CUP_VB.h}`}
              className="pointer-events-none h-full w-full overflow-visible"
              style={{ rotate: rotation, originX: CUP_VB.ox / CUP_VB.w, originY: CUP_VB.oy / CUP_VB.h }}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path d={fillD} fill={LIQUID} stroke="none" />
              <motion.path d={surfD} stroke={CREMA} strokeWidth="3.4" />
              <path d={cupBody} />
              <path d={earPath} />
              <path d="M18 146 C60 152 110 152 156 146" opacity="0.6" />
              <path d="M44 100 C60 96 96 98 124 96" opacity="0.5" strokeWidth="1.6" />
              <path
                d={`${cupBody} ${earPath}`}
                className="toy-hit"
                fill="transparent"
                stroke="transparent"
                strokeWidth="10"
                style={{ pointerEvents: "all", touchAction: "none" }}
                onPointerDown={(e) => {
                  boxRef.current?.focus({ preventScroll: true });
                  tipAnim.current?.stop();
                  dragControls.start(e);
                }}
              />
              <g
                className="toy-hit opacity-0 transition-opacity duration-150 group-hover:opacity-90 group-focus-within:opacity-90 [@media(pointer:coarse)]:opacity-70"
                style={{ pointerEvents: "all", touchAction: "none" }}
                onPointerDown={onHandleDown}
                onPointerMove={onHandleMove}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
                data-testid="cup-handle"
              >
                <circle cx="22" cy="74" r="11" fill="var(--handle-fill, rgb(200 149 91 / 0.25))" stroke="#C8955B" strokeWidth="2" />
                <path d="M17 74 A5 5 0 1 1 22 79" stroke="#C8955B" strokeWidth="1.8" />
                <path d="M17 70 L17 74.5 L21.5 74" stroke="#C8955B" strokeWidth="1.8" />
              </g>
            </motion.svg>
          </div>
        </div>

        <button
          type="button"
          aria-label={tipped ? "Set the cup upright" : "Tip the cup"}
          onClick={toggleTip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
          }}
          className={`pointer-events-auto absolute left-1/2 top-full mt-1 inline-flex min-h-9 -translate-x-1/2 items-center whitespace-nowrap border border-current px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] opacity-80 transition-opacity duration-150 focus-visible:opacity-100 lg:min-h-7 lg:opacity-0 lg:group-hover:opacity-80 ${colorClass}`}
        >
          {tipped ? "upright" : "tip"}
        </button>
      </motion.div>

      <svg data-stream className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150" fill="none" strokeLinecap="round" aria-hidden="true">
        <path data-stream-outer stroke="#2A1A12" />
        <path data-stream-inner stroke="#B07A4C" />
      </svg>
      {Array.from({ length: DROP_COUNT }, (_, i) => (
        <span
          key={i}
          data-drop
          aria-hidden="true"
          className="absolute left-0 top-0 block rounded-full opacity-0"
          style={{ width: 6, height: 8, marginLeft: -3, marginTop: -4, background: "#9A6338", boxShadow: "0 0 0 1px #2A1A12", willChange: "transform" }}
        />
      ))}

      <Brewer cup={cup} spill={spillRef} reduce={reduce} />
    </div>
  );
}
