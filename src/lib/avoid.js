// Keeps the toys off the text. On load, when a section lands, and on resize, every free body (the
// cups, the background shapes) that would sit on readable text glides to the nearest free spot,
// and every doodle that would cover text is nudged, shrunk or hidden. Bodies the visitor is
// dragging are left alone; a body they parked is only moved if text ended up under it.
import { capGap, world } from "@/lib/world";

const CELL = 10;
const PAD = 12;
const SKIP = '[aria-hidden="true"],[data-toys],[data-doodle],header,script,style,.sr-only,#brew-wipe,svg';

// Text (line boxes) and controls inside the viewport, as inflated [l, t, r, b] rects.
function collectText(pad = PAD) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rects = [];
  const push = (l, t, r, b) => {
    if (r - l < 2 || b - t < 2 || b <= 56 || t >= vh || r <= 0 || l >= vw) return;
    rects.push([l - pad, t - pad, r + pad, b + pad]);
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const seen = new Map();
  let n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el) continue;
    let ok = seen.get(el);
    if (ok === undefined) {
      const cs = getComputedStyle(el);
      ok = !el.closest(SKIP) && cs.visibility !== "hidden" && cs.display !== "none";
      seen.set(el, ok);
    }
    if (!ok) continue;
    range.selectNodeContents(n);
    for (const q of range.getClientRects()) push(q.left, q.top, q.right, q.bottom);
  }
  document.querySelectorAll("main a, main button, section a, section button").forEach((el) => {
    if (el.closest(SKIP)) return;
    const q = el.getBoundingClientRect();
    push(q.left, q.top, q.right, q.bottom);
  });
  return rects;
}

// Occupancy grid with an integral image, so "is anything in this box" is O(1).
function buildGrid(rects) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const gw = Math.ceil(W / CELL) + 1;
  const gh = Math.ceil(H / CELL) + 1;
  const occ = new Uint8Array(gw * gh);
  for (const [l, t, r, b] of rects) {
    const c0 = Math.max(0, Math.floor(l / CELL));
    const c1 = Math.min(gw - 1, Math.floor(r / CELL));
    const r0 = Math.max(0, Math.floor(t / CELL));
    const r1 = Math.min(gh - 1, Math.floor(b / CELL));
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) occ[y * gw + x] = 1;
  }
  const sw = gw + 1;
  const sum = new Int32Array(sw * (gh + 1));
  for (let y = 0; y < gh; y++) {
    let row = 0;
    for (let x = 0; x < gw; x++) {
      row += occ[y * gw + x];
      sum[(y + 1) * sw + x + 1] = sum[y * sw + x + 1] + row;
    }
  }
  // Number of occupied cells under a viewport box.
  const score = (l, t, r, b) => {
    const c0 = Math.max(0, Math.floor(l / CELL));
    const c1 = Math.min(gw - 1, Math.floor(r / CELL));
    const r0 = Math.max(0, Math.floor(t / CELL));
    const r1 = Math.min(gh - 1, Math.floor(b / CELL));
    if (c1 < c0 || r1 < r0) return 0;
    return sum[(r1 + 1) * sw + c1 + 1] - sum[r0 * sw + c1 + 1] - sum[(r1 + 1) * sw + c0] + sum[r0 * sw + c0];
  };
  return { score };
}

// Occupied cells under a capsule (centre, half-segment, radius), conservatively as boxes along it.
function capScore(grid, c) {
  const co = Math.cos(c.ang || 0);
  const si = Math.sin(c.ang || 0);
  const ex = c.hx * co - c.hy * si;
  const ey = c.hx * si + c.hy * co;
  const len = Math.hypot(ex, ey) * 2;
  const rr = c.r * 0.95;
  const n = Math.max(1, Math.ceil(len / Math.max(4, rr * 0.8)));
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : (i / n) * 2 - 1;
    const px = c.x + ex * t;
    const py = c.y + ey * t;
    s += grid.score(px - rr, py - rr, px + rr, py + rr);
    if (s) return s;
  }
  return s;
}

const baseOf = (b) => b.base || { hx: b.hx, hy: b.hy, r: b.r };

