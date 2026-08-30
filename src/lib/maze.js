const DIRS = [
  { dx: 0, dy: -1, open: "N", opposite: "S" },
  { dx: 1, dy: 0, open: "E", opposite: "W" },
  { dx: 0, dy: 1, open: "S", opposite: "N" },
  { dx: -1, dy: 0, open: "W", opposite: "E" },
];

function idx(cols, x, y) {
  return y * cols + x;
}

export function generateMaze(cols, rows) {
  const cells = Array.from({ length: cols * rows }, () => ({ N: false, E: false, S: false, W: false }));
  const visited = new Array(cols * rows).fill(false);
  const startX = Math.floor(Math.random() * cols);
  const startY = Math.floor(Math.random() * rows);
  visited[idx(cols, startX, startY)] = true;

  const frontier = [];
  function addFrontier(x, y) {
    for (const d of DIRS) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
      if (visited[idx(cols, nx, ny)]) continue;
      frontier.push({ x, y, nx, ny, dir: d });
    }
  }
  addFrontier(startX, startY);

  while (frontier.length) {
    const i = Math.floor(Math.random() * frontier.length);
    const { x, y, nx, ny, dir } = frontier.splice(i, 1)[0];
    const toIndex = idx(cols, nx, ny);
    if (visited[toIndex]) continue;
    cells[idx(cols, x, y)][dir.open] = true;
    cells[toIndex][dir.opposite] = true;
    visited[toIndex] = true;
    addFrontier(nx, ny);
  }

  const braidChance = 0.07;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      for (const d of [DIRS[1], DIRS[2]]) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
        const a = idx(cols, x, y);
        if (cells[a][d.open]) continue;
        if (Math.random() < braidChance) {
          cells[a][d.open] = true;
          cells[idx(cols, nx, ny)][d.opposite] = true;
        }
      }
    }
  }

  function neighborsOf(cellIndex) {
    const x = cellIndex % cols;
    const y = Math.floor(cellIndex / cols);
    const result = [];
    for (const d of DIRS) {
      if (!cells[cellIndex][d.open]) continue;
      result.push(idx(cols, x + d.dx, y + d.dy));
    }
    return result;
  }

  return { cols, rows, cells, neighborsOf };
}

export function randomOpenCellPair(maze) {
  const total = maze.cols * maze.rows;
  const start = Math.floor(Math.random() * total);
  let goal = Math.floor(Math.random() * total);
  while (goal === start) goal = Math.floor(Math.random() * total);
  return { start, goal };
}

export function mazeToWallGrid(maze) {
  const w = maze.cols * 2 + 1;
  const h = maze.rows * 2 + 1;
  const grid = new Array(w * h).fill(false);
  for (let y = 0; y < maze.rows; y++) {
    for (let x = 0; x < maze.cols; x++) {
      const gx = x * 2 + 1;
      const gy = y * 2 + 1;
      grid[gy * w + gx] = true;
      const cell = maze.cells[idx(maze.cols, x, y)];
      if (cell.E) grid[gy * w + (gx + 1)] = true;
      if (cell.S) grid[(gy + 1) * w + gx] = true;
    }
  }
  return { w, h, grid };
}

export function cellPoint(cols, cell) {
  const x = cell % cols;
  const y = Math.floor(cell / cols);
  return { x: x * 2 + 1, y: y * 2 + 1 };
}
