/* ============================================================
   DAA Backtracking Solver — Frontend Logic
   ============================================================ */

// ── TOAST ────────────────────────────────────────────────────
function showToast(msg, type = "info", duration = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add("hidden"), duration);
}

// ── TABS ─────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ── SPEED HELPER ─────────────────────────────────────────────
function getDelay(sliderId) {
  const v = parseInt(document.getElementById(sliderId).value);
  const map = { 1: 600, 2: 300, 3: 120, 4: 40, 5: 8 };
  return map[v] || 120;
}

/* ============================================================
   SUDOKU
   ============================================================ */
let sudokuOriginal = [];
let sudokuSteps    = [];
let sudokuIdx      = 0;
let sudokuTimer    = null;
let sudokuPaused   = false;
let sudokuResult   = null;

const PRESETS = {
  easy: [
    [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9]
  ],
  medium: [
    [0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],[1,9,0,0,0,4,5,0,0],
    [8,2,0,1,0,0,0,4,0],[0,0,4,6,0,2,9,0,0],[0,5,0,0,0,3,0,2,8],
    [0,0,9,3,0,0,0,7,4],[0,4,0,0,5,0,0,3,6],[7,0,3,0,1,8,0,0,0]
  ],
  hard: [
    [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,3,0,8,5],[0,0,1,0,2,0,0,0,0],
    [0,0,0,5,0,7,0,0,0],[0,0,4,0,0,0,1,0,0],[0,9,0,0,0,0,0,0,0],
    [5,0,0,0,0,0,0,7,3],[0,0,2,0,1,0,0,0,0],[0,0,0,0,4,0,0,0,9]
  ]
};

function buildSudokuGrid(grid) {
  const container = document.getElementById("sudoku-grid");
  container.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "s-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.id = `sc-${r}-${c}`;
      if (grid[r][c] !== 0) {
        cell.textContent = grid[r][c];
        cell.classList.add("given");
      }
      container.appendChild(cell);
    }
  }
}

function renderSudokuBoard(board, highlightRow, highlightCol, type) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.getElementById(`sc-${r}-${c}`);
      if (!cell) continue;
      cell.textContent = board[r][c] !== 0 ? board[r][c] : "";
      // Re-apply given style
      if (sudokuOriginal[r][c] !== 0) {
        cell.className = "s-cell given";
        continue;
      }
      cell.className = "s-cell";
      if (r === highlightRow && c === highlightCol) {
        cell.classList.add(type === "place" ? "placed" : "backtrack");
      } else if (board[r][c] !== 0) {
        cell.classList.add("placed");
      }
    }
  }
}

function renderSudokuSolved(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.getElementById(`sc-${r}-${c}`);
      if (!cell) continue;
      cell.textContent = board[r][c] !== 0 ? board[r][c] : "";
      if (sudokuOriginal[r][c] !== 0) {
        cell.className = "s-cell given";
      } else {
        cell.className = "s-cell solved";
      }
    }
  }
}

function updateSudokuStats(stats) {
  document.getElementById("s-calls").textContent  = stats.recursive_calls.toLocaleString();
  document.getElementById("s-pruned").textContent = stats.pruned_branches.toLocaleString();
  document.getElementById("s-depth").textContent  = stats.max_depth;
  document.getElementById("s-time").textContent   = stats.time_ms + " ms";
}

function logSudokuStep(step, idx) {
  const log = document.getElementById("sudoku-log");
  const entry = document.createElement("div");
  entry.className = `log-entry ${step.type}`;
  if (step.type === "place") {
    entry.textContent = `#${idx+1} PLACE  [${step.row},${step.col}] = ${step.num}   depth:${step.depth}`;
  } else {
    entry.textContent = `#${idx+1} BACKTRACK [${step.row},${step.col}] ≠ ${step.num}   depth:${step.depth}`;
  }
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function playSudokuStep(i) {
  if (i >= sudokuSteps.length) {
    clearInterval(sudokuTimer);
    renderSudokuSolved(sudokuResult.board);
    showToast("✓ Sudoku Solved!", "success");
    document.getElementById("sudoku-solve-btn").disabled = false;
    return;
  }
  const step = sudokuSteps[i];
  renderSudokuBoard(step.board, step.row, step.col, step.type);
  logSudokuStep(step, i);
  document.getElementById("current-step").textContent = i + 1;
  sudokuIdx = i + 1;
}

function startSudokuAnimation() {
  if (sudokuTimer) clearInterval(sudokuTimer);
  sudokuTimer = setInterval(() => {
    if (!sudokuPaused) {
      playSudokuStep(sudokuIdx);
    }
  }, getDelay("speed-slider"));
}

// Preset buttons
let currentDifficulty = "easy";
document.querySelectorAll(".preset-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDifficulty = btn.dataset.difficulty;
    loadPreset(currentDifficulty);
  });
});

function loadPreset(difficulty) {
  const grid = PRESETS[difficulty];
  sudokuOriginal = grid.map(r => [...r]);
  buildSudokuGrid(grid);
  resetSudokuState();
}

