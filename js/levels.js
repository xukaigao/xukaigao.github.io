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
  {
    // 解法：A、B、C、D 依次下移让出第 3 行，X 右移出库。
    name: "车满为患",
    optimal: 5,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "E", x: 0, y: 0, len: 2, dir: "h" },
      { id: "F", x: 2, y: 0, len: 2, dir: "v" },
      { id: "G", x: 5, y: 0, len: 2, dir: "v" },
      { id: "A", x: 2, y: 2, len: 2, dir: "v" },
      { id: "B", x: 3, y: 2, len: 2, dir: "v" },
      { id: "C", x: 4, y: 2, len: 2, dir: "v" },
      { id: "D", x: 5, y: 2, len: 2, dir: "v" },
    ],
  },
  {
    // 解法：A 下移清空 (2,2)，B 下移清空 (3,2)，C 下移清空 (4,2)，D 上移清空 (5,2)，X 右移。
    name: "上下夹击",
    optimal: 5,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "E", x: 0, y: 0, len: 2, dir: "h" },
      { id: "A", x: 2, y: 0, len: 3, dir: "v" },
      { id: "B", x: 3, y: 2, len: 2, dir: "v" },
      { id: "C", x: 4, y: 0, len: 3, dir: "v" },
      { id: "D", x: 5, y: 2, len: 2, dir: "v" },
    ],
  },
  {
    // 解法：D 下移清空 (2,2)，C 下移清空 (4,2)，B 先左移让出 (5,5)，A 才能下移清空 (5,2)，X 右移。
    name: "连环",
    optimal: 5,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "D", x: 2, y: 2, len: 2, dir: "v" },
      { id: "C", x: 4, y: 2, len: 2, dir: "v" },
      { id: "A", x: 5, y: 2, len: 2, dir: "v" },
      { id: "E", x: 5, y: 0, len: 2, dir: "v" },
      { id: "B", x: 4, y: 5, len: 2, dir: "h" },
    ],
  },
  {
    // 解法：A 下移清空 (2,2)，B 下移清空 (3,2)，C 上移清空 (4,2)，D 上移清空 (5,2)，X 右移。
    name: "迷魂阵",
    optimal: 5,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "E", x: 0, y: 0, len: 2, dir: "h" },
      { id: "A", x: 2, y: 1, len: 2, dir: "v" },
      { id: "B", x: 3, y: 0, len: 3, dir: "v" },
      { id: "C", x: 4, y: 2, len: 2, dir: "v" },
      { id: "D", x: 5, y: 1, len: 2, dir: "v" },
      { id: "F", x: 0, y: 4, len: 2, dir: "h" },
    ],
  },
  {
    // 解法：C 下移清空 (2,2)，D 先左移让出 (5,4)，A 才能下移清空 (5,2)，X 右移。
    name: "大堵车",
    optimal: 4,
    cars: [
      { id: "X", x: 0, y: 2, len: 2, dir: "h" },
      { id: "C", x: 2, y: 2, len: 2, dir: "v" },
      { id: "A", x: 5, y: 1, len: 2, dir: "v" },
      { id: "H", x: 4, y: 0, len: 2, dir: "h" },
      { id: "D", x: 4, y: 4, len: 2, dir: "h" },
      { id: "E", x: 0, y: 0, len: 2, dir: "h" },
      { id: "F", x: 0, y: 4, len: 2, dir: "h" },
    ],
  },

  // —— 以下为硬核关卡（取自已公开验证的 BFS 求解器，保证可解） ——
  {
    // 来源：经典 6x6 题库「中等」，理论最优 16 步。
    name: "硬核 · 车流高峰",
    optimal: 16,
    cars: [
      { id: "X", x: 2, y: 2, len: 2, dir: "h" },
      { id: "B", x: 2, y: 1, len: 2, dir: "h" },
      { id: "C", x: 0, y: 5, len: 2, dir: "h" },
      { id: "D", x: 3, y: 4, len: 2, dir: "h" },
      { id: "E", x: 3, y: 5, len: 2, dir: "h" },
      { id: "F", x: 1, y: 0, len: 2, dir: "v" },
      { id: "G", x: 1, y: 2, len: 3, dir: "v" },
      { id: "H", x: 2, y: 4, len: 2, dir: "v" },
      { id: "I", x: 4, y: 0, len: 3, dir: "v" },
    ],
  },
  {
    // 来源：经典 6x6 题库「困难」，理论最优 26 步。
    name: "硬核 · 寸步难行",
    optimal: 26,
    cars: [
      { id: "X", x: 1, y: 2, len: 2, dir: "h" },
      { id: "B", x: 3, y: 0, len: 3, dir: "h" },
      { id: "C", x: 4, y: 1, len: 2, dir: "h" },
      { id: "D", x: 4, y: 3, len: 2, dir: "h" },
      { id: "E", x: 2, y: 4, len: 2, dir: "h" },
      { id: "F", x: 1, y: 5, len: 3, dir: "h" },
      { id: "G", x: 2, y: 0, len: 2, dir: "v" },
      { id: "H", x: 3, y: 1, len: 3, dir: "v" },
      { id: "I", x: 0, y: 1, len: 2, dir: "v" },
      { id: "J", x: 0, y: 4, len: 2, dir: "v" },
      { id: "K", x: 1, y: 3, len: 2, dir: "v" },
      { id: "L", x: 5, y: 4, len: 2, dir: "v" },
    ],
  },
  {
    // 来源：michaelfogleman.com/rush 评选出的 6x6 史上最难配置，理论最优 51 步。
    name: "魔王关 · 史上最难",
    optimal: 51,
    cars: [
      { id: "X", x: 3, y: 2, len: 2, dir: "h" },
      { id: "B", x: 1, y: 0, len: 2, dir: "h" },
      { id: "C", x: 0, y: 3, len: 3, dir: "h" },
      { id: "D", x: 0, y: 5, len: 2, dir: "h" },
      { id: "E", x: 3, y: 5, len: 2, dir: "h" },
      { id: "F", x: 4, y: 4, len: 2, dir: "h" },
      { id: "G", x: 0, y: 0, len: 3, dir: "v" },
      { id: "H", x: 1, y: 1, len: 2, dir: "v" },
      { id: "I", x: 2, y: 1, len: 2, dir: "v" },
      { id: "J", x: 4, y: 0, len: 2, dir: "v" },
      { id: "K", x: 3, y: 3, len: 2, dir: "v" },
      { id: "L", x: 2, y: 4, len: 2, dir: "v" },
      { id: "M", x: 5, y: 1, len: 3, dir: "v" },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LEVELS };
}
