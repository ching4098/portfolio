// A tiny shared physics world for everything you can pick up: the cups and the background shapes.
// Every body is a capsule (a segment with a radius; a circle is a zero-length segment) in px.
// Dragged bodies are kinematic (they follow the pointer and push everything else away), released
// bodies keep their momentum with light friction, and overlaps are resolved by positional
// correction every frame so nothing ever rests inside something else.
// One rAF loop drives it, and other per-frame work (pouring, droplets) joins via `sims`.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const REST = 0.55;
const ITER = 4;
const MAX_SPEED = 3200;

const out = { c1x: 0, c1y: 0, c2x: 0, c2y: 0 };

// Closest points between segments p1-q1 and p2-q2 (Ericson, Real-Time Collision Detection).
function segSeg(p1x, p1y, q1x, q1y, p2x, p2y, q2x, q2y) {
  const d1x = q1x - p1x;
  const d1y = q1y - p1y;
  const d2x = q2x - p2x;
  const d2y = q2y - p2y;
  const rx = p1x - p2x;
  const ry = p1y - p2y;
  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  const f = d2x * rx + d2y * ry;
  let s = 0;
  let t = 0;
  if (a <= 1e-6 && e <= 1e-6) {
    s = 0;
    t = 0;
  } else if (a <= 1e-6) {
    t = clamp(f / e, 0, 1);
  } else {
    const c = d1x * rx + d1y * ry;
    if (e <= 1e-6) {
      s = clamp(-c / a, 0, 1);
    } else {
      const b = d1x * d2x + d1y * d2y;
      const denom = a * e - b * b;
      s = denom > 1e-9 ? clamp((b * f - c * e) / denom, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / a, 0, 1);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a, 0, 1);
      }
    }
  }
  out.c1x = p1x + d1x * s;
  out.c1y = p1y + d1y * s;
  out.c2x = p2x + d2x * t;
  out.c2y = p2y + d2y * t;
}

function ends(b) {
  const c = Math.cos(b.ang);
  const s = Math.sin(b.ang);
  const ex = b.hx * c - b.hy * s;
  const ey = b.hx * s + b.hy * c;
  return [b.x - ex, b.y - ey, b.x + ex, b.y + ey];
}

// Gap between two capsule-shaped things ({x, y, hx, hy, ang, r}); negative when they overlap.
export function capGap(a, b) {
  const [ax0, ay0, ax1, ay1] = ends({ ang: 0, hx: 0, hy: 0, ...a });
  const [bx0, by0, bx1, by1] = ends({ ang: 0, hx: 0, hy: 0, ...b });
  segSeg(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1);
  return Math.hypot(out.c2x - out.c1x, out.c2y - out.c1y) - a.r - b.r;
}

class World {
  constructor() {
    this.bodies = [];
    this.sims = new Set();
    this.reduce = false;
    this.raf = 0;
    this.running = false;
    this.last = 0;
    this.needsRelax = false;
    this.hits = [];
    this.tick = this.tick.bind(this);
  }

  add(b) {
    Object.assign(b, {
      vx: 0,
      vy: 0,
      ang: 0,
      hx: 0,
      hy: 0,
      damp: 2.4,
      goal: null,
      dragging: false,
      cool: 0,
      stall: 0,
      sx: NaN,
      sy: NaN,
      ...b,
    });
    b.invMass = 1 / b.mass;
    this.bodies.push(b);
    this.needsRelax = true;
    this.wake();
    return () => {
      this.bodies = this.bodies.filter((x) => x !== b);
    };
  }

  wake() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  startDrag(b, e) {
    if (b.dragging) return;
    const ox = b.x - e.clientX;
    const oy = b.y - e.clientY;
    const id = e.pointerId;
    b.dragging = true;
    b.goal = null;
    b.tx = b.x;
    b.ty = b.y;
    b.samples = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
    const move = (ev) => {
      if (ev.pointerId !== id) return;
      b.tx = ev.clientX + ox;
      b.ty = ev.clientY + oy;
      const t = performance.now();
      b.samples.push({ t, x: ev.clientX, y: ev.clientY });
      while (b.samples.length > 2 && t - b.samples[0].t > 100) b.samples.shift();
      this.wake();
    };
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const v = this.dragVel(b);
      b.dragging = false;
      b.samples = null;
      if (this.reduce) {
        b.vx = 0;
        b.vy = 0;
      } else {
        b.vx = v[0];
        b.vy = v[1];
      }
      b.onRelease?.(v);
      this.wake();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    b.onGrab?.();
    this.wake();
  }