function resetSudokuState() {
  if (sudokuTimer) clearInterval(sudokuTimer);
  sudokuSteps = []; sudokuIdx = 0; sudokuPaused = false; sudokuResult = null;
  document.getElementById("sudoku-playback").classList.add("hidden");
  document.getElementById("sudoku-solve-btn").disabled = false;
  document.getElementById("current-step").textContent = "0";
  document.getElementById("total-steps").textContent = "0";
  document.getElementById("sudoku-log").innerHTML = "";
  ["s-calls","s-pruned","s-depth","s-time"].forEach(id => document.getElementById(id).textContent = "—");
}

document.getElementById("sudoku-solve-btn").addEventListener("click", async () => {
  resetSudokuState();
  buildSudokuGrid(sudokuOriginal);
  const btn = document.getElementById("sudoku-solve-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Solving…';
  const useMRV = document.getElementById("mrv-toggle").checked;
  try {
    const res = await fetch("/api/sudoku/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grid: sudokuOriginal.map(r => [...r]), use_mrv: useMRV })
    });
    const data = await res.json();
    btn.textContent = "▶ Solve";
    btn.disabled = false;
    if (!data.solved) { showToast("No solution found!", "error"); return; }
    sudokuResult = data;
    sudokuSteps  = data.steps;
    updateSudokuStats(data.stats);
    document.getElementById("total-steps").textContent = sudokuSteps.length;
    document.getElementById("sudoku-playback").classList.remove("hidden");
    showToast(`Found solution! Animating ${sudokuSteps.length} steps…`, "info");
    startSudokuAnimation();
  } catch(e) {
    btn.textContent = "▶ Solve";
    btn.disabled = false;
    showToast("Server error — is Flask running?", "error");
  }
});

document.getElementById("sudoku-step-btn").addEventListener("click", () => {
  if (!sudokuResult) { showToast("Click Solve first", "error"); return; }
  if (sudokuTimer) { clearInterval(sudokuTimer); sudokuTimer = null; }
  sudokuPaused = true;
  document.getElementById("sudoku-playback").classList.remove("hidden");
  if (sudokuIdx < sudokuSteps.length) {
    playSudokuStep(sudokuIdx);
  } else {
    renderSudokuSolved(sudokuResult.board);
    showToast("✓ Sudoku Solved!", "success");
  }
});

document.getElementById("sudoku-pause-btn").addEventListener("click", () => {
  sudokuPaused = !sudokuPaused;
  document.getElementById("sudoku-pause-btn").textContent = sudokuPaused ? "▶" : "⏸";
});

document.getElementById("sudoku-reset-btn").addEventListener("click", () => {
  loadPreset(currentDifficulty);
});

// Init
loadPreset("easy");

/* ============================================================
   N-QUEENS
   ============================================================ */
let nVal       = 8;
let nqSteps    = [];
let nqIdx      = 0;
let nqTimer    = null;
let nqPaused   = false;
let nqResult   = null;
let nqSolIdx   = 0;

document.getElementById("n-dec").addEventListener("click", () => {
  if (nVal > 4) { nVal--; document.getElementById("n-val").textContent = nVal; buildNQBoard(nVal, null); resetNQState(); }
});
document.getElementById("n-inc").addEventListener("click", () => {
  if (nVal < 12) { nVal++; document.getElementById("n-val").textContent = nVal; buildNQBoard(nVal, null); resetNQState(); }
});

function buildNQBoard(n, board) {
  const container = document.getElementById("nq-board");
  container.innerHTML = "";
  container.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cell = document.createElement("div");
      cell.className = "nq-cell " + ((r + c) % 2 === 0 ? "light" : "dark");
      cell.id = `nqc-${r}-${c}`;
      if (board && board[r][c] === 1) cell.classList.add("queen-placed");
      container.appendChild(cell);
    }
  }
}

function renderNQBoard(board, stepType) {
  for (let r = 0; r < nVal; r++) {
    for (let c = 0; c < nVal; c++) {
      const cell = document.getElementById(`nqc-${r}-${c}`);
      if (!cell) continue;
      cell.className = "nq-cell " + ((r + c) % 2 === 0 ? "light" : "dark");
      if (board[r][c] === 1) {
        cell.classList.add(stepType === "solution" ? "queen-solved" :
                           stepType === "backtrack" ? "queen-backtrack" : "queen-placed");
      }
    }
  }
}

function renderNQSolution(board) {
  for (let r = 0; r < nVal; r++) {
    for (let c = 0; c < nVal; c++) {
      const cell = document.getElementById(`nqc-${r}-${c}`);
      if (!cell) continue;
      cell.className = "nq-cell " + ((r + c) % 2 === 0 ? "light" : "dark");
      if (board[r][c] === 1) cell.classList.add("queen-solved");
    }
  }
}

