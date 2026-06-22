(function () {
  "use strict";

  const BOARD = 6;        // 6x6 棋盘
  const EXIT_ROW = 2;     // 出口所在行（0 索引）
  const STORE_KEY = "rushhour.best.v1";

  // ---- DOM ----
  const boardEl = document.getElementById("board");
  const levelLabel = document.getElementById("levelLabel");
  const movesLabel = document.getElementById("movesLabel");
  const timeLabel = document.getElementById("timeLabel");
  const bestLabel = document.getElementById("bestLabel");
  const levelSelect = document.getElementById("levelSelect");
  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const winOverlay = document.getElementById("winOverlay");
  const winMoves = document.getElementById("winMoves");
  const winTime = document.getElementById("winTime");
  const winBest = document.getElementById("winBest");
  const replayBtn = document.getElementById("replayBtn");
  const winNextBtn = document.getElementById("winNextBtn");

  // ---- 运行时状态 ----
  let levelIndex = 0;
  let cars = [];          // 当前车辆 [{id,x,y,len,dir}]
  let history = [];       // 撤销栈：每项为移动前的快照
  let moveCount = 0;
  let won = false;
  let timerId = null;
  let startTime = 0;
  let elapsedMs = 0;
  const carEls = {};      // id -> 元素

  // ---------- 工具 ----------
  function deepCopyCars(list) {
    return list.map((c) => ({ ...c }));
  }

  function cellsOf(car) {
    const out = [];
    for (let i = 0; i < car.len; i++) {
      out.push(car.dir === "h" ? [car.x + i, car.y] : [car.x, car.y + i]);
    }
    return out;
  }

  // 构建占用网格；ignoreId 可在移动判定时排除自身。
  function buildGrid(list, ignoreId) {
    const grid = Array.from({ length: BOARD }, () => new Array(BOARD).fill(null));
    for (const car of list) {
      if (car.id === ignoreId) continue;
      for (const [cx, cy] of cellsOf(car)) {
        if (cx >= 0 && cx < BOARD && cy >= 0 && cy < BOARD) grid[cy][cx] = car.id;
      }
    }
    return grid;
  }

  function isWinState(list) {
    const x = list.find((c) => c.id === "X");
    return x && x.x + x.len >= BOARD;
  }

  // ---------- BFS 求解器（验证可解性 & 计算最优步数） ----------
  function encode(list) {
    // 用每辆车的车头坐标拼成字符串作为状态键（id 顺序固定）
    return list
      .slice()
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .map((c) => c.id + c.x + "," + c.y)
      .join("|");
  }

  function neighbors(list) {
    const res = [];
    for (let i = 0; i < list.length; i++) {
      const car = list[i];
      const grid = buildGrid(list, car.id);
      if (car.dir === "h") {
        // 向左
        for (let nx = car.x - 1; nx >= 0; nx--) {
          if (grid[car.y][nx] !== null) break;
          const nl = deepCopyCars(list);
          nl[i].x = nx;
          res.push(nl);
        }
        // 向右
        for (let nx = car.x + 1; nx + car.len <= BOARD; nx++) {
          if (grid[car.y][nx + car.len - 1] !== null) break;
          const nl = deepCopyCars(list);
          nl[i].x = nx;
          res.push(nl);
        }
      } else {
        // 向上
        for (let ny = car.y - 1; ny >= 0; ny--) {
          if (grid[ny][car.x] !== null) break;
          const nl = deepCopyCars(list);
          nl[i].y = ny;
          res.push(nl);
        }
        // 向下
        for (let ny = car.y + 1; ny + car.len <= BOARD; ny++) {
          if (grid[ny + car.len - 1][car.x] !== null) break;
          const nl = deepCopyCars(list);
          nl[i].y = ny;
          res.push(nl);
        }
      }
    }
    return res;
  }

  function solveOptimal(startCars) {
    const start = deepCopyCars(startCars);
    if (isWinState(start)) return 0;
    const seen = new Set([encode(start)]);
    let frontier = [start];
    let depth = 0;
    while (frontier.length) {
      depth++;
      const next = [];
      for (const state of frontier) {
        for (const nb of neighbors(state)) {
          const key = encode(nb);
          if (seen.has(key)) continue;
          if (isWinState(nb)) return depth;
          seen.add(key);
          next.push(nb);
        }
      }
      frontier = next;
      if (depth > 100) return -1; // 安全阀
    }
    return -1; // 不可解
  }

  // ---------- 渲染 ----------
  function renderBoard() {
    boardEl.innerHTML = "";
    Object.keys(carEls).forEach((k) => delete carEls[k]);

    // 网格背景格子
    for (let i = 0; i < BOARD * BOARD; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      boardEl.appendChild(cell);
    }

    // 出口标记
    const exit = document.createElement("div");
    exit.className = "exit-marker";
    exit.style.top = `calc(${EXIT_ROW} * (100% / ${BOARD}))`;
    exit.textContent = "出口";
    boardEl.appendChild(exit);

    // 车辆
    for (const car of cars) {
      const el = document.createElement("div");
      el.className = "car" + (car.id === "X" ? " target" : "");
      el.dataset.id = car.id;
      el.dataset.dir = car.dir;
      if (car.id !== "X") {
        // 为非目标车分配稳定的配色
        const palette = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
        const idx = car.id.charCodeAt(0) % palette.length;
        el.classList.add(palette[idx]);
      }
      boardEl.appendChild(el);
      carEls[car.id] = el;
      positionCar(car);
      attachDrag(el, car.id);
    }
  }

  function positionCar(car) {
    const el = carEls[car.id];
    if (!el) return;
    const unit = 100 / BOARD;
    const wCells = car.dir === "h" ? car.len : 1;
    const hCells = car.dir === "v" ? car.len : 1;
    el.style.left = `calc(${car.x} * (100% / ${BOARD}))`;
    el.style.top = `calc(${car.y} * (100% / ${BOARD}))`;
    el.style.width = `calc(${wCells} * (100% / ${BOARD}))`;
    el.style.height = `calc(${hCells} * (100% / ${BOARD}))`;
  }

  // ---------- 移动 ----------
  function carById(id) {
    return cars.find((c) => c.id === id);
  }

  // 计算某车在其方向上允许的 [min, max] 车头位置范围
  function allowedRange(car) {
    const grid = buildGrid(cars, car.id);
    if (car.dir === "h") {
      let min = car.x;
      while (min - 1 >= 0 && grid[car.y][min - 1] === null) min--;
      let max = car.x;
      while (max + car.len <= BOARD - 1 && grid[car.y][max + car.len] === null) max++;
      return { min, max };
    } else {
      let min = car.y;
      while (min - 1 >= 0 && grid[min - 1][car.x] === null) min--;
      let max = car.y;
      while (max + car.len <= BOARD - 1 && grid[max + car.len][car.x] === null) max++;
      return { min, max };
    }
  }

  function commitMove(car, newHead) {
    const before = car.dir === "h" ? car.x : car.y;
    if (newHead === before) return false;
    history.push({ id: car.id, prev: before, moves: moveCount });
    if (car.dir === "h") car.x = newHead;
    else car.y = newHead;
    moveCount++;
    movesLabel.textContent = String(moveCount);
    positionCar(car);
    ensureTimer();
    if (isWinState(cars)) handleWin();
    return true;
  }

  // ---------- 拖拽 / 点击 ----------
  function attachDrag(el, id) {
    let dragging = false;
    let startPx = 0;
    let startHead = 0;
    let range = null;
    let unitPx = 0;
    let moved = false;

    function onDown(e) {
      if (won) return;
      const car = carById(id);
      range = allowedRange(car);
      unitPx = boardEl.clientWidth / BOARD;
      startHead = car.dir === "h" ? car.x : car.y;
      startPx = car.dir === "h" ? getPoint(e).x : getPoint(e).y;
      dragging = true;
      moved = false;
      el.classList.add("grab");
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchmove", onMove, { passive: false });
      window.addEventListener("touchend", onUp);
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      e.preventDefault();
      const car = carById(id);
      const cur = car.dir === "h" ? getPoint(e).x : getPoint(e).y;
      const deltaCells = (cur - startPx) / unitPx;
      let target = startHead + deltaCells;
      target = Math.max(range.min, Math.min(range.max, target));
      if (Math.abs(target - startHead) > 0.15) moved = true;
      // 实时跟手（取整以贴格）
      const snapped = Math.round(target);
      if (car.dir === "h") car.x = snapped;
      else car.y = snapped;
      positionCar(car);
    }

    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("grab");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);

      const car = carById(id);
      const landed = car.dir === "h" ? car.x : car.y;
      // 先把车恢复到起点，再通过 commitMove 正式提交（保证撤销栈正确）
      if (car.dir === "h") car.x = startHead;
      else car.y = startHead;

      if (moved && landed !== startHead) {
        commitMove(car, landed);
      } else if (!moved) {
        // 视为点击：朝出口方向（或可移动方向）走一格
        tapMove(car, range);
      } else {
        positionCar(car);
      }
    }

    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: false });
  }

  function tapMove(car, range) {
    // 点击：优先朝“出口方向”移动一格（目标车向右，其它车向能动的方向）
    const head = car.dir === "h" ? car.x : car.y;
    let target = head;
    if (head < range.max) target = head + 1;       // 优先正向（右/下）
    else if (head > range.min) target = head - 1;  // 否则反向
    if (target !== head) commitMove(car, target);
    else positionCar(car);
  }

  function getPoint(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  // ---------- 计时 ----------
  function ensureTimer() {
    if (timerId || won) return;
    startTime = Date.now() - elapsedMs;
    timerId = setInterval(updateTime, 250);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function updateTime() {
    elapsedMs = Date.now() - startTime;
    timeLabel.textContent = formatTime(elapsedMs);
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  // ---------- 最佳成绩 ----------
  function loadBests() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function getBest(idx) {
    return loadBests()[idx];
  }

  function setBest(idx, moves) {
    const all = loadBests();
    if (all[idx] === undefined || moves < all[idx]) {
      all[idx] = moves;
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(all));
      } catch {}
      return true;
    }
    return false;
  }

  function refreshBestLabel() {
    const b = getBest(levelIndex);
    bestLabel.textContent = b === undefined ? "—" : String(b);
  }

  // ---------- 胜利 ----------
  function handleWin() {
    won = true;
    stopTimer();
    const isNewBest = setBest(levelIndex, moveCount);
    refreshBestLabel();
    winMoves.textContent = String(moveCount);
    winTime.textContent = formatTime(elapsedMs);
    const opt = LEVELS[levelIndex].optimal;
    let bestMsg = "";
    if (isNewBest) bestMsg = "🎉 新纪录！";
    else bestMsg = `本关历史最佳：${getBest(levelIndex)} 步`;
    if (opt) bestMsg += `　·　理论最优：${opt} 步`;
    winBest.textContent = bestMsg;
    winNextBtn.disabled = levelIndex >= LEVELS.length - 1;
    winNextBtn.style.opacity = winNextBtn.disabled ? 0.4 : 1;

    // 让目标车滑出出口的动画
    const xEl = carEls["X"];
    if (xEl) {
      xEl.classList.add("escaping");
      setTimeout(() => showOverlay(), 520);
    } else {
      showOverlay();
    }
  }

  function showOverlay() {
    winOverlay.classList.remove("hidden");
  }

  function hideOverlay() {
    winOverlay.classList.add("hidden");
  }

  // ---------- 关卡加载 ----------
  function loadLevel(idx) {
    levelIndex = Math.max(0, Math.min(LEVELS.length - 1, idx));
    cars = deepCopyCars(LEVELS[levelIndex].cars);
    history = [];
    moveCount = 0;
    won = false;
    elapsedMs = 0;
    stopTimer();
    movesLabel.textContent = "0";
    timeLabel.textContent = "00:00";
    levelLabel.textContent = `${levelIndex + 1} · ${LEVELS[levelIndex].name}`;
    levelSelect.value = String(levelIndex);
    hideOverlay();
    renderBoard();
    refreshBestLabel();
    prevBtn.disabled = levelIndex === 0;
    nextBtn.disabled = levelIndex === LEVELS.length - 1;
  }

  function undo() {
    if (won || history.length === 0) return;
    const last = history.pop();
    const car = carById(last.id);
    if (car.dir === "h") car.x = last.prev;
    else car.y = last.prev;
    moveCount = last.moves;
    movesLabel.textContent = String(moveCount);
    positionCar(car);
  }

  // ---------- 关卡下拉框 ----------
  function buildLevelSelect() {
    levelSelect.innerHTML = "";
    LEVELS.forEach((lv, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `第 ${i + 1} 关 · ${lv.name}`;
      levelSelect.appendChild(opt);
    });
  }

  // ---------- 事件绑定 ----------
  undoBtn.addEventListener("click", undo);
  resetBtn.addEventListener("click", () => loadLevel(levelIndex));
  prevBtn.addEventListener("click", () => loadLevel(levelIndex - 1));
  nextBtn.addEventListener("click", () => loadLevel(levelIndex + 1));
  levelSelect.addEventListener("change", (e) => loadLevel(parseInt(e.target.value, 10)));
  replayBtn.addEventListener("click", () => loadLevel(levelIndex));
  winNextBtn.addEventListener("click", () => {
    if (levelIndex < LEVELS.length - 1) loadLevel(levelIndex + 1);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "z" || e.key === "Z") undo();
    if (e.key === "r" || e.key === "R") loadLevel(levelIndex);
  });
  window.addEventListener("resize", () => {
    cars.forEach(positionCar);
  });

  // ---------- 启动 ----------
  function validateLevels() {
    LEVELS.forEach((lv, i) => {
      const opt = solveOptimal(lv.cars);
      if (opt < 0) {
        console.error(`关卡 ${i + 1}（${lv.name}）无解，请检查数据！`);
      } else {
        lv.optimal = opt; // 用真实最优覆盖手填值
      }
    });
  }

  validateLevels();
  buildLevelSelect();
  loadLevel(0);
})();
