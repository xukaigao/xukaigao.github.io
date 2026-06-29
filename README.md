# 🎮 游戏厅 · xukaigao.github.io

这是 GitHub Pages **用户站点**（`https://xukaigao.github.io/`）的根目录，作为一个「游戏厅首页」，把多个小游戏汇总在一起，点开就能玩。

> 采用 **方案 B（独立仓库 + 项目站点）**：首页只负责导航，每个游戏放在各自独立的仓库里、各自开启 GitHub Pages，首页按钮链接过去。

## 目录结构

```
xukaigao.github.io/
└── index.html   # 自包含的游戏厅首页（内联 CSS / JS，无外部依赖）
```

## 怎么加一个新游戏

1. 把新游戏做成一个独立仓库（例如 `xukaigao/SnakeGame`），在该仓库 **Settings → Pages** 里开启 Pages（Source 选 `Deploy from a branch`，分支 `main`、目录 `/ (root)`）。
   - 免费版 GitHub：该仓库必须是 **public** 才能发布 Pages。
   - 它的网址会是 `https://xukaigao.github.io/<仓库名>/`（大小写与仓库名一致）。
2. 打开本仓库的 `index.html`，在 `<script>` 里的 `GAMES` 数组中加一项：

```js
{
  emoji: "🐍",
  title: "贪吃蛇",
  en: "Snake",
  desc: "一句话介绍这个游戏。",
  tags: ["休闲", "6+"],
  url: "https://xukaigao.github.io/SnakeGame/",
  ready: true,   // true=可玩；false=显示“即将上线”占位
}
```

3. 提交并推送本仓库即可，首页会自动多出一张卡片。

## 当前已收录的游戏

| 游戏 | 仓库 | 网址 |
|---|---|---|
| 移车出库 Rush Hour | [xukaigao/RushHourGame](https://github.com/xukaigao/RushHourGame) | https://xukaigao.github.io/RushHourGame/ |
| 小朋友连连看 Kids Match | [xukaigao/kidsMatchGame](https://github.com/xukaigao/kidsMatchGame) | https://xukaigao.github.io/kidsMatchGame/ |
| 巧克力对半分 Split Chocolate | [xukaigao/splitChocolate](https://github.com/xukaigao/splitChocolate) | https://xukaigao.github.io/splitChocolate/ |
| 画对称的另一半 Symmetry | [xukaigao/drawSymmetry](https://github.com/xukaigao/drawSymmetry) | https://xukaigao.github.io/drawSymmetry/ |

## 部署 / 上线步骤（重要：注意顺序）

为避免「首页上线了但游戏点进去 404」的尴尬，建议按此顺序：

1. **先让游戏的项目站点活起来**：在 `RushHourGame` 仓库开启 Pages，确认 `https://xukaigao.github.io/RushHourGame/` 能正常打开。
2. **再推送这个首页仓库**。在本机 PowerShell：

```powershell
cd C:\gxk\11Code\xukaigao.github.io
git add -A
git commit -m "Replace root with game arcade homepage (方案 B)"
git push
```

3. 等 1~2 分钟，访问 `https://xukaigao.github.io/` 就是游戏厅首页。

> 说明：`https://xukaigao.github.io/` 和 `https://xukaigao.github.io/RushHourGame/` 是**同一个源（origin）**，
> 所以游戏用 `localStorage` 存的「最佳步数」等记录会自动沿用，不会因为换了网址而丢失。

## 改了文件却看不到更新？（强制刷新）

浏览器会缓存文件，改完普通刷新（`F5`）常常还是旧内容，需要**强制刷新 / 硬刷新**：

- **Windows（Chrome / Edge / Firefox）**：`Ctrl` + `F5`，或 `Ctrl` + `Shift` + `R`
- **Mac（Chrome / Edge / Firefox）**：`Cmd` + `Shift` + `R`
- **Safari（Mac）**：`Cmd` + `Option` + `R`

> 开发时可按 `F12` 打开开发者工具，在 Network 面板勾选 **Disable cache**，保持面板打开即可总是加载最新文件。