function updateNQStats(stats) {
  document.getElementById("nq-calls").textContent    = stats.recursive_calls.toLocaleString();
  document.getElementById("nq-pruned").textContent   = stats.pruned_branches.toLocaleString();
  document.getElementById("nq-solutions").textContent= stats.solutions_found.toLocaleString();
  document.getElementById("nq-time").textContent     = stats.time_ms + " ms";
}

function logNQStep(step, idx) {
  const log = document.getElementById("nq-log");
  const entry = document.createElement("div");
  entry.className = `log-entry ${step.type}`;
  if (step.type === "solution") {
    entry.textContent = `#${idx+1} ✓ SOLUTION #${step.solution_num} found!`;
  } else {
    entry.textContent = `#${idx+1} ${step.type.toUpperCase().padEnd(9)} row:${step.row} col:${step.col}  depth:${step.depth}`;
  }
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function playNQStep(i) {
  if (i >= nqSteps.length) {
    clearInterval(nqTimer);
    if (nqResult && nqResult.solutions.length > 0) {
      renderNQSolution(nqResult.solutions[0]);
      showToast(`✓ ${nqResult.solution_count} solutions found!`, "success");
      document.getElementById("sol-nav").classList.remove("hidden");
      updateSolNav();
    }
    document.getElementById("nq-solve-btn").disabled = false;
    return;
  }
  const step = nqSteps[i];
  renderNQBoard(step.board, step.type);
  logNQStep(step, i);
  document.getElementById("nq-current-step").textContent = i + 1;
  nqIdx = i + 1;
}

function startNQAnimation() {
  if (nqTimer) clearInterval(nqTimer);
  nqTimer = setInterval(() => {
    if (!nqPaused) playNQStep(nqIdx);
  }, getDelay("nq-speed-slider"));
}

function resetNQState() {
  if (nqTimer) clearInterval(nqTimer);
  nqSteps = []; nqIdx = 0; nqPaused = false; nqResult = null; nqSolIdx = 0;
  document.getElementById("nq-playback").classList.add("hidden");
  document.getElementById("sol-nav").classList.add("hidden");
  document.getElementById("nq-solve-btn").disabled = false;
  document.getElementById("nq-current-step").textContent = "0";
  document.getElementById("nq-total-steps").textContent = "0";
  document.getElementById("nq-log").innerHTML = "";
  ["nq-calls","nq-pruned","nq-solutions","nq-time"].forEach(id => document.getElementById(id).textContent = "—");
}

function updateSolNav() {
  document.getElementById("sol-indicator").textContent = `${nqSolIdx + 1} / ${nqResult.solutions.length}`;
}

document.getElementById("nq-solve-btn").addEventListener("click", async () => {
  resetNQState();
  buildNQBoard(nVal, null);
  const btn = document.getElementById("nq-solve-btn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Solving…';
  try {
    const res = await fetch("/api/nqueens/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ n: nVal })
    });
    const data = await res.json();
    btn.textContent = "▶ Solve";
    if (!data.solved) { btn.disabled = false; showToast("No solution for this N", "error"); return; }
    nqResult = data;
    nqSteps  = data.steps;
    updateNQStats(data.stats);
    document.getElementById("nq-total-steps").textContent = nqSteps.length;
    document.getElementById("nq-playback").classList.remove("hidden");
    showToast(`Animating ${nqSteps.length} steps…`, "info");
    startNQAnimation();
  } catch(e) {
    btn.textContent = "▶ Solve";
    btn.disabled = false;
    showToast("Server error — is Flask running?", "error");
  }
});

document.getElementById("nq-step-btn").addEventListener("click", () => {
  if (!nqResult) { showToast("Click Solve first", "error"); return; }
  if (nqTimer) { clearInterval(nqTimer); nqTimer = null; }
  nqPaused = true;
  document.getElementById("nq-playback").classList.remove("hidden");
  if (nqIdx < nqSteps.length) {
    playNQStep(nqIdx);
  } else {
    if (nqResult.solutions.length > 0) renderNQSolution(nqResult.solutions[0]);
    showToast("All steps done", "info");
  }
});

document.getElementById("nq-pause-btn").addEventListener("click", () => {
  nqPaused = !nqPaused;
  document.getElementById("nq-pause-btn").textContent = nqPaused ? "▶" : "⏸";
});

document.getElementById("nq-reset-btn").addEventListener("click", () => {
  resetNQState();
  buildNQBoard(nVal, null);
});

document.getElementById("prev-sol").addEventListener("click", () => {
  if (!nqResult) return;
  nqSolIdx = (nqSolIdx - 1 + nqResult.solutions.length) % nqResult.solutions.length;
  renderNQSolution(nqResult.solutions[nqSolIdx]);
  updateSolNav();
});

document.getElementById("next-sol").addEventListener("click", () => {
  if (!nqResult) return;
  nqSolIdx = (nqSolIdx + 1) % nqResult.solutions.length;
  renderNQSolution(nqResult.solutions[nqSolIdx]);
  updateSolNav();
});

// Init N-Queens board
buildNQBoard(nVal, null);
