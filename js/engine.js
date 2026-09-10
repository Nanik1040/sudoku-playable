(function (global) {
  const DIFFICULTIES = {
    mini: { id: "mini", size: 4, clues: 10, label: "4×4" },
    easy: { id: "easy", size: 9, clues: 38, label: "Easy" },
    medium: { id: "medium", size: 9, clues: 30, label: "Medium" },
    hard: { id: "hard", size: 9, clues: 26, label: "Hard" },
  };

  function boxOf(size) {
    return size === 9 ? 3 : 2;
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.slice());
  }

  function emptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(0));
  }

  function isValid(grid, size, row, col, value) {
    for (let i = 0; i < size; i++) {
      if (grid[row][i] === value || grid[i][col] === value) return false;
    }
    const box = boxOf(size);
    const br = Math.floor(row / box) * box;
    const bc = Math.floor(col / box) * box;
    for (let r = 0; r < box; r++) {
      for (let c = 0; c < box; c++) {
        if (grid[br + r][bc + c] === value) return false;
      }
    }
    return true;
  }

  function filledGrid(size) {
    const box = boxOf(size);
    const nums = shuffle([...Array(size).keys()]);
    const bandOrder = shuffle([...Array(box).keys()]);
    const stackOrder = shuffle([...Array(box).keys()]);
    const rows = [];
    const cols = [];
    for (const band of bandOrder) {
      for (const inner of shuffle([...Array(box).keys()])) {
        rows.push(band * box + inner);
      }
    }
    for (const stack of stackOrder) {
      for (const inner of shuffle([...Array(box).keys()])) {
        cols.push(stack * box + inner);
      }
    }
    const grid = emptyGrid(size);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const pr = rows[r];
        const pc = cols[c];
        grid[r][c] = nums[(box * (pr % box) + Math.floor(pr / box) + pc) % size] + 1;
      }
    }
    return grid;
  }

  function findEmpty(grid, size) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  function countSolutions(grid, size, limit) {
    const g = cloneGrid(grid);
    let count = 0;
    function solve() {
      if (count >= limit) return;
      const pos = findEmpty(g, size);
      if (!pos) {
        count += 1;
        return;
      }
      const [r, c] = pos;
      for (let v = 1; v <= size; v++) {
        if (isValid(g, size, r, c, v)) {
          g[r][c] = v;
          solve();
          g[r][c] = 0;
          if (count >= limit) return;
        }
      }
    }
    solve();
    return count;
  }

  function carvePuzzle(solution, clues) {
    const size = solution.length;
    const puzzle = cloneGrid(solution);
    const cells = shuffle(
      Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size]),
    );
    let remaining = size * size;
    const started = Date.now();
    for (const [r, c] of cells) {
      if (remaining <= clues) break;
      if (Date.now() - started > 250) break;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;
      remaining -= 1;
      if (countSolutions(puzzle, size, 2) !== 1) {
        puzzle[r][c] = backup;
        remaining += 1;
      }
    }
    return puzzle;
  }

  function conflicts(grid, size, row, col, value) {
    if (!value) return false;
    for (let i = 0; i < size; i++) {
      if (i !== col && grid[row][i] === value) return true;
      if (i !== row && grid[i][col] === value) return true;
    }
    const box = boxOf(size);
    const br = Math.floor(row / box) * box;
    const bc = Math.floor(col / box) * box;
    for (let r = 0; r < box; r++) {
      for (let c = 0; c < box; c++) {
        const rr = br + r;
        const cc = bc + c;
        if ((rr !== row || cc !== col) && grid[rr][cc] === value) return true;
      }
    }
    return false;
  }

  function newPuzzle(difficultyId) {
    const spec = DIFFICULTIES[difficultyId] || DIFFICULTIES.easy;
    const solution = filledGrid(spec.size);
    const puzzle = carvePuzzle(solution, spec.clues);
    return {
      difficulty: spec.id,
      size: spec.size,
      puzzle,
      solution,
    };
  }

  function emptyNotes(size) {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => []),
    );
  }

  global.SudokuEngine = {
    DIFFICULTIES,
    boxOf,
    cloneGrid,
    emptyNotes,
    conflicts,
    newPuzzle,
  };
})(window);