  dragVel(b) {
    const s = b.samples;
    if (!s || s.length < 2) return [0, 0];
    const f = s[0];
    const l = s[s.length - 1];
    const dt = (l.t - f.t) / 1000;
    if (dt < 0.008 || performance.now() - l.t > 90) return [0, 0];
    let vx = (l.x - f.x) / dt;
    let vy = (l.y - f.y) / dt;
    const m = Math.hypot(vx, vy);
    if (m > MAX_SPEED) {
      vx *= MAX_SPEED / m;
      vy *= MAX_SPEED / m;
    }
    return [vx, vy];
  }

  // One contact between two bodies. Returns true when they were overlapping.
  contact(a, b, iter, relax) {
    let ia = a.invMass;
    let ib = b.invMass;
    if (relax) {
      if (a.kind !== b.kind) {
        if (a.kind === "cup") ia = 0;
        else ib = 0;
      }
    } else {
      if (a.dragging && iter < ITER - 1) ia = 0;
      if (b.dragging && iter < ITER - 1) ib = 0;
    }
    const sum = ia + ib;
    if (sum === 0) return false;
    const R = a.r + b.r;
    const ext = R + Math.abs(a.hx) + Math.abs(a.hy) + Math.abs(b.hx) + Math.abs(b.hy) + 2;
    if (Math.abs(a.x - b.x) > ext || Math.abs(a.y - b.y) > ext) return false;
    const [ax0, ay0, ax1, ay1] = ends(a);
    const [bx0, by0, bx1, by1] = ends(b);
    segSeg(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1);
    let dx = out.c2x - out.c1x;
    let dy = out.c2y - out.c1y;
    const dist = Math.hypot(dx, dy);
    if (dist >= R) return false;
    if (dist > 1e-5) {
      dx /= dist;
      dy /= dist;
    } else {
      dx = b.x - a.x;
      dy = b.y - a.y;
      const m = Math.hypot(dx, dy) || 1;
      dx /= m;
      dy /= m;
    }
    const corr = (R - dist) / sum;
    a.x -= dx * corr * ia;
    a.y -= dy * corr * ia;
    b.x += dx * corr * ib;
    b.y += dy * corr * ib;
    if (!relax && !this.reduce) {
      const vn = (b.vx - a.vx) * dx + (b.vy - a.vy) * dy;
      if (vn < 0) {
        const e = -vn > 60 ? REST : 0;
        const j = (-(1 + e) * vn) / sum;
        a.vx -= j * ia * dx;
        a.vy -= j * ia * dy;
        b.vx += j * ib * dx;
        b.vy += j * ib * dy;
        if (-vn > 140) this.hits.push([a, b, -vn, dx, dy]);
      }
    }
    return true;
  }

  clampBounds(b, bounce) {
    const B = b.bounds();
    let hit = 0;
    if (b.x < B.l) {
      b.x = B.l;
      if (b.vx < 0) {
        hit = Math.max(hit, -b.vx);
        b.vx = bounce ? -b.vx * REST : 0;
      }
    } else if (b.x > B.r) {
      b.x = B.r;
      if (b.vx > 0) {
        hit = Math.max(hit, b.vx);
        b.vx = bounce ? -b.vx * REST : 0;
      }
    }
    if (b.y < B.t) {
      b.y = B.t;
      if (b.vy < 0) {
        hit = Math.max(hit, -b.vy);
        b.vy = bounce ? -b.vy * REST : 0;
      }
    } else if (b.y > B.b) {
      b.y = B.b;
      if (b.vy > 0) {
        hit = Math.max(hit, b.vy);
        b.vy = bounce ? -b.vy * REST : 0;
      }
    }
    return hit;
  }

  relax() {
    const bs = this.bodies;
    for (const b of bs) this.clampBounds(b, false);
    for (let it = 0; it < 60; it++) {
      let any = false;
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (this.contact(bs[i], bs[j], 0, true)) any = true;
      for (const b of bs) this.clampBounds(b, false);
      if (!any) break;
    }
    for (const b of bs) b.sx = NaN;
  }

