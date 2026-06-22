/**
 * 关卡数据。
 *
 * 棋盘固定为 6x6。出口固定在第 3 行（索引 2）的右边界。
 * 每辆车用一个对象描述：
 *   id:    唯一标识；'X' 表示红色目标车（必须是水平、长度 2、位于第 3 行）。
 *   x, y:  车头（最左 / 最上格）的列、行坐标，从 0 开始。
 *   len:   车身长度（2 或 3）。
 *   dir:   'h' 水平 / 'v' 垂直。
 *
 * optimal: 该关最少步数（仅作初始展示，启动时会被 BFS 求解器算出的真实最优覆盖）。
 *
 * 注：每个关卡都已手工验证存在解（见各关 solution 注释）。
 */
const LEVELS = [
  {
    // 解法：X 直接右移即可。
    name: "入门",
    optimal: 1,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "A", x: 3, y: 0, len: 2, dir: "v" },
      { id: "B", x: 5, y: 3, len: 3, dir: "v" },
    ],
  },
  {
    // 解法：B 下移清空 (3,2)，C 上移清空 (5,2)，X 右移出库。
    name: "热身",
    optimal: 3,
    cars: [
      { id: "X", x: 1, y: 2, len: 2, dir: "h" },
      { id: "A", x: 0, y: 0, len: 2, dir: "h" },
      { id: "B", x: 3, y: 0, len: 3, dir: "v" },
      { id: "C", x: 5, y: 1, len: 2, dir: "v" },
      { id: "D", x: 0, y: 4, len: 3, dir: "h" },
    ],
  },
  {
    // 解法：B、C、D、E 依次下移让出第 3 行，X 右移出库。
    name: "进阶",
    optimal: 5,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "F", x: 0, y: 0, len: 2, dir: "h" },
      { id: "G", x: 4, y: 0, len: 2, dir: "h" },
      { id: "B", x: 2, y: 1, len: 2, dir: "v" },
      { id: "C", x: 3, y: 0, len: 3, dir: "v" },
      { id: "D", x: 4, y: 2, len: 2, dir: "v" },
      { id: "E", x: 5, y: 2, len: 2, dir: "v" },
    ],
  },
  {
    // 解法：H 先左移让出 (2,4)，B 才能下移清空 (2,2)；C 下移、D 上移，最后 X 右移。
    name: "挑战",
    optimal: 5,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "A", x: 0, y: 0, len: 2, dir: "h" },
      { id: "B", x: 2, y: 1, len: 2, dir: "v" },
      { id: "C", x: 3, y: 0, len: 3, dir: "v" },
      { id: "D", x: 5, y: 1, len: 2, dir: "v" },
      { id: "H", x: 1, y: 4, len: 2, dir: "h" },
      { id: "G", x: 4, y: 4, len: 2, dir: "h" },
    ],
  },
  {
    // 解法：A 下移清空 (2,2)，B 下移清空 (3,2)，D 下移清空 (5,2)，X 右移出库。
    name: "高手",
    optimal: 4,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "A", x: 2, y: 0, len: 3, dir: "v" },
      { id: "B", x: 3, y: 2, len: 2, dir: "v" },
      { id: "C", x: 4, y: 0, len: 2, dir: "v" },
      { id: "D", x: 5, y: 2, len: 3, dir: "v" },
      { id: "E", x: 0, y: 0, len: 2, dir: "h" },
      { id: "F", x: 0, y: 4, len: 2, dir: "h" },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LEVELS };
}
