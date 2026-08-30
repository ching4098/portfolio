import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { generateMaze, randomOpenCellPair, mazeToWallGrid, cellPoint } from "@/lib/maze";
import { bfs, dijkstra, astar } from "@/lib/pathfinding";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const COLS = 16;
const ROWS = 10;
const TICK_MS = 170;
const GLIDE_S = 0.09;
const HOLD_MS = 2500;
const FRONTIER_CAP = 8;
const EASE = [0.16, 1, 0.3, 1];

const ALGOS = [
  { key: "bfs", label: "BFS", solve: bfs, dash: undefined, legendDash: undefined, grad: ["#e0a05e", "#7a3b18"] },
  { key: "dijkstra", label: "Dijkstra's", solve: dijkstra, dash: "1.2 1", legendDash: "4 3", grad: ["#7fa8cf", "#243b52"] },
  { key: "astar", label: "A*", solve: astar, dash: "0.3 0.9", legendDash: "1 2.5", grad: ["#d1738f", "#5c1f30"] },
];

export function AlgorithmRace() {
  const reduceMotion = usePrefersReducedMotion();
  const containerRef = useRef(null);
  const [inView, setInView] = useState(false);

  const maze = useMemo(() => generateMaze(COLS, ROWS), []);
  const wallGrid = useMemo(() => mazeToWallGrid(maze), [maze]);

  const makeRace = () => {
    const pair = randomOpenCellPair(maze);
    const results = {};
    for (const a of ALGOS) results[a.key] = a.solve(maze, pair.start, pair.goal);
    return { pair, results };
  };

  const [race, setRace] = useState(makeRace);
  const { pair, results } = race;

  const [reveal, setReveal] = useState({ bfs: 0, dijkstra: 0, astar: 0 });
  const [elapsed, setElapsed] = useState({ bfs: 0, dijkstra: 0, astar: 0 });
  const [doneAt, setDoneAt] = useState({ bfs: null, dijkstra: null, astar: null });
  const [pulseTick, setPulseTick] = useState(0);
  const raceStart = useRef(performance.now());

  function startNewRace() {
    setRace(makeRace());
    setReveal({ bfs: 0, dijkstra: 0, astar: 0 });
    setElapsed({ bfs: 0, dijkstra: 0, astar: 0 });
    setDoneAt({ bfs: null, dijkstra: null, astar: null });
    raceStart.current = performance.now();
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      const now = performance.now();
      setReveal({
        bfs: results.bfs.visited.length,
        dijkstra: results.dijkstra.visited.length,
        astar: results.astar.visited.length,
      });
      setDoneAt({ bfs: now, dijkstra: now, astar: now });
      return;
    }
    if (!inView) return;
    const t = setInterval(() => {
      setReveal((prev) => {
        const next = { ...prev };
        for (const a of ALGOS) {
          const total = results[a.key].visited.length;
          if (next[a.key] < total) next[a.key] += 1;
        }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [inView, results, reduceMotion]);

  useEffect(() => {
    setDoneAt((prevDone) => {
      const next = { ...prevDone };
      let changed = false;
      for (const a of ALGOS) {
        if (next[a.key] == null && reveal[a.key] >= results[a.key].visited.length) {
          next[a.key] = performance.now();
          changed = true;
        }
      }
      if (changed) setPulseTick((p) => p + 1);
      return changed ? next : prevDone;
    });
  }, [reveal, results]);

  useEffect(() => {
    const allDone = ALGOS.every((a) => doneAt[a.key] != null);
    if (!allDone) return;
    const t = setTimeout(startNewRace, HOLD_MS);
    return () => clearTimeout(t);
  }, [doneAt]);

  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(() => {
      setElapsed((prev) => {
        const next = { ...prev };
        for (const a of ALGOS) {
          const finishTime = doneAt[a.key];
          next[a.key] = ((finishTime ?? performance.now()) - raceStart.current) / 1000;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(t);
  }, [doneAt, reduceMotion]);

  const w = wallGrid.w;
  const h = wallGrid.h;
  const start = cellPoint(maze.cols, pair.start);
  const goal = cellPoint(maze.cols, pair.goal);

  return (
    <div ref={containerRef}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full text-ink">
        <defs>
          {ALGOS.map((a) => (
            <linearGradient key={a.key} id={`race-grad-${a.key}`} x1="0" y1="0" x2={w} y2={h} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={a.grad[0]} />
              <stop offset="100%" stopColor={a.grad[1]} />
            </linearGradient>
          ))}
        </defs>

        <g className="fill-current text-mist">
          {wallGrid.grid.map((open, i) =>
            open ? null : <rect key={i} x={i % w} y={Math.floor(i / w)} width={1} height={1} />
          )}
        </g>

        {ALGOS.map((a) => {
          const total = results[a.key].visited.length;
          const n = Math.min(reveal[a.key], total);
          const segs = [];
          for (let i = 1; i < n; i++) {
            const { cell, parent } = results[a.key].visited[i];
            if (parent == null) continue;
            const p1 = cellPoint(maze.cols, parent);
            const p2 = cellPoint(maze.cols, cell);
            segs.push(<line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} />);
          }
          const isDone = doneAt[a.key] != null;
          const active = !isDone ? results[a.key].visited[n] : null;
          const activePoint = active ? cellPoint(maze.cols, active.cell) : null;
          return (
            <g key={a.key}>
              <g opacity={0.55} stroke={`url(#race-grad-${a.key})`} strokeWidth={0.4} strokeDasharray={a.dash} fill="none">
                {segs}
              </g>
              {active &&
                (active.frontier ?? []).slice(0, FRONTIER_CAP).map((fc, fi) => {
                  const fp = cellPoint(maze.cols, fc);
                  return (
                    <motion.circle
                      key={`${n}-${fi}`}
                      cx={fp.x}
                      cy={fp.y}
                      r={0.26}
                      fill={a.grad[0]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      transition={{ duration: 0.15 }}
                    />
                  );
                })}
              {activePoint && (
                <motion.circle
                  initial={{ cx: activePoint.x, cy: activePoint.y }}
                  animate={{ cx: activePoint.x, cy: activePoint.y }}
                  transition={{ duration: GLIDE_S, ease: EASE }}
                  r={0.48}
                  fill="none"
                  stroke={a.grad[0]}
                  strokeWidth={0.26}
                />
              )}
              {isDone && (
                <motion.polyline
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  points={results[a.key].path.map((c) => {
                    const p = cellPoint(maze.cols, c);
                    return `${p.x},${p.y}`;
                  }).join(" ")}
                  fill="none"
                  stroke={`url(#race-grad-${a.key})`}
                  strokeWidth={0.65}
                />
              )}
            </g>
          );
        })}

        <circle cx={start.x} cy={start.y} r={0.55} className="fill-current" />
        <circle cx={goal.x} cy={goal.y} r={0.55} className="fill-current" />
        {pulseTick > 0 && (
          <motion.circle
            key={pulseTick}
            cx={goal.x}
            cy={goal.y}
            r={0.55}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fill-none stroke-current"
            strokeWidth={0.25}
          />
        )}
      </svg>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {ALGOS.map((a) => (
          <div key={a.key} className="flex items-center gap-2">
            <svg viewBox="0 0 24 4" className="h-1 w-6">
              <line x1="0" y1="2" x2="24" y2="2" stroke={a.grad[1]} strokeWidth="2" strokeDasharray={a.legendDash} />
            </svg>
            <span className="font-medium">{a.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {elapsed[a.key].toFixed(2)}s · {reveal[a.key]} cells
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
