(function () {
  "use strict";

  const BOARD = 6;        // 6x6 棋盘
  const DEFAULT_EXIT = { side: "right", lane: 2 }; // 经典出口：右侧第 3 行
  const STORE_KEY = "rushhour.best.v2"; // v2：最佳成绩改为按关卡稳定 id 存储

  // 6 级星标的最优步数上界：≤3→1★, ≤6→2★, ≤9→3★, ≤14→4★, ≤22→5★, 其余→6★
  // 关卡也可用 stars 字段（1~6）手动指定，优先级高于自动分级。
  const STAR_TIERS = [3, 6, 9, 14, 22];
  const MAX_STARS = 6;

  // 通关赞美句库（面向 6–12 岁孩子）：每次通关随机抽一句，顺序无所谓。
  const PRAISES = [
    "太聪明啦！这么难的题都被你解开了！",
    "你的脑子转得真快，简直是解谜小天才！",
    "思路真清晰，这一关被你轻松拿下！",
    "真厉害！像你这样会动脑筋的孩子可不多见！",
    "你太棒了，连大人都不一定解得开呢！",
    "观察力满分！你一眼就找到了突破口！",
    "了不起！你的耐心和智慧都满分！",
    "这步走得妙，你真是个小小策略家！",
    "你做到了！相信自己，你比想象中更聪明！",
    "漂亮！每一步都走得又稳又准！",
    "你的专注力真强，难怪能顺利通关！",
    "哇塞，这么烧脑的关卡都难不倒你！",
    "真是个爱思考的好孩子，继续加油！",
    "你的逻辑超清晰，未来一定大有可为！",
    "太出色了！困难在你面前都得让路！",
    "你像小侦探一样，把出路找得明明白白！",
    "坚持到底就是胜利，你做得非常棒！",
    "脑洞大开！你的解法真有创意！",
    "厉害了！你又升级成更强的解谜高手啦！",
    "真聪明，这份认真劲儿会带你走得更远！",
  ];

  function randomPraise() {
    return PRAISES[Math.floor(Math.random() * PRAISES.length)];
  }

  // ---- DOM ----
  const boardEl = document.getElementById("board");
  const levelLabel = document.getElementById("levelLabel");
  const movesLabel = document.getElementById("movesLabel");
  const timeLabel = document.getElementById("timeLabel");
  const bestLabel = document.getElementById("bestLabel");
  const diffLabel = document.getElementById("diffLabel");
  const levelSelect = document.getElementById("levelSelect");
  const undoBtn = document.getElementById("undoBtn");
  const resetBtn = document.getElementById("resetBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const winOverlay = document.getElementById("winOverlay");
  const winPraise = document.getElementById("winPraise");
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
  let currentExit = DEFAULT_EXIT;  // 当前关卡出口 {side, lane}
  const carEls = {};      // id -> 元素

  // 读取关卡出口配置；未指定则用经典右侧出口。
  // side: 'right' | 'left' | 'bottom' | 'top'；lane: 出口所在的行（右/左）或列（上/下），0 索引。
  function getExit(level) {
    return level && level.exit ? level.exit : DEFAULT_EXIT;
  }

  // ---------- 命名 / 难度（与显示顺序解耦，可扩展到数百关） ----------
  // 难度星级：优先用关卡手填的 stars；否则按 BFS 最优步数自动分级。返回 0 表示未知。
  function getStars(level) {
    if (level && level.stars >= 1 && level.stars <= MAX_STARS) return level.stars;
    const opt = level && level.optimal;
    if (!opt || opt < 0) return 0;
    for (let i = 0; i < STAR_TIERS.length; i++) {
      if (opt <= STAR_TIERS[i]) return i + 1;
    }
    return MAX_STARS;
  }

  function starString(n) {
    if (!n) return "☆".repeat(MAX_STARS); // 未知难度（BFS 尚未算出）
    return "★".repeat(n) + "☆".repeat(MAX_STARS - n);
  }

  // 显示标题：第 N 关（按数组顺序实时计算）+ 可选描述名。
  function levelTitle(idx) {
    const lv = LEVELS[idx];
    const base = `第 ${idx + 1} 关`;
    return lv && lv.name ? `${base} · ${lv.name}` : base;
  }

  // 最佳成绩存储键：用稳定 id；缺省回退到下标（兼容未分配 id 的关）。
  function levelKey(idx) {
    const lv = LEVELS[idx];
    return lv && lv.id ? lv.id : "idx" + idx;
  }

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

  // 目标车（X）到达出口边缘即获胜。目标车锁定在自己的行/列，故只需判断边缘。
  function isWinState(list, exit) {
    const t = list.find((c) => c.id === "X");
    if (!t) return false;
    const e = exit || DEFAULT_EXIT;
    switch (e.side) {
      case "right": return t.x + t.len >= BOARD;
      case "left": return t.x <= 0;
      case "bottom": return t.y + t.len >= BOARD;
      case "top": return t.y <= 0;
      default: return t.x + t.len >= BOARD;
    }
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

  // 返回值：>=0 为最优步数；-1 为已证明不可解；-2 为超出计算上限（放弃，不代表无解）。
  function solveOptimal(startCars, exit, maxStates) {
    const cap = maxStates || 80000;
    const start = deepCopyCars(startCars);
    if (isWinState(start, exit)) return 0;
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
          if (isWinState(nb, exit)) return depth;
          seen.add(key);
          next.push(nb);
          if (seen.size > cap) return -2; // 状态过多，放弃求解
        }
      }
      frontier = next;
      if (depth > 120) return -2;
    }
    return -1; // 搜索完毕仍无解
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

    // 出口标记（按出口所在边与车道定位）
    const exit = document.createElement("div");
    exit.className = "exit-marker exit-" + currentExit.side;
    exit.textContent = "出口";
    const lanePos = `calc(${currentExit.lane} * (100% / ${BOARD}))`;
    if (currentExit.side === "right" || currentExit.side === "left") {
      exit.style.top = lanePos;
    } else {
      exit.style.left = lanePos;
    }
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
    if (isWinState(cars, currentExit)) handleWin();
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
    return loadBests()[levelKey(idx)];
  }

  function setBest(idx, moves) {
    const all = loadBests();
    const key = levelKey(idx);
    if (all[key] === undefined || moves < all[key]) {
      all[key] = moves;
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

  function refreshDiffLabel() {
    if (diffLabel) diffLabel.textContent = starString(getStars(LEVELS[levelIndex]));
  }

  // ---------- 胜利 ----------
  function handleWin() {
    won = true;
    stopTimer();
    if (winPraise) winPraise.textContent = randomPraise();
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

    // 让目标车朝出口方向滑出的动画
    const xEl = carEls["X"];
    if (xEl) {
      xEl.style.transition = "left 0.5s cubic-bezier(0.5,-0.1,0.8,0.4), top 0.5s cubic-bezier(0.5,-0.1,0.8,0.4)";
      if (currentExit.side === "right") xEl.style.left = "120%";
      else if (currentExit.side === "left") xEl.style.left = "-120%";
      else if (currentExit.side === "bottom") xEl.style.top = "120%";
      else if (currentExit.side === "top") xEl.style.top = "-120%";
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
    currentExit = getExit(LEVELS[levelIndex]);
    history = [];
    moveCount = 0;
    won = false;
    elapsedMs = 0;
    stopTimer();
    movesLabel.textContent = "0";
    timeLabel.textContent = "00:00";
    levelLabel.textContent = `${levelIndex + 1} / ${LEVELS.length}`;
    levelSelect.value = String(levelIndex);
    hideOverlay();
    renderBoard();
    refreshBestLabel();
    refreshDiffLabel();
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
      opt.textContent = `${levelTitle(i)}　${starString(getStars(lv))}`;
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
  // 异步逐关校验，避免在加载时一次性阻塞 UI（高难关状态空间较大）。
  function validateLevels() {
    let i = 0;
    function step() {
      if (i >= LEVELS.length) return;
      const lv = LEVELS[i];
      if (lv.cars.length > 10) { i++; setTimeout(step, 0); return; } // 高密度关卡跳过校验，沿用已知最优
      const opt = solveOptimal(lv.cars, getExit(lv));
      if (opt === -1) {
        console.error(`关卡 ${i + 1}（${lv.name}）无解，请检查数据！`);
      } else if (opt >= 0) {
        lv.optimal = opt; // 用真实最优覆盖手填值
        // 刷新当前关的难度星标，并更新下拉框中该关的星级
        if (i === levelIndex) refreshDiffLabel();
        const optEl = levelSelect.options[i];
        if (optEl) optEl.textContent = `${levelTitle(i)}　${starString(getStars(lv))}`;
      }
      // opt === -2：状态过多，保留手填的 optimal。
      i++;
      setTimeout(step, 0);
    }
    setTimeout(step, 200);
  }

  buildLevelSelect();
  loadLevel(0);
  validateLevels();
})();
