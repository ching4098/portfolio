import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { CUP_VB, geomOf, levelY, liquidPaths, lowLip, worldPoint } from "@/lib/cup-geometry";
import { CUPS } from "@/lib/cups";
import { pourStep } from "@/lib/pour-physics";
import { G, Spill } from "@/lib/spill";
import { world } from "@/lib/world";
import { settleSoon } from "@/lib/avoid";
import { Brewer } from "@/components/brew/brewer";
import { CupArt, CupLid, LatteHeart } from "@/components/brew/cup-art";

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const DROP_COUNT = 60;
const STAIN_COUNT = 20;
const SLOSH_W = 13; // rad/s, natural frequency of the surface wobble
const SLOSH_Z = 0.2; // damping ratio
const WISPS = [
  { d: "M52 66 C44 54 62 46 54 34 C50 28 56 24 54 18", delay: "0s" },
  { d: "M80 70 C72 56 90 48 82 34 C78 28 84 22 80 14", delay: "1.05s" },
  { d: "M108 66 C101 56 116 48 110 38 C107 33 111 30 110 24", delay: "2.1s" },
];

// sm = phones (< 768px): one cup you swap through the five types. md: three cups. lg: all five.
const tierFor = (w) => (w >= 1024 ? "lg" : w >= 768 ? "md" : "sm");
const MOBILE_RESERVE = 56; // room under a phone cup for its 44px buttons
const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// Where each cup spawns: random every load, hugging the side margins so the text stays clear.
// lg: all five, split over the left and right margins in vertical slots (so none overlap).
// md: three in the corners / edge, sm: one in the bottom-right corner (see planMobileCup).
function planCups(tier) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const n = tier === "lg" ? 5 : tier === "md" ? 3 : 1;
  const base = tier === "lg" ? clamp(W * 0.086, 104, 150) : 128;
  const hs = tier === "lg" ? clamp(H / 850, 0.7, 1) : 1;
  const picks = shuffle(CUPS).slice(0, n);
  const items = picks.map((def) => ({ def, size: Math.round(base * def.scale * hs), angle: rnd(-6, 6) }));
  const out = [];
  const put = (it, left, top) => out.push({ ...it, left: clamp(left, 0, W - it.size), top: clamp(top, 0, H - it.size - 44) });

  if (tier === "lg") {
    const edge = Math.max(0, (W - 1216) / 2);
    const leftN = Math.random() < 0.5 ? 2 : 3;
    const sides = [items.slice(0, leftN), items.slice(leftN)];
    sides.forEach((side, si) => {
      const top = 64;
      const bottom = H - 44;
      let total = side.reduce((a, it) => a + it.size, 0);
      const room = bottom - top - 8 * side.length;
      if (total > room) {
        const f = room / total;
        side.forEach((it) => (it.size = Math.round(it.size * f)));
        total = side.reduce((a, it) => a + it.size, 0);
      }
      const free = Math.max(0, bottom - top - total);
      const w = Array.from({ length: side.length + 1 }, () => rnd(0.25, 1));
      const ws = w.reduce((a, b) => a + b, 0);
      let y = top;
      side.forEach((it, i) => {
        y += (free * w[i]) / ws;
        // Hug the margin: the cup's body (not its empty box) sits left of / right of the text column.
        const kk = it.size / CUP_VB.w;
        const ex = (it.def.col.h[0] + it.def.col.r) * kk;
        const colL = it.def.col.c[0] * kk - ex;
        const colR = it.def.col.c[0] * kk + ex;
        const room = Math.max(2, si === 0 ? Math.min(edge - 2 * ex - 6, edge + colL - it.size) : edge - 2 * ex - 6);
        const gap = rnd(6, Math.max(6, room));
        out.push({ ...it, left: si === 0 ? gap - colL : W - gap - colR, top: clamp(y, 0, H - it.size - 44) });
        y += it.size;
      });
    });
  } else if (tier === "md") {
    const m = Math.max(12, W * 0.015);
    const by = H - 76;
    put(items[0], W - items[0].size - m, by - items[0].size);
    put(items[1], m + rnd(0, 30), by - items[1].size - rnd(0, 50));
    put(items[2], W - items[2].size - m * 0.5, clamp(rnd(0.18, 0.36) * H, 70, by - items[0].size - items[2].size - 16));
  } else {
    return [planMobileCup(picks[0])];
  }
  return out.map((p, slot) => ({ ...p, slot }));
}

