const COLS = 26;
const ROWS = 34;

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => (v + 0.5) / 16));

function bodyDensity(c, r) {
  const rowTop = 7;
  const rowBottom = 23;
  if (r < rowTop || r > rowBottom) return 0;
  const t = (r - rowTop) / (rowBottom - rowTop);
  const topHalfWidth = 8;
  const bottomHalfWidth = 5.5;
  const halfWidth = topHalfWidth + (bottomHalfWidth - topHalfWidth) * t;
  const dx = Math.abs(c - 12);
  if (dx > halfWidth) return 0;
  const edgeFade = 1 - dx / halfWidth;
  return Math.min(1, 0.55 + 0.45 * edgeFade);
}

function baseDensity(c, r) {
  const rx = 10.5;
  const ry = 2.2;
  const dx = (c - 12) / rx;
  const dy = (r - 25) / ry;
  const d = dx * dx + dy * dy;
  if (d > 1) return 0;
  return Math.min(1, 0.5 + 0.5 * (1 - d));
}

function handleDensity(c, r) {
  const cx = 20.5;
  const cy = 15;
  const outerR = 5.2;
  const innerR = 3;
  const dx = c - cx;
  const dy = r - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > outerR || dist < innerR) return 0;
  if (dx < -1) return 0;
  return 0.85;
}

function densityAt(c, r) {
  return Math.max(bodyDensity(c, r), baseDensity(c, r), handleDensity(c, r));
}

const cells = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const density = densityAt(c, r);
    if (density <= 0) continue;
    if (density >= BAYER_4X4[r % 4][c % 4]) cells.push({ x: c, y: r });
  }
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const revealOrder = seededShuffle(cells.map((_, i) => i), 20260830);
const revealRank = new Array(cells.length);
revealOrder.forEach((cellIndex, rank) => {
  revealRank[cellIndex] = rank;
});

export const ditherPattern = { cols: COLS, rows: ROWS, cells, revealRank };
