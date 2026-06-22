# 移车出库 · Rush Hour 停车场迷宫

一个纯前端实现的经典滑块益智游戏（又称 Rush Hour / 停车场迷宫 / moving the vehicle out of the garage）。
在 6×6 的停车场里移动挡路的车辆，把 **红色目标车** 从右侧出口开出去。

🎮 在线试玩（作为 GitHub Pages 首页）：`https://xukaigao.github.io/`

## 玩法

- 横向的车只能左右移动，纵向的车只能上下移动。
- **拖动** 车辆滑到目标位置，或 **点击** 车辆让它朝出口方向移动一格。
- 让红色车抵达棋盘最右侧即通关。
- 目标：用尽量少的步数过关。

## 功能

- 11 个由易到难的关卡，可自由切换 / 选择
- 步数统计、计时
- 撤销（快捷键 `Z`）、重置（快捷键 `R`）
- 通关动画与成绩展示，本地保存每关最佳步数
- 内置 BFS 求解器，启动时自动校验每关可解并计算理论最优步数
- 自适应桌面与手机（支持触屏拖动）

## 本地运行

直接用浏览器打开 `index.html` 即可（无需构建、无依赖）。
或启动一个本地静态服务器：

```bash
# Python
python -m http.server 8000
# 然后访问 http://localhost:8000
```

## 部署为 GitHub Pages 首页

本项目是纯静态站点，把 `index.html`、`css/`、`js/` 放到 `xukaigao.github.io` 仓库的**根目录**即可，
访问 `https://xukaigao.github.io/` 就是这个游戏。在你本机的 PowerShell 里执行：

```powershell
# 1. 克隆你的用户站点仓库到本地某处
cd C:\gxk\11Code
git clone https://github.com/xukaigao/xukaigao.github.io.git
cd xukaigao.github.io

# 2. 用游戏文件替换原有首页内容（保留 .git）
Get-ChildItem -Force -Exclude .git | Remove-Item -Recurse -Force
Copy-Item -Path "C:\gxk\11Code\RushHourGame\*" -Destination . -Recurse -Force

# 3. 提交并推送
git add -A
git commit -m "Replace homepage with Rush Hour parking maze game"
git push
```

推送后等待 1~2 分钟，访问 `https://xukaigao.github.io/` 即可游玩。

> 若仓库 Pages 还没开启：GitHub 仓库 → Settings → Pages → Source 选 `Deploy from a branch`，
> 分支选 `main`（或 `master`）、目录选 `/ (root)`，保存即可。

## 文件结构

```
RushHourGame/
├── index.html      # 页面结构
├── css/style.css   # 样式
└── js/
    ├── levels.js   # 关卡数据
    └── game.js     # 游戏逻辑 + BFS 求解器
```

## 自定义关卡

编辑 `js/levels.js`，每辆车用 `{ id, x, y, len, dir }` 描述：

- `id`：唯一标识，`"X"` 表示红色目标车（必须水平、长度 2、位于第 3 行）。
- `x` / `y`：车头（最左 / 最上格）坐标，从 0 开始。
- `len`：车身长度（2 或 3）。
- `dir`：`"h"` 水平 / `"v"` 垂直。

保存后刷新页面，启动时的校验器会自动检查该关是否可解。
