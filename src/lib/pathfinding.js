function reconstructPath(parent, goal) {
  const path = [goal];
  let cur = goal;
  while (parent[cur] != null) {
    cur = parent[cur];
    path.push(cur);
  }
  return path.reverse();
}

export function bfs(maze, start, goal) {
  const total = maze.cols * maze.rows;
  const parent = new Array(total).fill(null);
  const seen = new Array(total).fill(false);
  const visited = [];
  seen[start] = true;
  const queue = [start];
  let qi = 0;
  while (qi < queue.length) {
    const cur = queue[qi++];
    const frontier = queue.slice(qi);
    visited.push({ cell: cur, parent: parent[cur], frontier });
    if (cur === goal) break;
    for (const n of maze.neighborsOf(cur)) {
      if (seen[n]) continue;
      seen[n] = true;
      parent[n] = cur;
      queue.push(n);
    }
  }
  return { visited, path: reconstructPath(parent, goal) };
}

export function dijkstra(maze, start, goal) {
  const total = maze.cols * maze.rows;
  const dist = new Array(total).fill(Infinity);
  const parent = new Array(total).fill(null);
  const done = new Array(total).fill(false);
  dist[start] = 0;
  const visited = [];
  const pq = [start];

  while (pq.length) {
    let bi = 0;
    for (let i = 1; i < pq.length; i++) if (dist[pq[i]] < dist[pq[bi]]) bi = i;
    const cur = pq.splice(bi, 1)[0];
    if (done[cur]) continue;
    done[cur] = true;
    visited.push({ cell: cur, parent: parent[cur], frontier: pq.slice() });
    if (cur === goal) break;
    for (const n of maze.neighborsOf(cur)) {
      if (done[n]) continue;
      const nd = dist[cur] + 1;
      if (nd < dist[n]) {
        dist[n] = nd;
        parent[n] = cur;
        pq.push(n);
      }
    }
  }
  return { visited, path: reconstructPath(parent, goal) };
}

export function astar(maze, start, goal) {
  const total = maze.cols * maze.rows;
  const gScore = new Array(total).fill(Infinity);
  const parent = new Array(total).fill(null);
  const done = new Array(total).fill(false);
  const goalX = goal % maze.cols;
  const goalY = Math.floor(goal / maze.cols);
  const h = (cell) => Math.abs((cell % maze.cols) - goalX) + Math.abs(Math.floor(cell / maze.cols) - goalY);

  gScore[start] = 0;
  const visited = [];
  const open = [start];

  while (open.length) {
    let bi = 0;
    let bestF = gScore[open[0]] + h(open[0]);
    for (let i = 1; i < open.length; i++) {
      const f = gScore[open[i]] + h(open[i]);
      if (f < bestF) {
        bestF = f;
        bi = i;
      }
    }
    const cur = open.splice(bi, 1)[0];
    if (done[cur]) continue;
    done[cur] = true;
    visited.push({ cell: cur, parent: parent[cur], frontier: open.slice() });
    if (cur === goal) break;
    for (const n of maze.neighborsOf(cur)) {
      if (done[n]) continue;
      const ng = gScore[cur] + 1;
      if (ng < gScore[n]) {
        gScore[n] = ng;
        parent[n] = cur;
        open.push(n);
      }
    }
  }
  return { visited, path: reconstructPath(parent, goal) };
}
