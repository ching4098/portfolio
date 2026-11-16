import { capacityLevel } from "@/lib/cup-geometry";

// Weir / Torricelli pouring. All in cup units (the 170 x 170 viewBox), 2D areas as volumes.
//   excess volume = how much more drink is in the cup than it can hold at this tilt
//   head          = excess volume spread over the lip width (height of the surface above the lip)
//   flow          = flowK * lipW * head^(3/2), with head capped for restricted lids
// A surface that has stopped climbing the lip (tiny head) settles back to the lip height.
// Past ~90 degrees the cup is simply upside down: the weir flow blends into a "dump" that
// empties it in a fraction of a second (smoothstep from 90 to 104 degrees, so there is no step).

export const HEAD_STOP = 0.3;
const TAIL_FLOW = 0.05; // fraction of a full cup per second, so an inverted cup finishes draining
const DUMP_FROM = 90;
const DUMP_TO = 104;

const smooth = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

export function pourState(g, level, psi) {
  const cap = capacityLevel(g, psi);
  const excess = level - cap;
  if (excess <= 0) return { cap, head: 0, flow: 0, dw: 0 };
  const a = Math.abs((((psi + 180) % 360) + 360) % 360 - 180);
  const dw = smooth((a - DUMP_FROM) / (DUMP_TO - DUMP_FROM));
  let head = (excess * g.volA) / g.lipW;
  if (head < HEAD_STOP && dw < 0.02) return { cap, head: 0, flow: 0, settle: true, dw };
  let flow = head < HEAD_STOP ? 0 : g.flowK * g.lipW * Math.min(head, g.headMax) ** 1.5;
  if (dw > 0) {
    flow = Math.max(flow, dw * g.dumpRate * g.volA);
    head = Math.max(head, (flow / (g.flowK * g.lipW)) ** (2 / 3));
  }
  if (cap === 0) flow = Math.max(flow, TAIL_FLOW * g.volA);
  return { cap, head, flow, dw };
}

// Advance the level by dt seconds. Returns the new level plus the state that drove it.
export function pourStep(g, level, psi, dt) {
  const s = pourState(g, level, psi);
  if (s.settle) return { ...s, level: s.cap };
  if (s.flow <= 0) return { ...s, level };
  return { ...s, level: Math.max(s.cap, level - (s.flow * dt) / g.volA) };
}
