// 一次性校验脚本：确认每关可解并打印理论最优步数。
// 运行：node validate.mjs
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./js/levels.js", import.meta.url), "utf8");
// levels.js 末尾的 module.exports 会在 ESM 下报错，这里用 Function 求值取出 LEVELS。
const LEVELS = (function () {
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  const fn = new Function("module", src + "\nreturn LEVELS;");
  return fn(module);
})();

const BOARD = 6;

function cellsOf(c) {
  const out = [];
  for (let i = 0; i < c.len; i++) out.push(c.dir === "h" ? [c.x + i, c.y] : [c.x, c.y + i]);
  return out;
}
function buildGrid(list, ignore) {
  const g = Array.from({ length: BOARD }, () => new Array(BOARD).fill(null));
  for (const c of list) {
    if (c.id === ignore) continue;
    for (const [x, y] of cellsOf(c)) g[y][x] = c.id;
  }
  return g;
}
function getExit(lv) { return lv && lv.exit ? lv.exit : { side: "right", lane: 2 }; }
function isWin(list, exit) {
  const t = list.find((c) => c.id === "X");
  const e = exit || { side: "right", lane: 2 };
  switch (e.side) {
    case "right": return t.x + t.len >= BOARD;
    case "left": return t.x <= 0;
    case "bottom": return t.y + t.len >= BOARD;
    case "top": return t.y <= 0;
    default: return t.x + t.len >= BOARD;
  }
}
function copy(list) { return list.map((c) => ({ ...c })); }
function encode(list) {
  return list.slice().sort((a, b) => (a.id < b.id ? -1 : 1)).map((c) => c.id + c.x + "," + c.y).join("|");
}
function neighbors(list) {
  const res = [];
  for (let i = 0; i < list.length; i++) {
    const car = list[i];
    const g = buildGrid(list, car.id);
    if (car.dir === "h") {
      for (let nx = car.x - 1; nx >= 0; nx--) { if (g[car.y][nx]) break; const n = copy(list); n[i].x = nx; res.push(n); }
      for (let nx = car.x + 1; nx + car.len <= BOARD; nx++) { if (g[car.y][nx + car.len - 1]) break; const n = copy(list); n[i].x = nx; res.push(n); }
    } else {
      for (let ny = car.y - 1; ny >= 0; ny--) { if (g[ny][car.x]) break; const n = copy(list); n[i].y = ny; res.push(n); }
      for (let ny = car.y + 1; ny + car.len <= BOARD; ny++) { if (g[ny + car.len - 1][car.x]) break; const n = copy(list); n[i].y = ny; res.push(n); }
    }
  }
  return res;
}
function overlapCheck(list) {
  const seen = new Set();
  for (const c of list) for (const [x, y] of cellsOf(c)) {
    if (x < 0 || x >= BOARD || y < 0 || y >= BOARD) return `越界 ${c.id}@${x},${y}`;
    const k = x + "," + y;
    if (seen.has(k)) return `重叠 ${c.id}@${k}`;
    seen.add(k);
  }
  return null;
}
function solve(start, exit) {
  if (isWin(start, exit)) return 0;
  const seen = new Set([encode(start)]);
  let f = [start], d = 0;
  while (f.length) {
    d++; const nx = [];
    for (const s of f) for (const nb of neighbors(s)) {
      const k = encode(nb);
      if (seen.has(k)) continue;
      if (isWin(nb, exit)) return d;
      seen.add(k); nx.push(nb);
    }
    f = nx; if (d > 100) return -1;
  }
  return -1;
}

let ok = true;
LEVELS.forEach((lv, i) => {
  const bad = overlapCheck(lv.cars);
  if (bad) { console.log(`关卡 ${i + 1} ${lv.name}: 数据错误 -> ${bad}`); ok = false; return; }
  const opt = solve(copy(lv.cars), getExit(lv));
  const status = opt < 0 ? "无解!!" : `最优 ${opt} 步 (标注 ${lv.optimal})`;
  if (opt < 0) ok = false;
  console.log(`关卡 ${i + 1} ${lv.name}: ${status}`);
});
console.log(ok ? "\n全部关卡通过校验 ✅" : "\n存在问题 ❌");
