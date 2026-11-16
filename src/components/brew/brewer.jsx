import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { levelY } from "@/lib/cup-geometry";

// A hand-drawn moka pot. Spout tip is at (14, 29) in this 120 x 150 box.
const SPOUT = [14, 29];
const ORIGIN = [60, 80];
const POUR_DEG = 52;

function MokaPot({ flipRef }) {
  return (
    <svg ref={flipRef} viewBox="0 0 120 150" className="h-full w-full" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" stroke="#2A1A12">
      <path d="M42 84 L78 84 L92 138 L28 138 Z" fill="#C9B8A6" />
      <path d="M34 36 L86 36 L78 84 L42 84 Z" fill="#E9D9C4" />
      <path d="M36 22 L84 22 L86 36 L34 36 Z" fill="#B07A4C" />
      <circle cx="60" cy="15" r="5.5" fill="#2A1A12" />
      <path d="M34 36 C28 36 22 33 14 29 C22 25 30 28 37 29" fill="#E9D9C4" />
      <path d="M37 82 L83 82 L83 90 L37 90 Z" fill="#8C735F" />
      <path d="M86 42 C116 36 116 84 80 80" strokeWidth="6" />
      <path d="M86 42 C112 38 112 80 81 78" stroke="#8C735F" strokeWidth="2" />
      <path d="M44 48 L48 78 M54 48 L56 78" stroke="#8C735F" strokeWidth="1.5" opacity="0.7" />
      <path d="M36 100 L42 130 M46 98 L50 130" stroke="#8C735F" strokeWidth="1.5" opacity="0.7" />
      <path d="M26 144 C50 148 78 148 98 144" opacity="0.5" strokeWidth="1.6" />
    </svg>
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Waits behind the scenes. When the cup runs dry it swoops in, tips, pours a fresh shot, and leaves.
export function Brewer({ cup, spill, reduce }) {
  const { x: cupX, y: cupY, size, level, angle, phase, upright, geomRef, swapNext, wake } = cup;
  const ps = size / 176;
  const potW = 130 * ps;
  const potH = potW * 1.25;
  const s = potW / 120;

  const bx = useMotionValue(-600);
  const by = useMotionValue(-600);
  const br = useMotionValue(0);
  const bo = useMotionValue(0);
  const flipRef = useRef(null);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const live = useRef({ size, s, potH });
  live.current = { size, s, potH };

  useEffect(() => {
    let dead = false;
    let timer = 0;
    let raf = 0;
    const stopAnims = [];

    const k = () => live.current.size / 170;
    // Where the pot's top-left must sit so the spout tip is at (tx, ty) when rotated by rot.
    const poseFor = (rot, dir, tx, ty) => {
      const sc = live.current.s;
      const r = (rot * Math.PI) / 180;
      const lx = (SPOUT[0] - ORIGIN[0]) * sc * dir;
      const ly = (SPOUT[1] - ORIGIN[1]) * sc;
      const rx = lx * Math.cos(r) - ly * Math.sin(r);
      const ry = lx * Math.sin(r) + ly * Math.cos(r);
      const ox = ORIGIN[0] * sc;
      return [tx - ox - rx, ty - ORIGIN[1] * sc - ry];
    };
    const spoutNow = (dir) => {
      const sc = live.current.s;
      const r = (br.get() * Math.PI) / 180;
      const lx = (SPOUT[0] - ORIGIN[0]) * sc * dir;
      const ly = (SPOUT[1] - ORIGIN[1]) * sc;
      return [bx.get() + ORIGIN[0] * sc + lx * Math.cos(r) - ly * Math.sin(r), by.get() + ORIGIN[1] * sc + lx * Math.sin(r) + ly * Math.cos(r)];
    };
    const mouth = () => {
      const kk = k();
      const m = geomRef.current.def.mouth;
      return [cupX.get() + m[0] * kk, cupY.get() + m[1] * kk];
    };
    const run = (...a) => {
      const list = a.filter(Boolean);
      stopAnims.push(...list);
      return Promise.all(list);
    };
    const to = (mv, v, opts) => animate(mv, v, opts);

    const brew = async () => {
      phase.current = "arriving";
      // Empty cup goes out, a fresh one pops in; the pot then fills whichever cup it finds.
      // Racing a timeout so a visitor grabbing the cup mid-spring cannot leave the pot waiting forever.
      await Promise.race([run(upright()), sleep(1200)]);
      if (dead) return;
      await swapNext();
      if (dead) return;
      const W = window.innerWidth;
      const [mx] = mouth();
      // The pot sits on whichever side of the cup has more room; the spout points at the cup.
      const dir = mx > W / 2 ? -1 : 1;
      const pourRot = dir > 0 ? -POUR_DEG : POUR_DEG;
      flipRef.current.style.transform = dir > 0 ? "" : "scaleX(-1)";
      const kk = k();

      const tipTarget = () => {
        const [cx, cy] = mouth();
        return [cx + dir * -6 * kk, cy - 30 * kk];
      };
      const park = () => {
        const [tx, ty] = tipTarget();
        return poseFor(0, dir, tx - dir * 70 * ps, ty - 90 * ps);
      };

      await sleep(reduce ? 50 : 250);
      if (dead) return;

      if (reduce) {
        const [px, py] = poseFor(pourRot, dir, ...tipTarget());
        bx.set(px);
        by.set(py);
        br.set(pourRot);
        await run(to(bo, 1, { duration: 0.3 }));
      } else {
        const [px, py] = park();
        const fromX = dir > 0 ? W + potW + 60 : -potW - 60;
        bo.set(1);
        br.set(dir * -70);
        await run(
          to(bx, [fromX, px - dir * 50 * ps, px], { duration: 1.25, times: [0, 0.68, 1], ease: [[0.15, 0.7, 0.3, 1], "easeInOut"] }),
          to(by, [-potH - 80, py + 36, py], { duration: 1.25, times: [0, 0.68, 1], ease: ["easeIn", "easeInOut"] }),
          to(br, [dir * -70, dir * 14, 0], { duration: 1.25, times: [0, 0.68, 1], ease: "easeInOut" })
        );
        if (dead) return;
        await sleep(220);
        if (dead) return;
        const [tx, ty] = poseFor(pourRot, dir, ...tipTarget());
        await run(
          to(bx, tx, { type: "spring", stiffness: 90, damping: 13 }),
          to(by, ty, { type: "spring", stiffness: 90, damping: 13 }),
          to(br, pourRot, { type: "spring", stiffness: 80, damping: 9 })
        );
      }
      if (dead) return;

      // Pour: the level rises while a stream runs spout -> surface, following the cup if it moves.
      phase.current = "refill";
      const fill = to(level, 1, reduce ? { duration: 0.6, ease: "easeOut" } : { duration: 1.6, ease: [0.4, 0.1, 0.3, 1] });
      stopAnims.push(fill);
      let aborted = false;
      let lastTs = performance.now();
      let splashT = 0;
      await new Promise((resolve) => {
        fill.then(() => resolve());
        if (reduce) return;
        const frame = (now) => {
          if (dead) return resolve();
          const dt = Math.min(0.05, (now - lastTs) / 1000);
          lastTs = now;
          if (Math.abs(angle.get()) > 35) {
            aborted = true;
            fill.stop();
            return resolve();
          }
          const [tx, ty] = poseFor(pourRot, dir, ...tipTarget());
          const f = Math.min(1, dt * 10);
          bx.set(bx.get() + (tx - bx.get()) * f);
          by.set(by.get() + (ty - by.get()) * f);
          const [sx, sy] = spoutNow(dir);
          const [cx, cy] = mouth();
          const gm = geomRef.current;
          const lid = gm.def.stream === "lid";
          const surf = lid ? cy - 2 : cupY.get() + levelY(gm, level.get()) * k() + 2;
          const d = `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${(sx + (cx - sx) * 0.2).toFixed(1)} ${(sy + (surf - sy) * 0.75).toFixed(1)} ${cx.toFixed(1)} ${surf.toFixed(1)}`;
          const w = 5 * (0.5 + 0.5 * k() * 1.4);
          innerRef.current.firstChild.setAttribute("d", d);
          innerRef.current.firstChild.setAttribute("stroke-width", (w + 2.5).toFixed(1));
          innerRef.current.lastChild.setAttribute("d", d);
          innerRef.current.lastChild.setAttribute("stroke-width", w.toFixed(1));
          innerRef.current.style.opacity = "1";
          splashT -= dt;
          if (splashT <= 0) {
            splashT = 0.07;
            spill.current?.splash(cx + (Math.random() - 0.5) * gm.def.spread * k(), surf, 1, 200);
          }
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      });
      cancelAnimationFrame(raf);
      innerRef.current.style.opacity = "0";
      if (dead) return;
      phase.current = "leaving";

      // Straighten up and swoop out the other way.
      if (reduce) {
        await run(to(bo, 0, { duration: 0.3 }));
      } else {
        const [px, py] = park();
        await run(
          to(bx, px, { type: "spring", stiffness: 100, damping: 14 }),
          to(by, py, { type: "spring", stiffness: 100, damping: 14 }),
          to(br, 0, { type: "spring", stiffness: 120, damping: 10 })
        );
        if (dead) return;
        const toX = dir > 0 ? -potW - 80 : W + potW + 80;
        await run(
          to(bx, [px, px - dir * 40 * ps, toX], { duration: 1.1, times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] }),
          to(by, [py, py + 24, -potH - 120], { duration: 1.1, times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] }),
          to(br, [0, dir * 10, dir * 80], { duration: 1.1, times: [0, 0.3, 1], ease: "easeIn" })
        );
        bo.set(0);
      }
      phase.current = "idle";
      wake();
      if (aborted) check(1400);
    };

    const check = (delay = 600) => {
      if (timer || dead) return;
      timer = setTimeout(() => {
        timer = 0;
        if (!dead && phase.current === "idle" && level.get() <= 0.002) brew();
      }, delay);
    };

    const off = level.on("change", (v) => {
      if (v <= 0.002 && phase.current === "idle") check();
    });

    return () => {
      dead = true;
      off();
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      stopAnims.forEach((a) => a?.stop?.());
    };
    // cup and spill are stable refs/motion values created once by the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <>
      <svg ref={innerRef} className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-150" fill="none" strokeLinecap="round">
        <path stroke="#2A1A12" />
        <path stroke="#B07A4C" />
      </svg>
      <motion.div
        ref={outerRef}
        aria-hidden="true"
        className="absolute left-0 top-0"
        style={{ x: bx, y: by, rotate: br, opacity: bo, width: potW, height: potH, originX: 0.5, originY: ORIGIN[1] / 150 }}
      >
        <MokaPot flipRef={flipRef} />
      </motion.div>
    </>
  );
}