// Phones: the single cup. `at` is where the previous cup stood (bottom-centre), so a swap pops in place.
function planMobileCup(def, at, extra = {}) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const size = Math.round(clamp(100 * def.scale, 88, 104));
  let left = W - size - 10;
  let top = H - size - MOBILE_RESERVE - 8;
  if (at) {
    left = at[0] - size / 2;
    top = at[1] - size;
  }
  return {
    def,
    size,
    angle: at ? 0 : rnd(-6, 6),
    left: clamp(left, 0, W - size),
    top: clamp(top, 0, H - size - MOBILE_RESERVE),
    slot: 0,
    ...extra,
  };
}

// The cups live in a fixed layer so they follow you down the page. All five are out at once, each
// with its own drink, physics, refill pot and stains. One shared loop (world.js) drives them all.
export function CoffeeToys({ dark = false }) {
  const [tier, setTier] = useState(() => tierFor(window.innerWidth));
  useEffect(() => {
    const on = () => setTier(tierFor(window.innerWidth));
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return <Toys key={tier} tier={tier} dark={dark} />;
}

function Toys({ tier, dark }) {
  const reduce = usePrefersReducedMotion();
  const layerRef = useRef(null);
  const spillRef = useRef(null);
  const engine = useRef({ z: 10 }).current;
  const mobile = tier === "sm";
  const [mob, setMob] = useState(() => (mobile ? planCups("sm")[0] : null));
  const mobRef = useRef(mob);
  const plan = useMemo(() => (mobile ? [mob] : planCups(tier)), [tier, mobile, mob]);
  const ctl = useRef(null);
  const swapping = useRef(false);

  // Phones: the old cup pops out, the next type pops in (empty when it is a refill, so the pot fills it).
  const swap = useCallback((empty = false) => {
    if (swapping.current || !mobRef.current) return;
    swapping.current = true;
    const cur = mobRef.current;
    const c = ctl.current;
    const at = c?.at();
    (c ? c.out() : Promise.resolve()).then(() => {
      const next = CUPS[(CUPS.findIndex((d) => d.id === cur.def.id) + 1) % CUPS.length];
      const np = planMobileCup(next, at, { pop: true, startEmpty: empty });
      mobRef.current = np;
      swapping.current = false;
      setMob(np);
    });
  }, []);

  useEffect(() => {
    world.reduce = reduce;
  }, [reduce]);

  useEffect(() => {
    const spill = new Spill(layerRef.current);
    spillRef.current = spill;
    const sim = { step: (dt) => spill.update(dt) };
    world.sims.add(sim);
    spill.wake = () => world.wake();
    world.wake();
    return () => {
      world.sims.delete(sim);
      spill.clear();
    };
  }, []);

  return (
    <div ref={layerRef} data-toys className="pointer-events-none fixed inset-0 z-[46] overflow-hidden">
      {Array.from({ length: STAIN_COUNT }, (_, i) => (
        <div key={i} data-stain className="absolute left-0 top-0" aria-hidden="true">
          <span className="absolute inset-0 rounded-[50%] opacity-0" style={{ background: "#7A4A2B" }} />
          <span className="absolute inset-0 rounded-[50%] border-2 opacity-0" style={{ borderColor: "#7A4A2B" }} />
        </div>
      ))}

      {plan.map((p) => (
        <CoffeeCup
          key={p.def.id}
          p={p}
          dark={dark}
          reduce={reduce}
          layerRef={layerRef}
          spillRef={spillRef}
          engine={engine}
          mobile={mobile}
          ctl={ctl}
          onSwap={swap}
        />
      ))}

      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 90 }} aria-hidden="true">
        {plan.map((p) => (
          <g key={p.slot}>
            <g data-stream-slot={p.slot} style={{ opacity: 0, transition: "opacity 150ms" }}>
              <path fill={p.def.pour[0]} />
              <path fill={p.def.pour[1]} />
            </g>
            <g data-brew-slot={p.slot} fill="none" strokeLinecap="round" style={{ opacity: 0, transition: "opacity 150ms" }}>
              <path stroke={p.def.pour[0]} />
              <path stroke={p.def.pour[1]} />
            </g>
          </g>
        ))}
      </svg>
      {Array.from({ length: DROP_COUNT }, (_, i) => (
        <span
          key={i}
          data-drop
          aria-hidden="true"
          className="absolute left-0 top-0 block rounded-full opacity-0"
          style={{ width: 6, height: 8, marginLeft: -3, marginTop: -4, background: "#9A6338", boxShadow: "0 0 0 1px #2A1A12", zIndex: 95 }}
        />
      ))}
    </div>
  );
}

