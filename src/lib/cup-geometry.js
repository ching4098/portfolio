// Geometry for the interactive cup. Everything is in the cup's own viewBox (170 x 150).
// The liquid is the part of the bowl polygon below a world-horizontal line, so the surface
// stays level however far the cup is rotated.

export const CUP_VB = { w: 170, h: 150, ox: 85, oy: 93 };
export const RIM = { left: [30, 84], right: [138, 84] };

const SEGS = [
  [[30, 84], [28, 84], [118, 82], [138, 84]],
  [[138, 84], [140, 118], [128, 138], [84, 140]],
  [[84, 140], [42, 138], [30, 118], [30, 84]],
];

function bez([a, b, c, d], t) {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

const BOWL = [];
SEGS.forEach((seg) => {
  for (let i = 0; i < 14; i++) BOWL.push(bez(seg, i / 14));
});

function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}
const BOWL_AREA = area(BOWL);

// Keep the part of poly where dot(p, n) >= d.
function clip(poly, nx, ny, d, hits) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = a[0] * nx + a[1] * ny - d;
    const sb = b[0] * nx + b[1] * ny - d;
    if (sa >= 0) out.push(a);
    if (sa >= 0 !== sb >= 0) {
      const t = sa / (sa - sb);
      const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      out.push(p);
      if (hits) hits.push(p);
    }
  }
  return out;
}

const toPath = (poly) => (poly.length < 3 ? "" : `M${poly.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L")}Z`);

// World "down" expressed in cup-local coordinates for a cup rotated phi degrees clockwise.
function downOf(phi) {
  const r = (phi * Math.PI) / 180;
  return [Math.sin(r), Math.cos(r)];
}

let cacheKey = "";
let cache = { fill: "", surface: "" };

// level 0..1 -> SVG path data for the liquid body and for the crema line on its surface.
export function liquidPaths(level, phi) {
  const key = `${level.toFixed(4)}|${phi.toFixed(2)}`;
  if (key === cacheKey) return cache;
  cacheKey = key;
  if (level <= 0.001) return (cache = { fill: "", surface: "" });
  if (level >= 0.999) {
    return (cache = { fill: toPath(BOWL), surface: `M${RIM.left[0]} ${RIM.left[1]}L${RIM.right[0]} ${RIM.right[1]}` });
  }
  const [nx, ny] = downOf(phi);
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of BOWL) {
    const s = p[0] * nx + p[1] * ny;
    if (s < lo) lo = s;
    if (s > hi) hi = s;
  }
  const want = level * BOWL_AREA;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (area(clip(BOWL, nx, ny, mid)) > want) lo = mid;
    else hi = mid;
  }
  const hits = [];
  const poly = clip(BOWL, nx, ny, (lo + hi) / 2, hits);
  const surface = hits.length >= 2 ? `M${hits[0][0].toFixed(1)} ${hits[0][1].toFixed(1)}L${hits[1][0].toFixed(1)} ${hits[1][1].toFixed(1)}` : "";
  return (cache = { fill: toPath(poly), surface });
}

// How much the cup can hold at this tilt before the low lip spills (0..1).
export function capacityAt(phi) {
  const [nx, ny] = downOf(phi);
  const d = Math.max(RIM.left[0] * nx + RIM.left[1] * ny, RIM.right[0] * nx + RIM.right[1] * ny);
  return Math.min(1, area(clip(BOWL, nx, ny, d)) / BOWL_AREA);
}

// World position of a cup-local point. left/top is the cup box, k the px-per-unit scale.
export function worldPoint(p, phi, left, top, k) {
  const r = (phi * Math.PI) / 180;
  const dx = p[0] - CUP_VB.ox;
  const dy = p[1] - CUP_VB.oy;
  return [
    left + CUP_VB.ox * k + (dx * Math.cos(r) - dy * Math.sin(r)) * k,
    top + CUP_VB.oy * k + (dx * Math.sin(r) + dy * Math.cos(r)) * k,
  ];
}

// The rim point that is lower in the world, and the direction liquid leaves it.
export function lowLip(phi, left, top, k) {
  const a = worldPoint(RIM.left, phi, left, top, k);
  const b = worldPoint(RIM.right, phi, left, top, k);
  const useRight = b[1] >= a[1];
  const r = (phi * Math.PI) / 180;
  const sign = useRight ? 1 : -1;
  return { point: useRight ? b : a, dir: [Math.cos(r) * sign, Math.sin(r) * sign] };
}
