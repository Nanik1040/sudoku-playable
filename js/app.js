(function () {
  const { DIFFICULTIES, cloneGrid, emptyNotes, conflicts, newPuzzle } = SudokuEngine;

  const boardEl = document.getElementById("board");
  const numsEl = document.getElementById("nums");
  const statusEl = document.getElementById("status");
  const timerEl = document.getElementById("timer");
  const solvedEl = document.getElementById("solved");
  const bootEl = document.getElementById("boot");
  const winEl = document.getElementById("win");
  const winCopyEl = document.getElementById("win-copy");
  const notesBtn = document.getElementById("notes-btn");
  const padHintEl = document.getElementById("pad-hint");

  const state = {
    difficulty: "easy",
    size: 9,
    puzzle: null,
    solution: null,
    grid: null,
    notes: null,
    selected: null,
    noteMode: false,
    startedAt: 0,
    elapsedMs: 0,
    running: false,
    won: false,
    puzzlesSolved: 0,
    timerId: null,
  };

  function formatTime(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function nowElapsed() {
    if (!state.running) return state.elapsedMs;
    return state.elapsedMs + (Date.now() - state.startedAt);
  }

  function tick() {
    timerEl.textContent = formatTime(nowElapsed());
  }

  function startTimer() {
    if (state.running || state.won) return;
    state.running = true;
    state.startedAt = Date.now();
    if (!state.timerId) state.timerId = setInterval(tick, 250);
  }

  function pauseTimer() {
    if (!state.running) return;
    state.elapsedMs = nowElapsed();
    state.running = false;
    state.startedAt = 0;
    tick();
  }

  function snapshot() {
    return {
      difficulty: state.difficulty,
      size: state.size,
      puzzle: state.puzzle,
      solution: state.solution,
      grid: state.grid,
      notes: state.notes,
      elapsedMs: nowElapsed(),
      won: state.won,
      puzzlesSolved: state.puzzlesSolved,
    };
  }

  function persist() {
    Playables.saveData(snapshot());
  }

  function restore(saved) {
    if (!saved || !saved.puzzle || !saved.grid) return false;
    state.difficulty = saved.difficulty || "easy";
    state.size = saved.size || saved.puzzle.length;
    state.puzzle = saved.puzzle;
    state.solution = saved.solution;
    state.grid = saved.grid;
    state.notes = saved.notes || emptyNotes(state.size);
    state.elapsedMs = saved.elapsedMs || 0;
    state.won = !!saved.won;
    state.puzzlesSolved = saved.puzzlesSolved || 0;
    state.running = false;
    state.selected = null;
    document.querySelectorAll(".levels button").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.difficulty === state.difficulty));
    });
    return true;
  }

  function setStatus(text, isWin) {
    statusEl.textContent = text;
    statusEl.classList.toggle("win", !!isWin);
  }

  function setNoteMode(on) {
    state.noteMode = on;
    notesBtn.setAttribute("aria-pressed", String(on));
    numsEl.classList.toggle("note-mode", on);
    padHintEl.classList.toggle("note-on", on);
    padHintEl.textContent = on
      ? "Pencil is on. Tap a cell, then numbers — those stay as small guesses, not the answer."
      : "Tap a cell, then a number to fill it. Pencil notes are for maybe-numbers.";
    if (!state.won) {
      setStatus(
        on
          ? "Pencil on. Numbers you tap are guesses. Tap Pencil again when you know the answer."
          : "Pencil off. Numbers you tap fill the cell.",
      );
    }
  }

  function isGiven(r, c) {
    return state.puzzle[r][c] !== 0;
  }

  function highlightValue() {
    if (!state.selected) return 0;
    const [r, c] = state.selected;
    return state.grid[r][c];
  }

  function renderBoard() {
    const size = state.size;
    const box = size === 9 ? 3 : 2;
    boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
    boardEl.innerHTML = "";
    const hv = highlightValue();
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        const value = state.grid[r][c];
        if (isGiven(r, c)) btn.classList.add("given");
        if (state.selected && state.selected[0] === r && state.selected[1] === c) {
          btn.classList.add("selected");
        }
        if (hv && value === hv) btn.classList.add("same");
        if (value && conflicts(state.grid, size, r, c, value)) btn.classList.add("conflict");
        const thick = [];
        if (c % box === 0) thick.push("border-left: 2px solid var(--line-strong)");
        if (r % box === 0) thick.push("border-top: 2px solid var(--line-strong)");
        if (c === size - 1) thick.push("border-right: 2px solid var(--line-strong)");
        if (r === size - 1) thick.push("border-bottom: 2px solid var(--line-strong)");
        if (thick.length) btn.style.cssText += thick.join(";");
        if (value) {
          btn.textContent = String(value);
        } else if (state.notes[r][c].length) {
          const notes = document.createElement("div");
          notes.className = "notes";
          notes.style.gridTemplateColumns = `repeat(${size === 9 ? 3 : 2}, 1fr)`;
          notes.style.gridTemplateRows = `repeat(${size === 9 ? 3 : 2}, 1fr)`;
          for (let n = 1; n <= size; n++) {
            const span = document.createElement("span");
            span.textContent = state.notes[r][c].includes(n) ? String(n) : "";
            notes.appendChild(span);
          }
          btn.appendChild(notes);
        }
        btn.setAttribute("aria-label", `Row ${r + 1} column ${c + 1}${value ? `, ${value}` : ""}`);
        boardEl.appendChild(btn);
      }
    }
  }

  function renderNums() {
    numsEl.classList.toggle("size-4", state.size === 4);
    numsEl.innerHTML = "";
    for (let n = 1; n <= state.size; n++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = String(n);
      btn.dataset.n = String(n);
      numsEl.appendChild(btn);
    }
  }

  function checkWin() {
    const size = state.size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (state.grid[r][c] !== state.solution[r][c]) return false;
      }
    }
    return true;
  }

  function celebrate() {
    if (state.won) return;
    state.won = true;
    pauseTimer();
    state.puzzlesSolved += 1;
    solvedEl.textContent = `${state.puzzlesSolved} solved`;
    setStatus("Puzzle complete.", true);
    winCopyEl.textContent = `Finished in ${formatTime(state.elapsedMs)}. ${state.puzzlesSolved} puzzle${state.puzzlesSolved === 1 ? "" : "s"} solved.`;
    winEl.classList.add("show");
    persist();
    Playables.sendScore(state.puzzlesSolved);
  }

  function selectCell(r, c) {
    state.selected = [r, c];
    if (!state.won) startTimer();
    renderBoard();
  }

  function enterNumber(n) {
    if (state.won) return;
    if (!state.selected) {
      setStatus(
        state.noteMode
          ? "Tap an empty cell first, then a number to mark a guess."
          : "Tap a cell first, then a number.",
      );
      return;
    }
    const [r, c] = state.selected;
    if (isGiven(r, c)) {
      setStatus("That cell is given. Pick an empty one.");
      return;
    }
    startTimer();
    if (state.noteMode) {
      const list = state.notes[r][c];
      const i = list.indexOf(n);
      if (i >= 0) list.splice(i, 1);
      else list.push(n);
      list.sort((a, b) => a - b);
      state.grid[r][c] = 0;
      setStatus(
        list.length
          ? "Guess marked. Turn Pencil off when you want to fill the cell."
          : "Guess removed.",
      );
    } else {
      state.grid[r][c] = state.grid[r][c] === n ? 0 : n;
      state.notes[r][c] = [];
    }
    renderBoard();
    persist();
    if (!state.noteMode && checkWin()) celebrate();
  }

  function erase() {
    if (state.won || !state.selected) return;
    const [r, c] = state.selected;
    if (isGiven(r, c)) return;
    state.grid[r][c] = 0;
    state.notes[r][c] = [];
    renderBoard();
    persist();
  }

  function hint() {
    if (state.won) return;
    const empties = [];
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        if (state.grid[r][c] === 0) empties.push([r, c]);
      }
    }
    if (!empties.length) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    state.grid[r][c] = state.solution[r][c];
    state.notes[r][c] = [];
    state.selected = [r, c];
    startTimer();
    renderBoard();
    persist();
    if (checkWin()) celebrate();
  }

  function checkBoard() {
    let wrong = 0;
    let empty = 0;
    for (let r = 0; r < state.size; r++) {
      for (let c = 0; c < state.size; c++) {
        const v = state.grid[r][c];
        if (!v) empty += 1;
        else if (v !== state.solution[r][c]) wrong += 1;
      }
    }
    if (wrong === 0 && empty === 0) {
      celebrate();
      return;
    }
    if (wrong === 0) setStatus(empty === 1 ? "1 empty cell left." : `${empty} empty cells left.`);
    else setStatus(wrong === 1 ? "1 cell is wrong." : `${wrong} cells are wrong.`);
  }

  function startNew(difficulty, force) {
    if (!force && state.grid && !state.won) {
      const filled = state.grid.flat().some((v, i) => v !== 0 && v !== state.puzzle.flat()[i]);
      if (filled && !window.confirm("Start a new puzzle? Current progress is saved over.")) {
        return;
      }
    }
    const pack = newPuzzle(difficulty);
    state.difficulty = pack.difficulty;
    state.size = pack.size;
    state.puzzle = pack.puzzle;
    state.solution = pack.solution;
    state.grid = cloneGrid(pack.puzzle);
    state.notes = emptyNotes(pack.size);
    state.selected = null;
    state.elapsedMs = 0;
    state.running = false;
    state.won = false;
    winEl.classList.remove("show");
    setStatus("Fill the grid. Each row, column, and box uses every number once.");
    renderNums();
    renderBoard();
    tick();
    persist();
  }

  function wire() {
    document.querySelectorAll(".levels button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".levels button").forEach((b) => {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        startNew(btn.dataset.difficulty);
      });
    });

    boardEl.addEventListener("click", (event) => {
      const cell = event.target.closest(".cell");
      if (!cell) return;
      selectCell(Number(cell.dataset.r), Number(cell.dataset.c));
    });

    numsEl.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (!btn) return;
      enterNumber(Number(btn.dataset.n));
    });

    notesBtn.addEventListener("click", () => {
      setNoteMode(!state.noteMode);
    });
    document.getElementById("erase-btn").addEventListener("click", erase);
    document.getElementById("hint-btn").addEventListener("click", hint);
    document.getElementById("check-btn").addEventListener("click", checkBoard);
    document.getElementById("new-btn").addEventListener("click", () => startNew(state.difficulty));
    document.getElementById("win-again").addEventListener("click", () => startNew(state.difficulty, true));

    document.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key >= "1" && event.key <= String(state.size)) {
        enterNumber(Number(event.key));
        event.preventDefault();
      } else if (event.key === "Backspace" || event.key === "Delete") {
        erase();
        event.preventDefault();
      } else if (event.key === "n" || event.key === "N") {
        setNoteMode(!state.noteMode);
      } else if (state.selected && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        const [r, c] = state.selected;
        const d = {
          ArrowUp: [-1, 0],
          ArrowDown: [1, 0],
          ArrowLeft: [0, -1],
          ArrowRight: [0, 1],
        }[event.key];
        selectCell(
          Math.max(0, Math.min(state.size - 1, r + d[0])),
          Math.max(0, Math.min(state.size - 1, c + d[1])),
        );
        event.preventDefault();
      }
    });

    Playables.onPause(pauseTimer);
    Playables.onResume(() => {
      if (!state.won && state.grid) startTimer();
    });
  }

  async function boot() {
    Playables.firstFrameReady();
    wire();
    const saved = await Playables.loadData();
    if (saved && restore(saved)) {
      renderNums();
      renderBoard();
      solvedEl.textContent = `${state.puzzlesSolved} solved`;
      tick();
      setStatus(state.won ? "Puzzle complete. Start a new one when you want." : "Welcome back.");
    } else {
      startNew("easy", true);
    }
    bootEl.classList.add("hidden");
    Playables.gameReady();
  }

  boot();
})();
