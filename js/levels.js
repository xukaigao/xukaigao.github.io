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
    // 解法：B 下移清空 (3,2)，C 上移清空 (5,2)，X 右移出库。
    name: "入门",
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

  {
    // 图片题库①：目标=黑色警车（竖），出口在底部第 4 列（向下开出）。
    // 参考解（9 步）：粉右1, 棕下2, 绿右1, 橙上2, 黄1左1, 棕下2, 粉左3, 黄2右1, 黑下到底。
    name: "警车出库（下出口）",
    optimal: 9,
    exit: { side: "bottom", lane: 3 },
    cars: [
      { id: "X", x: 3, y: 0, len: 2, dir: "v" }, // 黑色警车（目标）
      { id: "A", x: 0, y: 1, len: 2, dir: "h" }, // 绿车
      { id: "B", x: 2, y: 0, len: 2, dir: "v" }, // 棕车
      { id: "C", x: 0, y: 2, len: 3, dir: "v" }, // 橙色大卡车
      { id: "D", x: 2, y: 3, len: 3, dir: "h" }, // 粉色长车
      { id: "E", x: 1, y: 4, len: 2, dir: "h" }, // 黄1
      { id: "F", x: 3, y: 4, len: 2, dir: "h" }, // 黄2
    ],
  },

  {
    // 图片题库②：目标=黑色警车（竖），出口在底部第 4 列（向下开出）。
    // 参考解：黑下1, 黄1右3, 紫上1, 黑上1, 黄2左4, 橙上2, 白左1, 绿右1, 黑下到底。
    name: "警车出库 II（下出口）",
    optimal: 9,
    exit: { side: "bottom", lane: 3 },
    cars: [
      { id: "X", x: 3, y: 0, len: 2, dir: "v" }, // 黑色警车（目标）
      { id: "A", x: 1, y: 0, len: 2, dir: "h" }, // 黄1（顶部）
      { id: "B", x: 1, y: 1, len: 2, dir: "v" }, // 紫车
      { id: "C", x: 4, y: 2, len: 2, dir: "h" }, // 黄2（右侧）
      { id: "D", x: 1, y: 3, len: 3, dir: "h" }, // 白色长车
      { id: "E", x: 1, y: 4, len: 2, dir: "h" }, // 红车
      { id: "F", x: 3, y: 4, len: 2, dir: "h" }, // 绿车
      { id: "G", x: 5, y: 3, len: 3, dir: "v" }, // 橙色大卡车
    ],
  },

  {
    // 图片题库③：目标=黑色警车（竖），出口在底部第 4 列（向下开出）。
    // 参考解：黑上1, 白2右3, 紫2上1, 橙左2, 紫右2, 黑下到底。
    name: "警车出库 III（下出口）",
    optimal: 6,
    exit: { side: "bottom", lane: 3 },
    cars: [
      { id: "X", x: 3, y: 1, len: 2, dir: "v" }, // 黑色警车（目标）
      { id: "A", x: 2, y: 0, len: 2, dir: "v" }, // 棕色车（顶部带装饰）
      { id: "B", x: 0, y: 1, len: 2, dir: "h" }, // 白1（救护车，上）
      { id: "C", x: 1, y: 2, len: 2, dir: "h" }, // 白2（救护车，下）
      { id: "D", x: 1, y: 3, len: 2, dir: "v" }, // 紫2（左侧竖紫车）
      { id: "E", x: 2, y: 3, len: 2, dir: "h" }, // 紫（中间横紫车）
      { id: "F", x: 2, y: 4, len: 3, dir: "h" }, // 橙色大卡车
    ],
  },

  {
    // 图片题库④：目标=黑色警车（竖），出口在底部第 4 列（向下开出）。
    // 参考解：灰绿下1, 橙左1, 黑上2, 紫左1, 白下2, 紫左2, 黑下2, 橙右3, 紫左1, 灰绿上2, 红左3, 黑下到底。
    name: "警车出库 IV（下出口）",
    optimal: 12,
    exit: { side: "bottom", lane: 3 },
    cars: [
      { id: "X", x: 3, y: 2, len: 2, dir: "v" }, // 黑色警车（目标）
      { id: "A", x: 1, y: 1, len: 3, dir: "h" }, // 橙色长卡车（顶部）
      { id: "B", x: 2, y: 2, len: 3, dir: "v" }, // 灰绿色长车（警车左侧）
      { id: "C", x: 4, y: 2, len: 2, dir: "h" }, // 紫车（警车右侧）
      { id: "D", x: 5, y: 0, len: 2, dir: "v" }, // 白色救护车（右上角）
      { id: "E", x: 3, y: 4, len: 3, dir: "h" }, // 红色长卡车（底部带条纹）
    ],
  },

  {
    // 图片题库⑤：目标=黑色警车（竖），出口在底部第 4 列（向下开出）。
    // 参考解：红灰左1, 绿灰下3, 黑下1, 绿右3, 黑上2, 黄1右3, 橙上2, 红灰左2, 黄2左1, 黑下到底。
    name: "警车出库 V（下出口）",
    optimal: 10,
    exit: { side: "bottom", lane: 3 },
    cars: [
      { id: "X", x: 3, y: 1, len: 2, dir: "v" }, // 黑色警车（目标）
      { id: "A", x: 1, y: 1, len: 2, dir: "h" }, // 绿车（左上）
      { id: "B", x: 1, y: 2, len: 2, dir: "h" }, // 黄1（黄色出租车，左）
      { id: "C", x: 1, y: 3, len: 3, dir: "v" }, // 橙色长卡车（左侧）
      { id: "D", x: 2, y: 5, len: 2, dir: "h" }, // 黄2（底部黄色出租车）
      { id: "E", x: 3, y: 4, len: 3, dir: "h" }, // 红头灰身长卡车（行5）
      { id: "F", x: 5, y: 0, len: 3, dir: "v" }, // 绿头灰身长车（右侧列6）
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