  // Everything overlapping gets pushed apart at once (reduced motion, window resize).
  resolveNow() {
    const bs = this.bodies;
    for (let it = 0; it < 30; it++) {
      let any = false;
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) if (this.contact(bs[i], bs[j], ITER - 1, false)) any = true;
      for (const b of bs) this.clampBounds(b, false);
      if (!any) break;
    }
  }

  tick(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    const bs = this.bodies;
    if (this.needsRelax) {
      this.needsRelax = false;
      this.relax();
    }

    // Eased properties (collider size / angle follow their targets).
    for (const b of bs) {
      if (b.rT !== undefined && Math.abs(b.rT - b.r) > 0.05) b.r += (b.rT - b.r) * Math.min(1, dt * 7);
      if (b.hxT !== undefined) {
        b.hx += (b.hxT - b.hx) * Math.min(1, dt * 7);
        b.hy += (b.hyT - b.hy) * Math.min(1, dt * 7);
      }
      if (b.angT !== undefined && Math.abs(b.angT - b.ang) > 0.002) b.ang += (b.angT - b.ang) * Math.min(1, dt * 7);
      if (b.cool > 0) b.cool -= dt;
    }

    // Plan the travel for this frame so fast bodies cannot skip over a neighbour.
    let travel = 0;
    for (const b of bs) {
      if (b.dragging) {
        const B = b.bounds();
        b.tx = clamp(b.tx, B.l, B.r);
        b.ty = clamp(b.ty, B.t, B.b);
        b.sx0 = b.x;
        b.sy0 = b.y;
        const v = this.dragVel(b);
        b.vx = v[0];
        b.vy = v[1];
        travel = Math.max(travel, Math.hypot(b.tx - b.x, b.ty - b.y));
      } else travel = Math.max(travel, Math.hypot(b.vx, b.vy) * dt);
    }
    const n = clamp(Math.ceil(travel / 10), 1, 12);
    const h = dt / n;
    this.hits.length = 0;
    const wallHits = [];

    for (let s = 0; s < n; s++) {
      for (const b of bs) {
        if (b.dragging) {
          b.x += (b.tx - b.x) / (n - s);
          b.y += (b.ty - b.y) / (n - s);
          continue;
        }
        if (b.goal) {
          if (this.reduce) {
            b.x = b.goal.x;
            b.y = b.goal.y;
            b.vx = 0;
            b.vy = 0;
          } else {
            b.vx += ((b.goal.x - b.x) * 70 - b.vx * 15) * h;
            b.vy += ((b.goal.y - b.y) * 70 - b.vy * 15) * h;
          }
        } else {
          const f = Math.exp(-b.damp * h);
          b.vx *= f;
          b.vy *= f;
        }
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > MAX_SPEED) {
          b.vx *= MAX_SPEED / sp;
          b.vy *= MAX_SPEED / sp;
        }
        b.x += b.vx * h;
        b.y += b.vy * h;
      }
      for (let it = 0; it < ITER; it++) {
        for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) this.contact(bs[i], bs[j], it, false);
        for (const b of bs) {
          if (b.dragging && it < ITER - 1) continue;
          const wh = this.clampBounds(b, !this.reduce && !b.dragging);
          if (wh > 260 && !b.dragging) wallHits.push([b, wh]);
        }
      }
    }

    // Hit callbacks, with a short cooldown so a body pressed against another does not chatter.
    for (const [a, b, speed, nx, ny] of this.hits) {
      if (a.cool <= 0) {
        a.cool = 0.14;
        a.hit?.({ speed, nx, ny, other: b });
      }
      if (b.cool <= 0) {
        b.cool = 0.14;
        b.hit?.({ speed, nx: -nx, ny: -ny, other: a });
      }
    }
    for (const [b, sp] of wallHits) {
      if (b.cool <= 0) {
        b.cool = 0.14;
        b.hit?.({ speed: sp, nx: 0, ny: 0, other: null });
      }
    }

    let busy = false;
    for (const b of bs) {
      if (b.dragging) {
        busy = true;
      } else if (b.goal) {
        const d = Math.hypot(b.goal.x - b.x, b.goal.y - b.y);
        const sp = Math.hypot(b.vx, b.vy);
        b.stall = sp < 25 ? b.stall + dt : 0;
        if ((d < 1.2 && sp < 12) || b.stall > 0.7 || this.reduce) {
          b.goal = null;
          b.stall = 0;
          b.vx = 0;
          b.vy = 0;
          b.onArrive?.();
        } else busy = true;
      } else {
        const sp = Math.hypot(b.vx, b.vy);
        if (sp < 5) {
          b.vx = 0;
          b.vy = 0;
        } else busy = true;
      }
      if (b.rT !== undefined && (Math.abs(b.rT - b.r) > 0.05 || Math.abs(b.hxT - b.hx) > 0.05 || Math.abs(b.hyT - b.hy) > 0.05)) busy = true;
      if (b.angT !== undefined && Math.abs(b.angT - b.ang) > 0.002) busy = true;
      if (b.x !== b.sx || b.y !== b.sy || b.dragging || b.vx || b.vy) {
        b.sx = b.x;
        b.sy = b.y;
        b.sync?.();
      }
    }
    for (const s of this.sims) if (s.step(dt)) busy = true;

    if (busy) this.raf = requestAnimationFrame(this.tick);
    else this.running = false;
  }
}

export const world = new World();
if (import.meta.env.DEV && typeof window !== "undefined") window.__world = world; // dev-only handle for debugging and tests
