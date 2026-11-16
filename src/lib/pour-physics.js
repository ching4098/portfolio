import { capacityLevel } from "@/lib/cup-geometry";

// Weir / Torricelli pouring. All in cup units (the 170 x 170 viewBox), 2D areas as volumes.
//   excess volume = how much more drink is in the cup than it can hold at this tilt
//   head          = excess volume spread over the lip width (height of the surface above the lip)
//   flow          = flowK * lipW * head^(3/2), with head capped for restricted lids
// A surface that has stopped climbing the lip (tiny head) settles back to the lip height.

export const HEAD_STOP = 0.3;
const TAIL_FLOW = 0.05; // fraction of a full cup per second, so an inverted cup finishes draining

export function pourState(g, level, psi) {
  const cap = capacityLevel(g, psi);
  const excess = level - cap;
  if (excess <= 0) return { cap, head: 0, flow: 0 };
  const head = (excess * g.volA) / g.lipW;
  if (head < HEAD_STOP) return { cap, head: 0, flow: 0, settle: true };
  let flow = g.flowK * g.lipW * Math.min(head, g.headMax) ** 1.5;
  if (cap === 0) flow = Math.max(flow, TAIL_FLOW * g.volA);
  return { cap, head, flow };
}

// Advance the level by dt seconds. Returns the new level plus the state that drove it.
export function pourStep(g, level, psi, dt) {
  const s = pourState(g, level, psi);
  if (s.settle) return { ...s, level: s.cap };
  if (s.flow <= 0) return { ...s, level };
  return { ...s, level: Math.max(s.cap, level - (s.flow * dt) / g.volA) };
}