function CoffeeCup({ p, dark, reduce, layerRef, spillRef, engine, mobile = false, ctl, onSwap }) {
  const { def, size, slot } = p;
  const k = size / CUP_VB.w;
  const [ccx, ccy] = def.col.c;
  const uid = useId().replace(/:/g, "");

  const boxRef = useRef(null);
  const counterRef = useRef(null);
  const bodyRef = useRef(null);
  const simRef = useRef({ kick: () => {} });
  const phase = useRef("idle");
  const tipAnim = useRef(null);
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const defRef = useRef(def);
  const geomRef = useRef(geomOf(def.id));
  const lid = useRef({ off: false });
  const cupVer = useMotionValue(0);
  const slosh = useMotionValue(0);
  const popS = useMotionValue(1);
  const lidT = useMotionValue(0);
  const heartT = useMotionValue(1);
  const bump = useMotionValue(0);
  const z = useMotionValue(slot + 1);
  const fitS = useMotionValue(1);
  const swapS = useMotionValue(p.pop ? 0 : 1);
  const swapR = useMotionValue(p.pop ? -16 : 0);
  const lastTap = useRef(null);
  const onSwapRef = useRef(onSwap);
  onSwapRef.current = onSwap;
  const fresh = useRef(!!p.startEmpty);
  const reserve = mobile ? MOBILE_RESERVE : 44;

  const x = useMotionValue(p.left);
  const y = useMotionValue(p.top);
  const angle = useMotionValue(p.angle);
  const swayTarget = useMotionValue(0);
  const sway = useSpring(swayTarget, { stiffness: 130, damping: 7, mass: 0.7 });
  const rotation = useTransform([angle, sway, bump], ([a, s, b]) => a + s + b);
  const level = useMotionValue(p.startEmpty ? 0 : 1);
  const fillD = useTransform([level, rotation, slosh, cupVer], ([l, r, s]) => liquidPaths(geomRef.current, l, r + s).fill);
  const surfD = useTransform([level, rotation, slosh, cupVer], ([l, r, s]) => liquidPaths(geomRef.current, l, r + s).surface);
  const steamOpacity = useTransform([level, rotation], ([l, r]) => (l < 0.04 ? 0 : 1 - clamp((Math.abs(r) - 18) / 24, 0, 1)));
  const heartY = useTransform([level, cupVer], ([l]) => levelY(geomRef.current, l) + 1.2);
  const heartOp = useTransform([level, rotation, cupVer, heartT], ([l, r, , h]) => (def.heart && l > 0.25 && Math.abs(r) < 6 ? 0.95 * h : 0));
  const lidY = useTransform(lidT, (v) => v * -28);
  const lidR = useTransform(lidT, (v) => v * -20);
  const [empty, setEmpty] = useState(!!p.startEmpty);
  const [tipped, setTipped] = useState(false);

  const setLid = useCallback(
    (off) => {
      if (!def.open || lid.current.off === off) return;
      lid.current.off = off;
      geomRef.current = geomOf(def.id, off);
      cupVer.set(cupVer.get() + 1);
      if (reduceRef.current) lidT.set(off ? 1 : 0);
      else animate(lidT, off ? 1 : 0, { type: "spring", stiffness: off ? 240 : 420, damping: off ? 13 : 11 });
      world.wake();
    },
    [def, cupVer, lidT]
  );

  const setUserAngle = useCallback(
    (v) => {
      tipAnim.current?.stop();
      angle.set(clamp(v, -170, 190));
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

  // The collider: a capsule around the cup's body, owned by the shared physics world.
  useEffect(() => {
    const bounds = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      // The body (not the empty box around it) has to stay on screen.
      const ex = (def.col.h[0] + def.col.r) * k + 2;
      const ey = (def.col.h[1] + def.col.r) * k;
      const out = b.out || 0;
      return { l: ex - out, r: Math.max(ex, W - ex) + out, t: Math.max(ey, 56 + ey), b: Math.max(56 + ey, H - size - reserve + ccy * k) };
    };
    const b = {
      kind: "cup",
      x: p.left + ccx * k,
      y: p.top + ccy * k,
      hx: def.col.h[0] * k,
      hy: def.col.h[1] * k,
      r: def.col.r * k,
      mass: def.mass * (size / 176) ** 2,
      damp: 3.2,
      out: 0,
      fitT: 1,
      base: { hx: def.col.h[0] * k, hy: def.col.h[1] * k, r: def.col.r * k },
      bounds,
      // Phone buttons hang under the cup: they must stay off the text too.
      extra: mobile || window.innerWidth < 1024 ? (cx, cy) => {
        const l = cx - ccx * k;
        const t = cy - ccy * k + size + 4;
        const r = l + size;
        return [r - (mobile ? 150 : 70), t, r, t + (mobile ? 44 : 36)];
      } : null,
      // Settling away from text: shrink the toy (and its collider) when there is no room, 0 hides it.
      setFit: (f, out, instant) => {
        b.fitT = f;
        b.out = out;
        b.rT = b.base.r * f;
        b.hxT = b.base.hx * f;
        b.hyT = b.base.hy * f;
        if (reduceRef.current || instant) fitS.set(f);
        else animate(fitS, f, { type: "spring", stiffness: 200, damping: 18 });
      },
      sync: () => {
        x.set(b.x - ccx * k);
        y.set(b.y - ccy * k);
        swayTarget.set(clamp(b.vx * 0.011, -16, 16));
      },
      onGrab: () => {
        z.set(++engine.z);
        boxRef.current?.focus({ preventScroll: true });
        tipAnim.current?.stop();
      },
      onRelease: (v) => {
        swayTarget.set(0);
        const speed = Math.hypot(v[0], v[1]);
        if (speed > 1600 && level.get() > 0.05 && !reduceRef.current) {
          const { point } = lowLip(geomRef.current, rotation.get(), x.get(), y.get(), k);
          spillRef.current?.burst(point[0], point[1], (v[0] / speed) * 0.6, (v[1] / speed) * 0.6, 3 + Math.round(Math.min(3, speed / 1200)), def.pour[2]);
          level.set(Math.max(0, level.get() - 0.05));
        }
      },
      hit: ({ speed, nx, other }) => {
        if (reduceRef.current) return;
        const share = other ? other.mass / (other.mass + b.mass) : 0.35;
        const m = clamp(speed / 1800, 0.1, 1);
        // Squash, then spring back; lean away from the hit; kick the surface.
        popS.set(1 - 0.06 * m * (0.6 + share));
        animate(popS, 1, { type: "spring", stiffness: 320, damping: 7 });
        const kick = clamp(-nx * speed * 0.012 * (0.35 + share * 1.2), -9, 9) || (Math.random() - 0.5) * m * 8;
        bump.set(kick);
        animate(bump, 0, { type: "spring", stiffness: 130, damping: 6 });
        simRef.current.kick(kick * 1.2);
        if (other?.kind === "cup" && speed > 650 && level.get() > 0.12 && phase.current !== "refill") {
          const g = geomRef.current;
          const pt = worldPoint(g, g.lips[0].p, rotation.get(), x.get(), y.get(), k);
          spillRef.current?.burst(pt[0], pt[1], -nx * 0.5, -0.6, 2 + Math.round(m * 2), def.pour[2]);
          level.set(Math.max(0, level.get() - 0.015 * m));
        }
        world.wake();
      },
    };
    bodyRef.current = b;
    const remove = world.add(b);
    const onResize = () => {
      const B = bounds();
      b.x = clamp(b.x, B.l, B.r);
      b.y = clamp(b.y, B.t, B.b);
      b.sync();
      world.needsRelax = true;
      world.wake();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      remove();
    };
  }, [def, size, k, ccx, ccy, reserve, mobile, fitS, p.left, p.top, x, y, swayTarget, z, engine, level, rotation, popS, bump, spillRef]);

  // Per-frame cup physics, run by the shared world loop: slosh, pouring (partial tilt trickle,
  // full-tip dump), the paper cup's lid.
  useEffect(() => {
    let lastPhi = rotation.get();
    let sl = 0;
    let sv = 0;
    let flowStr = "0";
    let dumpOn = false;
    const wrap = (a) => Math.abs((((a + 180) % 360) + 360) % 360 - 180);

    const sim = {
      kick: (v) => {
        sv += v;
        world.wake();
      },
      step: (dt) => {
        const spill = spillRef.current;
        if (!spill) return false;
        const phi = rotation.get();
        const lv = level.get();

        if (def.open) {
          const a = wrap(phi);
          if (!lid.current.off && a >= 98 && lv > 0.02 && phase.current === "idle") setLid(true);
          else if (lid.current.off && a < 35 && phase.current === "idle" && lv > 0.002) setLid(false);
        }
        const g = geomRef.current;

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
              const { point, dir } = lowLip(g, phi, x.get(), y.get(), k);
              const speed = Math.max(28, Math.sqrt(2 * G * Math.min(st.head, g.headMax) * k));
              const H = window.innerHeight;
              const x0 = point[0] + dir[0] * 2;
              const y0 = point[1] + dir[1] * 2;
              const wMax = Math.min(12 + 20 * st.dw, g.lipW * k * 0.9);
              const w = Math.min(clamp(0.28 * Math.sqrt(st.flow) * (0.55 + 0.45 * Math.min(1, k * 1.4)), 1.1, 12 + 20 * st.dw), wMax);
              spill.setStream(slot, {
                x0,
                y0,
                vx: dir[0] * speed,
                vy: dir[1] * speed,
                w,
                rate: Math.min(40, 2 + 0.012 * st.flow),
                landY: Math.max(y0 + 10, Math.min(H - 4, y0 + H * 0.6)),
                col: def.pour[2],
                big: st.dw > 0.4,
              });
              // The moment it tips over: a burst of droplets out of the mouth.
              if (st.dw > 0.5 && !dumpOn && lv > 0.2) {
                dumpOn = true;
                spill.burst(point[0], point[1], dir[0], dir[1], 8, def.pour[2]);
                spill.splash(point[0], point[1], 3, 260, 1.1, def.pour[2]);
              }
            }
          }
          if (st.dw < 0.3) dumpOn = false;
          const fs = ((flow / g.volA) * 100).toFixed(1);
          if (fs !== flowStr) {
            flowStr = fs;
            boxRef.current.dataset.flow = fs;
          }
        } else {
          if (flowStr !== "0") {
            flowStr = "0";
            boxRef.current.dataset.flow = "0";
          }
          if (wrap(phi) < 60) dumpOn = false;
        }
        if (!pouring) spill.setStream(slot, null);
        return pouring || sl !== 0 || sv !== 0;
      },
    };
    simRef.current = sim;
    world.sims.add(sim);
    const offRot = rotation.on("change", () => world.wake());

    const box = boxRef.current;
    const offLevel = level.on("change", (v) => {
      const pct = Math.round(v * 100);
      box.dataset.level = String(pct);
      box.dataset.levelExact = (v * 100).toFixed(2);
      box.setAttribute("aria-label", labelFor(def, pct, mobile));
      setEmpty(v <= 0.002);
      world.wake();
    });
    const offAngle = angle.on("change", (v) => {
      box.dataset.angle = v.toFixed(1);
    });
    const lv0 = level.get();
    box.dataset.level = String(Math.round(lv0 * 100));
    box.dataset.levelExact = (lv0 * 100).toFixed(2);
    box.dataset.angle = angle.get().toFixed(1);
    box.dataset.flow = "0";
    box.dataset.cup = def.id;
    box.setAttribute("aria-label", labelFor(def, Math.round(lv0 * 100), mobile));
    world.wake();

    return () => {
      world.sims.delete(sim);
      offRot();
      offLevel();
      offAngle();
      spillRef.current?.setStream(slot, null); // eslint-disable-line react-hooks/exhaustive-deps
    };
  }, [def, rotation, level, angle, x, y, slosh, slot, k, setLid, spillRef, mobile]);

  // The drink's layers stay level with the world while the cup turns: counter-rotate the gradient.
  useEffect(() => {
    const apply = (r) => {
      const [ox, oy] = geomRef.current.origin;
      counterRef.current?.setAttribute("transform", `rotate(${(-r).toFixed(2)} ${ox} ${oy})`);
    };
    apply(rotation.get());
    const off = rotation.on("change", apply);
    return off;
  }, [rotation]);

  // Phone swap: pop in on mount, expose pop-out and position to the layer.
  useEffect(() => {
    if (!mobile) return undefined;
    if (p.pop) {
      if (reduceRef.current) {
        swapS.set(1);
        swapR.set(0);
      } else {
        animate(swapS, 1, { type: "spring", stiffness: 330, damping: 10 });
        animate(swapR, 0, { type: "spring", stiffness: 260, damping: 9 });
      }
    }
    const me = {
      at: () => [x.get() + size / 2, y.get() + size],
      out: () => {
        if (reduceRef.current) return Promise.resolve();
        return Promise.all([
          animate(swapS, 0, { duration: 0.22, ease: [0.55, -0.4, 0.9, 0.5] }),
          animate(swapR, 18, { duration: 0.22, ease: "easeIn" }),
        ]);
      },
    };
    ctl.current = me;
    settleSoon([0, 350, 1000]); // the new cup may have popped in over text
    return () => {
      if (ctl.current === me) ctl.current = null;
    };
  }, [mobile, p.pop, swapS, swapR, x, y, size, ctl]);

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

  const toggleTip = () => {
    if (Math.abs(angle.get()) > 30) upright();
    else {
      const cx = x.get() + size / 2;
      const sign = def.pourSign ?? (cx > window.innerWidth / 2 ? -1 : 1);
      tipTo(sign * (def.tipAngle ?? 105));
    }
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 15 : 6;
    let used = true;
    if (e.key === "ArrowLeft") setUserAngle(angle.get() - step);
    else if (e.key === "ArrowRight") setUserAngle(angle.get() + step);
    else if (e.key === "t" || e.key === "T" || e.key === "Enter" || e.key === " ") toggleTip();
    else if (e.key === "r" || e.key === "R" || e.key === "Escape") upright();
    else if (mobile && (e.key === "c" || e.key === "C")) onSwapRef.current?.();
    else used = false;
    if (used) {
      e.preventDefault();
      e.stopPropagation();
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
    z.set(++engine.z);
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

  // Keep the phone buttons on screen when the cup is dragged against the left edge.
  const btnX = useTransform(x, (v) => {
    const right = v + size;
    return Math.max(0, Math.min(4 - (right - 150), window.innerWidth - 4 - right));
  });

  const colorClass = dark ? "text-milk" : "text-espresso";
  const [ox, oy] = def.origin;
  const dr = def.drink;
  const clipId = `cup-liquid-clip-${uid}`;
  const gradId = `cup-drink-${uid}`;

  const cup = useMemo(
    () => ({
      x,
      y,
      size,
      level,
      angle,
      phase,
      upright,
      defRef,
      geomRef,
      slot,
      setLid,
      heartT,
      fresh,
      // Phones: a dry cup that has not been refilled yet goes out and the next type comes in.
      onDry: mobile ? () => onSwapRef.current?.(true) : null,
      wake: () => world.wake(),
    }),
    [x, y, size, level, angle, upright, slot, setLid, heartT, mobile]
  );

  return (
    <>
      <motion.div className="group absolute left-0 top-0" style={{ x, y, width: size, height: size, zIndex: z }}>
        <div
          ref={boxRef}
          role="button"
          tabIndex={0}
          aria-label={labelFor(def, p.startEmpty ? 0 : 100, mobile)}
          data-level={p.startEmpty ? "0" : "100"}
          data-cup={def.id}
          data-testid="coffee-cup"
          onKeyDown={onKeyDown}
          onFocus={() => z.set(++engine.z)}
          className={`relative h-full w-full rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-dashed ${colorClass} transition-colors duration-500`}
          style={{ outlineColor: "#C8955B" }}
        >
          <motion.div className="h-full w-full" style={{ scale: fitS, originX: ccx / CUP_VB.w, originY: ccy / CUP_VB.h }}>
          <motion.div className="h-full w-full" style={{ scale: swapS, rotate: swapR, originX: 0.5, originY: 0.9 }}>
          <motion.div className="h-full w-full" style={{ scale: popS, originX: 0.5, originY: 0.9 }}>
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
                  <clipPath id={clipId}>
                    <motion.path d={fillD} />
                  </clipPath>
                  <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1={dr.y0} x2="0" y2={dr.y1}>
                    {dr.stops.map(([o, c]) => (
                      <stop key={o} offset={o} stopColor={c} />
                    ))}
                  </linearGradient>
                </defs>
                <g clipPath={`url(#${clipId})`} stroke="none">
                  <g ref={counterRef}>
                    <rect x="-120" y="-120" width="420" height="420" fill={`url(#${gradId})`} />
                  </g>
                </g>
                <g clipPath={`url(#${clipId})`}>
                  <motion.path d={surfD} stroke={dr.surface} strokeWidth={dr.crema * 2} />
                </g>
                <motion.path d={surfD} stroke={dr.cremaHi} strokeWidth="1.5" opacity="0.8" />
                <motion.g style={{ y: heartY, opacity: heartOp }}>
                  <g transform="translate(85 0)">
                    <LatteHeart />
                  </g>
                </motion.g>

                <CupArt id={def.id} />
                {def.open && (
                  <motion.g style={{ y: lidY, rotate: lidR }}>
                    <CupLid />
                  </motion.g>
                )}

                <path
                  d={def.hit}
                  className="toy-hit"
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="10"
                  style={{ pointerEvents: "all", touchAction: "none" }}
                  onPointerDown={(e) => {
                    if (e.button > 0) return;
                    if (mobile) {
                      // Double-tap swaps the cup.
                      const now = performance.now();
                      const t = lastTap.current;
                      if (t && now - t.t < 350 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 36) {
                        lastTap.current = null;
                        onSwapRef.current?.();
                        return;
                      }
                      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
                    }
                    world.startDrag(bodyRef.current, e);
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
                  <circle cx={def.knob[0]} cy={def.knob[1]} r="11" fill="var(--handle-fill, rgb(200 149 91 / 0.25))" stroke="#C8955B" strokeWidth="2" />
                  <path d={`M${def.knob[0] - 5} ${def.knob[1]} A5 5 0 1 1 ${def.knob[0]} ${def.knob[1] + 5}`} stroke="#C8955B" strokeWidth="1.8" />
                  <path d={`M${def.knob[0] - 5} ${def.knob[1] - 4} L${def.knob[0] - 5} ${def.knob[1] + 0.5} L${def.knob[0] - 0.5} ${def.knob[1]}`} stroke="#C8955B" strokeWidth="1.8" />
                </g>
              </motion.svg>
            </div>
          </motion.div>
          </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute right-0 top-full mt-1 flex gap-1.5 lg:left-1/2 lg:right-auto lg:-translate-x-1/2"
          style={mobile ? { x: btnX } : undefined}
        >
          {mobile && (
            <button
              type="button"
              aria-label="Swap cup"
              data-testid="cup-swap"
              onClick={() => onSwapRef.current?.()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.stopPropagation();
              }}
              className={`pointer-events-auto inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap border border-current px-3 font-mono text-[10px] uppercase tracking-[0.18em] opacity-80 transition-opacity duration-150 focus-visible:opacity-100 ${colorClass}`}
            >
              swap cup
            </button>
          )}
          <button
            type="button"
            aria-label={tipped ? `Set the ${def.name} upright` : `Tip the ${def.name}`}
            data-testid="cup-tip"
            onClick={toggleTip}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") e.stopPropagation();
            }}
            className={`pointer-events-auto inline-flex ${mobile ? "min-h-11 min-w-11 justify-center px-3" : "min-h-9 px-2.5"} items-center whitespace-nowrap border border-current font-mono text-[10px] uppercase tracking-[0.18em] opacity-80 transition-opacity duration-150 focus-visible:opacity-100 lg:min-h-7 lg:opacity-0 lg:group-hover:opacity-80 ${colorClass}`}
          >
            {tipped ? "upright" : "tip"}
          </button>
        </motion.div>
      </motion.div>

      <Brewer cup={cup} spill={spillRef} reduce={reduce} layerRef={layerRef} />
    </>
  );
}

function labelFor(def, pct, mobile = false) {
  return `${def.name}, ${pct}% full. Press T to tip, arrow keys rotate while focused, R to set it upright${mobile ? ", C to swap the cup" : ""}`;
}