const CUP_TRIES = [
  { fit: 1, out: 0 },
  { fit: 1, out: 0.3 },
  { fit: 0.8, out: 0.3 },
  { fit: 0.65, out: 0.5 },
  { fit: 0.5, out: 0.6 },
];
const SHAPE_TRIES = [
  { fit: 1, out: 0 },
  { fit: 0.7, out: 0 },
  { fit: 0.5, out: 0.3 },
  { fit: 0.35, out: 0.5 },
];

function colAt(b, x, y, fit) {
  const base = baseOf(b);
  return { x, y, hx: base.hx * fit, hy: base.hy * fit, ang: b.angT ?? b.ang ?? 0, r: base.r * fit };
}

function boundsFor(b, fit, out) {
  const keep = b.out;
  b.out = 0;
  const B = b.bounds();
  b.out = keep;
  const base = baseOf(b);
  const reach = (Math.abs(base.hx) + base.r) * fit * out;
  return { l: B.l - reach, r: B.r + reach, t: B.t, b: B.b };
}

// While the wipe covers the screen nobody can see a body travel: put it straight at its spot.
function jump(b, x, y) {
  b.x = x;
  b.y = y;
  b.vx = 0;
  b.vy = 0;
  b.goal = null;
  b.sx = NaN;
}

const clearOf = (b, grid, x, y, fit) => {
  if (capScore(grid, colAt(b, x, y, fit))) return false;
  const ex = b.extra?.(x, y);
  return !ex || !grid.score(ex[0], ex[1], ex[2], ex[3]);
};

function settleBodies(grid, instant) {
  let moved = 0;
  const bodies = world.bodies;
  const placed = bodies.filter((b) => b.dragging).map((b) => colAt(b, b.x, b.y, b.fitT ?? 1));
  const free = bodies.filter((b) => !b.dragging);
  free.sort((a, b) => (a.kind === "cup" ? 0 : 1) - (b.kind === "cup" ? 0 : 1));
  for (const b of free) {
    const tries = b.kind === "cup" ? CUP_TRIES : SHAPE_TRIES;
    const cur = b.goal || { x: b.x, y: b.y };
    const fitNow = b.fitT ?? 1;
    // Where it stands (or is heading) is fine: leave it, and let a shrunk body grow back if it fits.
    if (clearOf(b, grid, cur.x, cur.y, fitNow)) {
      if (fitNow < 1 && clearOf(b, grid, cur.x, cur.y, 1)) b.setFit?.(1, 0, instant);
      if (instant && b.goal) jump(b, cur.x, cur.y);
      placed.push(colAt(b, cur.x, cur.y, b.fitT ?? 1));
      continue;
    }
    moved++;
    let pick = null;
    for (const tr of tries) {
      const B = boundsFor(b, tr.fit, tr.out);
      let best = Infinity;
      for (let y = B.t; y <= B.b; y += CELL) {
        for (let x = B.l; x <= B.r; x += CELL) {
          const d = (x - cur.x) ** 2 + (y - cur.y) ** 2;
          if (d >= best) continue;
          if (!clearOf(b, grid, x, y, tr.fit)) continue;
          const c = colAt(b, x, y, tr.fit);
          if (placed.some((o) => capGap(c, o) < 4)) continue;
          best = d;
          pick = { x, y, ...tr };
        }
      }
      if (pick) break;
    }
    if (pick) {
      b.setFit?.(pick.fit, pick.out, instant);
      b.goal = { x: pick.x, y: pick.y };
      if (instant) jump(b, pick.x, pick.y);
      placed.push(colAt(b, pick.x, pick.y, pick.fit));
    } else if (b.kind !== "cup") {
      b.setFit?.(0, 0, instant); // nowhere to go without covering text: this shape sits out
    } else {
      // A cup that fits nowhere: smallest, tucked as far off the edge as allowed, least text under it.
      const tr = CUP_TRIES[CUP_TRIES.length - 1];
      const B = boundsFor(b, tr.fit, tr.out);
      let bestS = Infinity;
      let at = cur;
      for (let y = B.t; y <= B.b; y += CELL * 2) {
        for (let x = B.l; x <= B.r; x += CELL * 2) {
          const s = capScore(grid, colAt(b, x, y, tr.fit)) * 1000 + Math.hypot(x - cur.x, y - cur.y) * 0.01;
          if (s < bestS) {
            bestS = s;
            at = { x, y };
          }
        }
      }
      b.setFit?.(tr.fit, tr.out, instant);
      b.goal = at;
      if (instant) jump(b, at.x, at.y);
      placed.push(colAt(b, at.x, at.y, tr.fit));
    }
    world.wake();
  }
  return moved;
}

