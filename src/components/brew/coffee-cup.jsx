import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useDragControls, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CUP_VB, geomOf, levelY, liquidPaths, lowLip } from "@/lib/cup-geometry";
import { CUPS } from "@/lib/cups";
import { pourStep } from "@/lib/pour-physics";
import { G, Spill } from "@/lib/spill";
import { Brewer } from "@/components/brew/brewer";
import { CupArt, LatteHeart } from "@/components/brew/cup-art";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DROP_COUNT = 40;
const STAIN_COUNT = 14;
const SLOSH_W = 13; // rad/s, natural frequency of the surface wobble
const SLOSH_Z = 0.2; // damping ratio
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
  return { x: W - size - Math.max(12, W * 0.015), y: H - size - (W >= 1024 ? 72 : 76) };
}

// The one cup. It lives in a fixed layer so it follows you down the page: drag it around,
// tip it (wheel, rim handle, arrow keys, or the tip button), pour it out, and a moka pot
// swoops in with a fresh cup and fills it again. Double-click, C, or the swap button changes cups.
export function CoffeeToys({ dark = false }) {
  const reduce = usePrefersReducedMotion();
  const [size, setSize] = useState(() => cupSizeFor(window.innerWidth));
  const h = size;
  const k = size / CUP_VB.w;

  const layerRef = useRef(null);
  const boxRef = useRef(null);
  const counterRef = useRef(null);
  const wakeRef = useRef(() => {});
  const spillRef = useRef(null);
  const phase = useRef("idle");
  const tipAnim = useRef(null);
  const swapping = useRef(false);
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const sizeRef = useRef({ size, h, k });
  sizeRef.current = { size, h, k };
  const dragControls = useDragControls();

  const [cupIdx, setCupIdx] = useState(0);
  const cupIdxRef = useRef(0);
  const def = CUPS[cupIdx];
  const defRef = useRef(def);
  defRef.current = def;
  const geomRef = useRef(geomOf(CUPS[0].id));
  const cupVer = useMotionValue(0);
  const slosh = useMotionValue(0);

  const popS = useMotionValue(1);
  const popY = useMotionValue(0);
  const popR = useMotionValue(0);
  const popO = useMotionValue(1);

  const start = useMemo(() => startPose(size), []); // eslint-disable-line react-hooks/exhaustive-deps
  const x = useMotionValue(start.x);
  const y = useMotionValue(start.y);
  const angle = useMotionValue(0);
  const swayTarget = useMotionValue(0);
  const sway = useSpring(swayTarget, { stiffness: 130, damping: 7, mass: 0.7 });
  const rotation = useTransform([angle, sway], ([a, s]) => a + s);
  const level = useMotionValue(1);
  const fillD = useTransform([level, rotation, slosh, cupVer], ([l, r, s]) => liquidPaths(geomRef.current, l, r + s).fill);
  const surfD = useTransform([level, rotation, slosh, cupVer], ([l, r, s]) => liquidPaths(geomRef.current, l, r + s).surface);
  const steamOpacity = useTransform([level, rotation], ([l, r]) => (l < 0.04 ? 0 : 1 - clamp((Math.abs(r) - 18) / 24, 0, 1)));
  const heartY = useTransform([level, cupVer], ([l]) => levelY(geomRef.current, l) + 1.2);
  const heartOp = useTransform([level, rotation, cupVer], ([l, r]) => (geomRef.current.def.heart && l > 0.25 && Math.abs(r) < 6 ? 0.95 : 0));
  const [empty, setEmpty] = useState(false);
  const [tipped, setTipped] = useState(false);
  const [bounds, setBounds] = useState(() => ({ left: 0, top: 0, right: window.innerWidth - size, bottom: window.innerHeight - h - 44 }));

  // Keep the cup on screen when the window changes.
  useEffect(() => {
    const onResize = () => {
      const s = cupSizeFor(window.innerWidth);
      setSize(s);
      setBounds({ left: 0, top: 0, right: window.innerWidth - s, bottom: window.innerHeight - s - 44 });
      x.set(clamp(x.get(), 0, Math.max(0, window.innerWidth - s)));
      y.set(clamp(y.get(), 0, Math.max(0, window.innerHeight - s - 44)));
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

  // Cup swap: the old cup pops out, the next one pops in. Level carries over.
  const swapTo = useCallback(
    async (idx) => {
      if (swapping.current) return;
      swapping.current = true;
      tipAnim.current?.stop();
      const commit = () => {
        angle.set(0);
        cupIdxRef.current = idx;
        geomRef.current = geomOf(CUPS[idx].id);
        setCupIdx(idx);
        cupVer.set(cupVer.get() + 1);
        wakeRef.current();
      };
      if (reduceRef.current) {
        commit();
      } else {
        const dirn = Math.random() < 0.5 ? -1 : 1;
        await Promise.all([
          animate(popS, 0.5, { duration: 0.15, ease: "easeIn" }),
          animate(popY, 30, { duration: 0.15, ease: "easeIn" }),
          animate(popR, dirn * 16, { duration: 0.15, ease: "easeIn" }),
          animate(popO, 0, { duration: 0.15, ease: "easeIn" }),
        ]);
        commit();
        popO.set(0);
        await Promise.all([
          animate(popS, [0.55, 1.1, 1], { duration: 0.4, times: [0, 0.6, 1], ease: "easeOut" }),
          animate(popY, [-34, 4, 0], { duration: 0.4, times: [0, 0.6, 1], ease: "easeOut" }),
          animate(popR, [-dirn * 10, dirn * 3, 0], { duration: 0.4, times: [0, 0.6, 1], ease: "easeOut" }),
          animate(popO, 1, { duration: 0.12 }),
        ]);
      }
      swapping.current = false;
    },
    [angle, cupVer, popO, popR, popS, popY]
  );

  const swapNext = useCallback(() => swapTo((cupIdxRef.current + 1) % CUPS.length), [swapTo]);
  const trySwap = useCallback(() => {
    if (phase.current === "idle") swapNext();
  }, [swapNext]);

  // Physics and particles: one rAF loop that sleeps whenever nothing is pouring, sloshing or flying.
  useEffect(() => {
    const layer = layerRef.current;
    const spill = new Spill(layer);
    spillRef.current = spill;
    let raf = 0;
    let running = false;
    let last = 0;
    let lastPhi = rotation.get();
    let sl = 0;
    let sv = 0;
    let flowStr = "0";

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = geomRef.current;
      const phi = rotation.get();
      const lv = level.get();
      const { k: kk } = sizeRef.current;

      // Surface slosh: a damped spring, kicked by how fast the cup is turning.
      if (!reduceRef.current && lv > 0.003) {
        sv += clamp(phi - lastPhi, -14, 14) * 5;
        const n = Math.max(1, Math.ceil(dt * 120));
        const hs = dt / n;
        for (let i = 0; i < n; i++) {
          sv += (-SLOSH_W * SLOSH_W * sl - 2 * SLOSH_Z * SLOSH_W * sv) * hs;
          sl += sv * hs;
        }
        sl = clamp(sl, -16, 16);
        if (Math.abs(sl) < 0.03 && Math.abs(sv) < 0.08) {
          sl = 0;
          sv = 0;
        }
      } else {
        sl = 0;
        sv = 0;
      }
      lastPhi = phi;
      if (slosh.get() !== sl) slosh.set(sl);

      let pouring = false;
      let flow = 0;
      if (phase.current !== "refill" && lv > 0) {
        const st = pourStep(g, lv, phi + sl, dt);
        if (st.level !== lv) level.set(st.level);
        if (st.flow > 0) {
          pouring = true;
          flow = st.flow;
          if (!reduceRef.current) {
            const { point, dir } = lowLip(g, phi, x.get(), y.get(), kk);
            const speed = Math.max(28, Math.sqrt(2 * G * Math.min(st.head, g.headMax) * kk));
            const H = window.innerHeight;
            const x0 = point[0] + dir[0] * 2;
            const y0 = point[1] + dir[1] * 2;
            const w = Math.min(clamp(0.28 * Math.sqrt(st.flow) * (0.55 + 0.45 * Math.min(1, kk * 1.4)), 1.1, 12), g.lipW * kk * 0.9);
            spill.setStream({
              x0,
              y0,
              vx: dir[0] * speed,
              vy: dir[1] * speed,
              w,
              rate: 2 + 0.012 * st.flow,
              landY: Math.max(y0 + 10, Math.min(H - 4, y0 + H * 0.6)),
            });
          }
        }
        const fs = ((flow / g.volA) * 100).toFixed(1);
        if (fs !== flowStr) {
          flowStr = fs;
          boxRef.current.dataset.flow = fs;
        }
      } else if (flowStr !== "0") {
        flowStr = "0";
        boxRef.current.dataset.flow = "0";
      }
      if (!pouring) spill.setStream(null);
      const busy = spill.update(dt);
      if (pouring || busy || sl !== 0 || sv !== 0) raf = requestAnimationFrame(tick);
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
      box.dataset.levelExact = (v * 100).toFixed(2);
      box.setAttribute("aria-label", labelFor(defRef.current, pct));
      setEmpty(v <= 0.002);
    });
    const offAngle = angle.on("change", (v) => {
      box.dataset.angle = v.toFixed(1);
    });
    box.dataset.level = "100";
    box.dataset.levelExact = "100.00";
    box.dataset.angle = "0.0";
    box.dataset.flow = "0";

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      offRot();
      offLevel();
      offAngle();
      spill.clear();
    };
  }, [rotation, level, angle, x, y, slosh]);

  // Keep the label and the cup id on the element in step with the current cup.
  useEffect(() => {
    const box = boxRef.current;
    box.dataset.cup = def.id;
    box.setAttribute("aria-label", labelFor(def, Math.round(level.get() * 100)));
  }, [def, level]);

  // The drink's layers stay level with the world while the cup turns: counter-rotate the gradient.
  useEffect(() => {
    const apply = (r) => {
      const [ox, oy] = geomRef.current.origin;
      counterRef.current?.setAttribute("transform", `rotate(${(-r).toFixed(2)} ${ox} ${oy})`);
    };
    apply(rotation.get());
    const off = rotation.on("change", apply);
    const off2 = cupVer.on("change", () => apply(rotation.get()));
    return () => {
      off();
      off2();
    };
  }, [rotation, cupVer]);

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
    else if (e.key === "c" || e.key === "C") trySwap();
    else used = false;
    if (used) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const toggleTip = () => {
    if (Math.abs(angle.get()) > 30) upright();
    else {
      const d = defRef.current;
      const cx = x.get() + sizeRef.current.size / 2;
      const sign = d.pourSign ?? (cx > window.innerWidth / 2 ? -1 : 1);
      tipTo(sign * (d.tipAngle ?? 105));
    }
  };

  // Rim handle: drag around the cup's centre to rotate it.
  const handle = useRef(null);
  const onHandleDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = boxRef.current.getBoundingClientRect();
    const [ox, oy] = geomRef.current.origin;
    const cx = r.left + r.width * (ox / CUP_VB.w);
    const cy = r.top + r.height * (oy / CUP_VB.h);
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
      const { point } = lowLip(geomRef.current, rotation.get(), x.get(), y.get(), kk);
      const nx = info.velocity.x / speed;
      const ny = info.velocity.y / speed;
      spillRef.current?.burst(point[0], point[1], nx * 0.6, ny * 0.6, 3 + Math.round(Math.min(4, speed / 1200)));
      level.set(Math.max(0, level.get() - 0.05));
    }
  };

  const colorClass = dark ? "text-milk" : "text-espresso";
  const [ox, oy] = def.origin;
  const dr = def.drink;

  const cup = useMemo(
    () => ({ x, y, size, level, angle, phase, upright, defRef, geomRef, swapNext, wake: () => wakeRef.current() }),
    [x, y, size, level, angle, upright, swapNext]
  );

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
          aria-label={labelFor(def, 100)}
          data-level="100"
          data-cup={def.id}
          data-testid="coffee-cup"
          onKeyDown={onKeyDown}
          className={`relative h-full w-full rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-dashed ${colorClass} transition-colors duration-500`}
          style={{ outlineColor: "#C8955B" }}
        >
          <motion.div className="h-full w-full" style={{ scale: popS, y: popY, rotate: popR, opacity: popO, originX: 0.5, originY: 0.9 }}>
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
              <g transform={`translate(${def.steam[0] - 82} ${def.steam[1] - 84})`}>
                {WISPS.map((w, i) => (
                  <path key={i} d={w.d} className="wisp" style={{ animationDelay: w.delay }} opacity="0.85" />
                ))}
              </g>
            </motion.svg>

            <div className={empty && !tipped ? "cup-wobble h-full w-full" : "h-full w-full"}>
              <motion.svg
                aria-hidden="true"
                viewBox={`0 0 ${CUP_VB.w} ${CUP_VB.h}`}
                className="pointer-events-none h-full w-full overflow-visible"
                style={{ rotate: rotation, originX: ox / CUP_VB.w, originY: oy / CUP_VB.h }}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <defs>
                  <clipPath id="cup-liquid-clip">
                    <motion.path d={fillD} />
                  </clipPath>
                  <linearGradient id={`cup-drink-${def.id}`} gradientUnits="userSpaceOnUse" x1="0" y1={dr.y0} x2="0" y2={dr.y1}>
                    {dr.stops.map(([o, c]) => (
                      <stop key={o} offset={o} stopColor={c} />
                    ))}
                  </linearGradient>
                </defs>
                <g clipPath="url(#cup-liquid-clip)" stroke="none">
                  <g ref={counterRef}>
                    <rect x="-120" y="-120" width="420" height="420" fill={`url(#cup-drink-${def.id})`} />
                  </g>
                </g>
                <g clipPath="url(#cup-liquid-clip)">
                  <motion.path d={surfD} stroke={dr.surface} strokeWidth={dr.crema * 2} />
                </g>
                <motion.path d={surfD} stroke={dr.cremaHi} strokeWidth="1.5" opacity="0.8" />
                <motion.g style={{ y: heartY, opacity: heartOp }}>
                  <g transform="translate(85 0)">
                    <LatteHeart />
                  </g>
                </motion.g>

                <CupArt id={def.id} />

                <path
                  d={def.hit}
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
                  onDoubleClick={trySwap}
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
                  <circle cx={def.knob[0]} cy={def.knob[1]} r="11" fill="var(--handle-fill, rgb(200 149 91 / 0.25))" stroke="#C8955B" strokeWidth="2" />
                  <path d={`M${def.knob[0] - 5} ${def.knob[1]} A5 5 0 1 1 ${def.knob[0]} ${def.knob[1] + 5}`} stroke="#C8955B" strokeWidth="1.8" />
                  <path d={`M${def.knob[0] - 5} ${def.knob[1] - 4} L${def.knob[0] - 5} ${def.knob[1] + 0.5} L${def.knob[0] - 0.5} ${def.knob[1]}`} stroke="#C8955B" strokeWidth="1.8" />
                </g>
              </motion.svg>
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute right-0 top-full mt-1 flex gap-1.5 lg:left-1/2 lg:right-auto lg:-translate-x-1/2">
          {[
            { key: "tip", label: tipped ? "Set the cup upright" : "Tip the cup", text: tipped ? "upright" : "tip", onClick: toggleTip },
            { key: "swap", label: "Swap cup", text: "swap cup", onClick: trySwap },
          ].map((b) => (
            <button
              key={b.key}
              type="button"
              aria-label={b.label}
              data-testid={`cup-${b.key}`}
              onClick={b.onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
              className={`pointer-events-auto inline-flex min-h-9 items-center whitespace-nowrap border border-current px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] opacity-80 transition-opacity duration-150 focus-visible:opacity-100 lg:min-h-7 lg:opacity-0 lg:group-hover:opacity-80 ${colorClass}`}
            >
              {b.text}
            </button>
          ))}
        </div>
      </motion.div>

      <svg data-stream className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150" aria-hidden="true">
        <path data-stream-outer fill="#2A1A12" />
        <path data-stream-inner fill="#B07A4C" />
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

function labelFor(def, pct) {
  return `${def.name}, ${pct}% full. Press T to tip, arrow keys rotate while focused, R to set it upright, C or double-click to swap cups`;
}
