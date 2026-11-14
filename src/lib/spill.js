// Droplets, the pouring stream and coffee-ring stains. DOM nodes are a fixed pool created
// by React; this class only moves them with transform and opacity.

const G = 1900;
const rnd = (a, b) => a + Math.random() * (b - a);

export class Spill {
  constructor(root) {
    this.drops = [...root.querySelectorAll("[data-drop]")].map((el) => ({ el, on: false, x: 0, y: 0, vx: 0, vy: 0, t: 0, max: 1, landY: 0, stain: true, sz: 1 }));
    this.stains = [...root.querySelectorAll("[data-stain]")];
    this.streamEl = root.querySelector("[data-stream]");
    this.outer = root.querySelector("[data-stream-outer]");
    this.inner = root.querySelector("[data-stream-inner]");
    this.stream = null;
    this.acc = 0;
    this.stainT = 0;
    this.si = 0;
    this.live = 0;
    this.wake = null;
  }

  get busy() {
    return Boolean(this.stream) || this.live > 0;
  }

  setStream(s) {
    if (!s) {
      if (this.stream) {
        this.stream = null;
        this.streamEl.style.opacity = "0";
      }
      return;
    }
    if (!this.stream) {
      this.streamEl.style.opacity = "1";
      this.stainT = 0.05;
    }
    this.stream = s;
    this.wake?.();
  }

  drop(x, y, vx, vy, { landY, max = 2.6, stain = true, sz = 1 } = {}) {
    const d = this.drops.find((p) => !p.on);
    if (!d) return;
    Object.assign(d, { on: true, x, y, vx, vy, t: 0, max, landY, stain, sz });
    this.live++;
    this.wake?.();
  }

  splash(x, y, n = 3, up = 280) {
    for (let i = 0; i < n; i++) {
      this.drop(x, y, rnd(-110, 110), -up * rnd(0.4, 1), { landY: y + 10, max: 0.6, stain: false, sz: rnd(0.45, 0.85) });
    }
  }

  burst(x, y, dx, dy, n = 5) {
    const landY = Math.min(window.innerHeight - 4, y + window.innerHeight * 0.6);
    for (let i = 0; i < n; i++) {
      const sp = rnd(180, 460);
      this.drop(x, y, dx * sp + rnd(-90, 90), dy * sp - rnd(80, 260), { landY, sz: rnd(0.7, 1.2) });
    }
  }

  stainAt(x, y, w) {
    if (!this.stains.length) return;
    const el = this.stains[this.si++ % this.stains.length];
    const h = w * 0.4;
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0)`;
    const [fill, ring] = el.children;
    fill.getAnimations().forEach((a) => a.cancel());
    ring.getAnimations().forEach((a) => a.cancel());
    fill.animate(
      [
        { opacity: 0, transform: "scale(0.2)" },
        { opacity: 0.85, transform: "scale(1.1)", offset: 0.1 },
        { opacity: 0.7, transform: "scale(1)", offset: 0.22 },
        { opacity: 0, transform: "scale(1)" },
      ],
      { duration: 1700, easing: "ease-out", fill: "forwards" }
    );
    ring.animate(
      [
        { opacity: 0, transform: "scale(0.2)" },
        { opacity: 0.6, transform: "scale(1)", offset: 0.04 },
        { opacity: 0.42, transform: "scale(1)", offset: 0.4 },
        { opacity: 0, transform: "scale(1)" },
      ],
      { duration: 10500, easing: "linear", fill: "forwards" }
    );
  }

  update(dt) {
    const s = this.stream;
    if (s) {
      const { x0, y0, vx, vy, w, landY } = s;
      const disc = vy * vy + 2 * G * Math.max(0, landY - y0);
      const T = Math.max(0.06, (-vy + Math.sqrt(disc)) / G);
      const x2 = x0 + vx * T;
      const y2 = y0 + vy * T + 0.5 * G * T * T;
      const d = `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${(x0 + (vx * T) / 2).toFixed(1)} ${(y0 + (vy * T) / 2).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      this.outer.setAttribute("d", d);
      this.inner.setAttribute("d", d);
      this.outer.setAttribute("stroke-width", (w + 2.5).toFixed(1));
      this.inner.setAttribute("stroke-width", w.toFixed(1));
      this.acc += dt * 30;
      while (this.acc >= 1) {
        this.acc -= 1;
        const t = T * rnd(0.3, 1);
        this.drop(x0 + vx * t, y0 + vy * t + 0.5 * G * t * t, vx + rnd(-90, 90), vy + G * t + rnd(-30, 50), { landY, sz: rnd(0.6, 1.1) });
      }
      this.stainT -= dt;
      if (this.stainT <= 0) {
        this.stainT = 0.17;
        this.stainAt(x2 + rnd(-14, 14), Math.min(y2, landY), rnd(26, 62));
        this.splash(x2, y2, 2, 240);
      }
    }
    for (const d of this.drops) {
      if (!d.on) continue;
      d.vy += G * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.t += dt;
      if (d.y >= d.landY || d.t > d.max) {
        d.on = false;
        this.live--;
        d.el.style.opacity = "0";
        if (d.stain && d.y >= d.landY && Math.random() < 0.4) this.stainAt(d.x, d.landY, rnd(12, 26));
        continue;
      }
      const ang = (Math.atan2(d.vy, d.vx) * 180) / Math.PI - 90;
      const stretch = 1 + Math.min(1.2, Math.hypot(d.vx, d.vy) / 1100);
      d.el.style.transform = `translate3d(${d.x.toFixed(1)}px, ${d.y.toFixed(1)}px, 0) rotate(${ang.toFixed(0)}deg) scale(${d.sz}, ${(d.sz * stretch).toFixed(2)})`;
      d.el.style.opacity = d.max < 1 ? String(Math.max(0, 1 - d.t / d.max)) : "1";
    }
    return this.busy;
  }

  clear() {
    this.setStream(null);
    this.drops.forEach((d) => {
      d.on = false;
      d.el.style.opacity = "0";
    });
    this.live = 0;
  }
}
