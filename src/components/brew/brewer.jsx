import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { levelY } from "@/lib/cup-geometry";
import { PotArt } from "@/components/brew/pots";
import { POTS } from "@/lib/pots";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One refill device per cup. It waits off screen. When its cup runs dry it flies in (each pot in
// its own way), tips, pours, and leaves. Several pots can be out at once, each for its own cup.
export function Brewer({ cup, spill, reduce, layerRef }) {
  const { x: cupX, y: cupY, size, level, angle, phase, upright, geomRef, defRef, wake, slot, setLid, heartT } = cup;
  const potId = defRef.current.pot;
  const pot = POTS[potId];
  const [SPX, SPY] = pot.spout;
  const [PVX, PVY] = pot.pivot;
  const ps = Math.max(size, 132) / 176;
  const potW = 130 * ps * pot.wk;
  const potH = potW * 1.25;
  const s = potW / 120;

  const bx = useMotionValue(-600);
  const by = useMotionValue(-600);
  const br = useMotionValue(0);
  const bo = useMotionValue(0);
  const flipRef = useRef(null);
  const live = useRef({ size, s, potH, ps, potW });
  live.current = { size, s, potH, ps, potW };

  useEffect(() => {
    let dead = false;
    let timer = 0;
    let raf = 0;
    const stopAnims = [];
    const grp = layerRef.current?.querySelector(`[data-brew-slot="${slot}"]`);

    const k = () => live.current.size / 170;
    // Where the pot's top-left must sit so the spout tip is at (tx, ty) when rotated by rot.
    const poseFor = (rot, dir, tx, ty) => {
      const sc = live.current.s;
      const r = (rot * Math.PI) / 180;
      const lx = (SPX - PVX) * sc * dir;
      const ly = (SPY - PVY) * sc;
      const rx = lx * Math.cos(r) - ly * Math.sin(r);
      const ry = lx * Math.sin(r) + ly * Math.cos(r);
      return [tx - PVX * sc - rx, ty - PVY * sc - ry];
    };
    const spoutNow = (dir) => {
      const sc = live.current.s;
      const r = (br.get() * Math.PI) / 180;
      const lx = (SPX - PVX) * sc * dir;
      const ly = (SPY - PVY) * sc;
      return [bx.get() + PVX * sc + lx * Math.cos(r) - ly * Math.sin(r), by.get() + PVY * sc + lx * Math.sin(r) + ly * Math.cos(r)];
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

    // How each pot flies in and out. px/py is the hover pose, from/toX the off-screen sides.
    const enter = (dir, px, py, W) => {
      const { potH: pH, ps: p } = live.current;
      const fromX = dir > 0 ? W + live.current.potW + 60 : -live.current.potW - 60;
      bo.set(1);
      switch (pot.fly) {
        case "slide":
          br.set(dir * -8);
          bx.set(fromX);
          by.set(py + 44 * p);
          return run(
            to(bx, px, { duration: 0.95, ease: [0.2, 0.7, 0.3, 1] }),
            to(by, py, { duration: 0.95, ease: "easeOut" }),
            to(br, 0, { duration: 0.95, ease: "easeOut" })
          );
        case "arc":
          br.set(dir * -40);
          return run(
            to(bx, [fromX, px + dir * 40 * p, px], { duration: 1.4, times: [0, 0.6, 1], ease: ["easeOut", "easeInOut"] }),
            to(by, [py - 150, py - 230, py], { duration: 1.4, times: [0, 0.55, 1], ease: ["easeOut", "easeIn"] }),
            to(br, [dir * -40, dir * -12, 0], { duration: 1.4, times: [0, 0.55, 1], ease: "easeInOut" })
          );
        case "swing":
          return run(
            to(bx, [px + dir * 190 * p, px - dir * 30 * p, px + dir * 10 * p, px], { duration: 1.5, times: [0, 0.5, 0.8, 1], ease: "easeInOut" }),
            to(by, [-pH - 40, py + 26, py - 8, py], { duration: 1.5, times: [0, 0.5, 0.8, 1], ease: "easeInOut" }),
            to(br, [dir * -75, dir * 28, dir * -10, 0], { duration: 1.5, times: [0, 0.5, 0.8, 1], ease: "easeInOut" })
          );
        case "drop":
          bx.set(px);
          br.set(0);
          return run(to(by, [-pH - 80, py + 14, py - 5, py], { duration: 1.1, times: [0, 0.6, 0.8, 1], ease: ["easeIn", "easeOut", "easeInOut"] }));
        default:
          br.set(dir * -70);
          return run(
            to(bx, [fromX, px - dir * 50 * p, px], { duration: 1.25, times: [0, 0.68, 1], ease: [[0.15, 0.7, 0.3, 1], "easeInOut"] }),
            to(by, [-pH - 80, py + 36, py], { duration: 1.25, times: [0, 0.68, 1], ease: ["easeIn", "easeInOut"] }),
            to(br, [dir * -70, dir * 14, 0], { duration: 1.25, times: [0, 0.68, 1], ease: "easeInOut" })
          );
      }
    };
    const leave = (dir, px, py, W) => {
      const { potH: pH, ps: p, potW: pW } = live.current;
      const toX = dir > 0 ? -pW - 80 : W + pW + 80;
      const offRight = dir > 0 ? W + pW + 80 : -pW - 80;
      switch (pot.fly) {
        case "slide":
          return run(
            to(bx, offRight, { duration: 0.9, ease: [0.5, 0, 0.9, 0.6] }),
            to(by, [py, py + 30 * p], { duration: 0.9, ease: "easeIn" }),
            to(br, [0, dir * 7], { duration: 0.9, ease: "easeIn" })
          );
        case "arc":
          return run(
            to(bx, [px, px + dir * 30 * p, offRight], { duration: 1.2, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] }),
            to(by, [py, py - 170, py - 200], { duration: 1.2, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] }),
            to(br, [0, dir * 14, dir * 40], { duration: 1.2, ease: "easeIn" })
          );
        case "swing":
          return run(
            to(bx, [px, px + dir * 30 * p, px + dir * 190 * p], { duration: 1.2, times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] }),
            to(by, [py, py - 30 * p, -pH - 120], { duration: 1.2, times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] }),
            to(br, [0, dir * -18, dir * 70], { duration: 1.2, times: [0, 0.3, 1], ease: "easeIn" })
          );
        case "drop":
          return run(to(by, [py, py + 10, -pH - 120], { duration: 0.9, times: [0, 0.2, 1], ease: ["easeOut", "easeIn"] }));
        default:
          return run(
            to(bx, [px, px - dir * 40 * p, toX], { duration: 1.1, times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] }),
            to(by, [py, py + 24, -pH - 120], { duration: 1.1, times: [0, 0.3, 1], ease: ["easeOut", "easeIn"] }),
            to(br, [0, dir * 10, dir * 80], { duration: 1.1, times: [0, 0.3, 1], ease: "easeIn" })
          );
      }
    };

    const brew = async () => {
      phase.current = "arriving";
      await Promise.race([run(upright()), sleep(1200)]);
      if (dead) return;
      const W = window.innerWidth;
      const [mx] = mouth();
      // The pot comes in on whichever side of the cup has more room; the spout points at the cup.
      const dir = mx > W / 2 ? -1 : 1;
      const pourRot = dir > 0 ? -pot.deg : pot.deg;
      flipRef.current.style.transform = dir > 0 ? "" : "scaleX(-1)";

      const tipTarget = () => {
        const [cx, cy] = mouth();
        const kk = k();
        return [cx - dir * pot.aim[0] * kk, cy - pot.aim[1] * kk];
      };
      const park = () => {
        const [tx, ty] = tipTarget();
        const p = live.current.ps;
        return poseFor(0, dir, tx - dir * pot.park[0] * p, ty - pot.park[1] * p);
      };

      await sleep(reduce ? 50 : 200);
      if (dead) return;

      if (reduce) {
        setLid(true);
        const [px, py] = poseFor(pourRot, dir, ...tipTarget());
        bx.set(px);
        by.set(py);
        br.set(pourRot);
        await run(to(bo, 1, { duration: 0.3 }));
      } else {
        const [px, py] = park();
        await enter(dir, px, py, W);
        if (dead) return;
        setLid(true);
        await sleep(240);
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
      const def = defRef.current;
      const colD = def.pour[2];
      if (def.heart) heartT.set(0);
      const fill = to(level, 1, reduce ? { duration: 0.6, ease: "easeOut" } : { duration: pot.fill, ease: [0.4, 0.1, 0.3, 1] });
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
          const w = 5 * (0.5 + 0.5 * k() * 1.4) * pot.sw;
          if (grp) {
            grp.children[0].setAttribute("d", d);
            grp.children[0].setAttribute("stroke-width", (w + 2.5).toFixed(1));
            grp.children[1].setAttribute("d", d);
            grp.children[1].setAttribute("stroke-width", w.toFixed(1));
            grp.style.opacity = "1";
          }
          splashT -= dt;
          if (splashT <= 0) {
            splashT = 0.07;
            spill.current?.splash(cx + (Math.random() - 0.5) * gm.def.spread * k(), surf, 1, 200, 1, colD);
          }
          raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      });
      cancelAnimationFrame(raf);
      if (grp) grp.style.opacity = "0";
      if (dead) return;
      if (def.heart && !aborted) to(heartT, 1, { duration: 0.6, ease: "easeOut" });
      phase.current = "leaving";
      if (!aborted) {
        if (!reduce) await sleep(260);
        setLid(false);
        await sleep(reduce ? 0 : 180);
        if (dead) return;
      } else setLid(false);

      // Straighten up and swoop out.
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
        await leave(dir, px, py, W);
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
    <motion.div
      aria-hidden="true"
      className="absolute left-0 top-0"
      style={{ x: bx, y: by, rotate: br, opacity: bo, width: potW, height: potH, originX: 0.5, originY: PVY / 150, zIndex: 100 }}
    >
      <PotArt id={potId} flipRef={flipRef} />
    </motion.div>
  );
}
