// Geometry for the interactive cups. Every cup is drawn in the same 170 x 170 viewBox and owns a
// "cavity" path (the space the drink can occupy). The liquid is the part of that cavity below a
// world-horizontal line, so the surface stays level however far the cup is rotated.

import { CUPS } from "@/lib/cups";

export const CUP_VB = { w: 170, h: 170 };

const rad = (d) => (d * Math.PI) / 180;

function bez([a, b, c, d], t) {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

// Tiny parser for absolute M / L / C / Z path data -> polygon.
function parseCavity(d) {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  const pts = [];
  let cur = [0, 0];
  let i = 0;
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    const c = tok[i++];
    if (c === "M" || c === "L") {
      cur = [num(), num()];
      pts.push(cur);
    } else if (c === "C") {
      const p1 = [num(), num()];
      const p2 = [num(), num()];
      const p3 = [num(), num()];
      for (let s = 1; s <= 12; s++) pts.push(bez([cur, p1, p2, p3], s / 12));
      cur = p3;
    }
  }
  return pts;
}

function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(s) / 2;
}

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

// World "down" in cup-local coordinates for a cup rotated phi degrees clockwise.
function downOf(phi) {
  const r = rad(phi);
  return [Math.sin(r), Math.cos(r)];
}

// Level (0..1) -> area d such that area(clip(poly, n, d)) == want.
function solveSurface(poly, nx, ny, want) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of poly) {
    const s = p[0] * nx + p[1] * ny;
    if (s < lo) lo = s;
    if (s > hi) hi = s;
  }
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (area(clip(poly, nx, ny, mid)) > want) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const compiled = new Map();

// Everything the physics needs about one cup, computed once.
export function geomOf(id) {
  if (compiled.has(id)) return compiled.get(id);
  const def = CUPS.find((c) => c.id === id) || CUPS[0];
  const poly = parseCavity(def.cavity);
  const total = area(poly);
  const volA = total * def.fullFrac; // area that "level 1" stands for
  const lips = def.lips;

  // Capacity (in level units, can exceed 1) of the cup when the surface sits at the lowest lip,
  // for every whole degree of tilt. Index 0 is -180 degrees.
  const table = new Float32Array(361);
  for (let a = -180; a <= 180; a++) {
    const [nx, ny] = downOf(a);
    let d = -Infinity;
    for (const l of lips) d = Math.max(d, l.p[0] * nx + l.p[1] * ny);
    table[a + 180] = area(clip(poly, nx, ny, d)) / volA;
  }

  // Upright surface height for level 0..100.
  const levelYs = new Float32Array(101);
  let bottom = -Infinity;
  for (const p of poly) bottom = Math.max(bottom, p[1]);
  for (let i = 0; i <= 100; i++) {
    levelYs[i] = i === 0 ? bottom : solveSurface(poly, 0, 1, (i / 100) * volA);
  }

  const g = {
    id: def.id,
    def,
    poly,
    total,
    volA,
    table,
    levelYs,
    origin: def.origin,
    lips,
    lipW: def.lipW,
    flowK: def.flowK,
    headMax: def.headMax ?? Infinity,
    cache: { key: "", val: { fill: "", surface: "" } },
  };
  compiled.set(id, g);
  return g;
}

// How much the cup can hold at this tilt before the lowest lip spills, in level units.
// Under 1.5% counts as zero: that is just dregs clinging to the wall.
export function capacityLevel(g, psi) {
  let a = ((((psi + 180) % 360) + 360) % 360) - 180;
  if (a > 180) a = 180;
  const f = a + 180;
  const i = Math.min(359, Math.floor(f));
  const t = f - i;
  const v = g.table[i] * (1 - t) + g.table[i + 1] * t;
  return v < 0.015 ? 0 : v;
}

// Height of the upright surface for a level (0..1), in cup units.
export function levelY(g, level) {
  const f = Math.min(100, Math.max(0, level * 100));
  const i = Math.min(99, Math.floor(f));
  return g.levelYs[i] * (1 - (f - i)) + g.levelYs[i + 1] * (f - i);
}

// level 0..1 and the surface angle psi -> SVG path data for the liquid body and its surface line.
export function liquidPaths(g, level, psi) {
  const key = `${level.toFixed(4)}|${psi.toFixed(2)}`;
  if (key === g.cache.key) return g.cache.val;
  g.cache.key = key;
  if (level <= 0.001) return (g.cache.val = { fill: "", surface: "" });
  const [nx, ny] = downOf(psi);
  const d = solveSurface(g.poly, nx, ny, Math.min(level, 1) * g.volA);
  const hits = [];
  const poly = clip(g.poly, nx, ny, d, hits);
  const surface = hits.length >= 2 ? `M${hits[0][0].toFixed(1)} ${hits[0][1].toFixed(1)}L${hits[1][0].toFixed(1)} ${hits[1][1].toFixed(1)}` : "";
  return (g.cache.val = { fill: toPath(poly), surface });
}

// World position of a cup-local point. left/top is the cup box, k the px-per-unit scale.
export function worldPoint(g, p, phi, left, top, k) {
  const r = rad(phi);
  const [ox, oy] = g.origin;
  const dx = p[0] - ox;
  const dy = p[1] - oy;
  return [
    left + ox * k + (dx * Math.cos(r) - dy * Math.sin(r)) * k,
    top + oy * k + (dx * Math.sin(r) + dy * Math.cos(r)) * k,
  ];
}

// The lip that is lowest in the world, and the direction liquid leaves it (cup-local `out`, rotated).
export function lowLip(g, phi, left, top, k) {
  let best = null;
  for (const l of g.lips) {
    const w = worldPoint(g, l.p, phi, left, top, k);
    if (!best || w[1] > best.point[1]) best = { point: w, out: l.out };
  }
  const r = rad(phi);
  const [ox, oy] = best.out;
  return { point: best.point, dir: [ox * Math.cos(r) - oy * Math.sin(r), ox * Math.sin(r) + oy * Math.cos(r)] };
}

export const cupIndex = (id) => Math.max(0, CUPS.findIndex((c) => c.id === id));