// Doodles: DOM marks that carry a nudge() handle. Visible ones that cover text move, shrink or hide.
const doodles = new Set();
export function registerDoodle(api) {
  doodles.add(api);
  return () => doodles.delete(api);
}

function settleDoodles(grid, instant) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const d of doodles) {
    const el = d.el();
    if (!el) continue;
    const q = d.rect();
    if (!q || q.width < 2 || q.bottom <= 56 || q.top >= vh || q.right <= 0 || q.left >= vw) continue;
    const st = d.state();
    const cx = (q.left + q.right) / 2;
    const cy = (q.top + q.bottom) / 2;
    const hw = q.width / 2 / st.fit;
    const hh = q.height / 2 / st.fit;
    const hits = (x, y, f) => grid.score(x - hw * f, y - hh * f, x + hw * f, y + hh * f) > 0;
    if (st.fit > 0 && !hits(cx, cy, st.fit)) {
      // Fine where it is; if its home spot is clear again, go home.
      if ((st.dx || st.dy || st.fit < 1) && !hits(cx - st.dx, cy - st.dy, 1)) d.set(0, 0, 1, instant);
      continue;
    }
    if (st.fit === 0 && !hits(cx - st.dx, cy - st.dy, 1)) {
      d.set(0, 0, 1, instant);
      continue;
    }
    const sec = el.closest("section")?.getBoundingClientRect();
    const box = { l: Math.max(0, sec?.left ?? 0), t: Math.max(56, sec?.top ?? 0), r: Math.min(vw, sec?.right ?? vw), b: Math.min(vh, sec?.bottom ?? vh) };
    const homeX = cx - st.dx;
    const homeY = cy - st.dy;
    let pick = null;
    for (const f of [1, 0.75, 0.55, 0.4]) {
      let best = Infinity;
      for (let y = box.t + hh * f; y <= box.b - hh * f; y += CELL) {
        for (let x = box.l + hw * f; x <= box.r - hw * f; x += CELL) {
          const dd = (x - homeX) ** 2 + (y - homeY) ** 2;
          if (dd < best && !hits(x, y, f)) {
            best = dd;
            pick = [x - homeX, y - homeY, f];
          }
        }
      }
      if (pick) break;
    }
    if (pick) d.set(pick[0], pick[1], pick[2], instant);
    else d.set(st.dx, st.dy, 0, instant);
  }
}

// What a pot parked at the pour pose would cover: occupied cells under its rotated box.
export function textUnder(corners) {
  const grid = buildGrid(collectText(PAD));
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return grid.score(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
}

let landedAt = -1e9;
export function settleAll() {
  const grid = buildGrid(collectText(PAD));
  const instant = performance.now() - landedAt < 450;
  const moved = settleBodies(grid, instant);
  settleDoodles(buildGrid(collectText(4)), instant);
  return moved;
}

let timers = [];
// A few passes in a row: text animates in, fonts swap, bodies push each other.
export function settleSoon(delays = [0, 450, 1200, 2600]) {
  timers.forEach(clearTimeout);
  timers = delays.map((d, i) =>
    setTimeout(() => {
      requestAnimationFrame(() => {
        // Keep checking while bodies were still being moved (they push each other about).
        if (settleAll() && i === delays.length - 1) chase(0);
      });
    }, d)
  );
}

function chase(n) {
  timers.push(
    setTimeout(() => {
      if (n < 6 && settleAll()) chase(n + 1);
    }, 700)
  );
}

export function installAvoid() {
  let rz = 0;
  const onResize = () => {
    clearTimeout(rz);
    rz = setTimeout(() => settleSoon([0, 500, 1500]), 180);
  };
  let sc = 0;
  const onScroll = () => {
    clearTimeout(sc);
    sc = setTimeout(() => settleSoon([0, 500, 1400]), 160);
  };
  const onLand = () => {
    landedAt = performance.now();
    settleAll();
    settleSoon([60, 400, 1200, 2400]);
  };
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pager:land", onLand);
  (document.fonts?.ready ?? Promise.resolve()).then(() => settleSoon([0, 600, 1800, 3500, 6000]));
  return () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pager:land", onLand);
    timers.forEach(clearTimeout);
  };
}
