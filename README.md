# 我的个人网站（静态版）

一个纯静态的个人作品集网站：黑色主题、渐变强调色、全屏特效背景、五个板块（关于 / 工作经历 / 项目作品 / 方法沉淀 / 联系）。
**零构建、零依赖**——改完直接部署 GitHub Pages。

---

## 一、文件结构

```
personal-website/
├── index.html                     ← 所有文字内容都在这里改
├── assets/
│   ├── css/style.css              ← 配色、字号、间距、响应式
│   ├── js/main.js                 ← 导航、动画、雨效、手风琴
│   └── img/
│       ├── favicon.svg            ← 浏览器标签页图标
│       └── qr-placeholder.svg     ← 二维码占位图（换成你自己的）
├── .nojekyll                      ← 让 GitHub Pages 不做 Jekyll 处理，保留原样
└── README.md
```

## 二、本地预览

在 `personal-website` 目录下执行：

```bash
python3 -m http.server 8000
```

然后浏览器打开 <http://localhost:8000/>。改完文件刷新页面即可，不用重启。

> 也可以直接双击 `index.html`，但用本地服务更接近线上环境（相对路径、图片加载都一致）。

## 三、要替换的内容清单

`index.html` 里所有 **【…】** 都是占位内容，按顺序替换即可。搜索 `【` 可以快速定位。

| 位置 | 改什么 | 说明 |
| --- | --- | --- |
| `<head>` | `<title>`、`description` | 标签页标题与分享摘要 |
| 导航 `.brand` | 姓名、职位 | 右上角「联系我」按钮指向 `#contact` |
| 首屏 Hero | 小标签、主标题、一句话介绍、两个按钮 | 主标题里 `<span class="grad">…</span>` 是渐变强调词 |
| 首屏数据 `.hero-stats` | 三个数字 | 没有就整块删掉 |
| 首屏浮窗 `.hero-card` | 「最近在做的事」 | 不要可删 |
| 关于 `#about` | 两段自我介绍、技能标签、三条能力主线 | 用具体成果代替形容词 |
| 工作经历 `#experience` | 每张卡片：公司、职位、时间、要点列表 | 复制整段 `<article class="experience-card reveal">` 新增一段 |
| 项目作品 `#projects` | 每个案例：标题、类型、背景、指标、折叠详情、链接 | 复制整个 `<article class="project reveal">` 新增一个案例 |
| 方法沉淀 `#notes` | 每条方法：标题、一句话说明、展开内容 | 复制整个 `<article class="note reveal">` 新增一条 |
| 联系 `#contact` | 邮箱、电话、GitHub、二维码图片 | 二维码图放 `assets/img/`，再改 `<img src>` |
| 页脚 | 姓名 | 年份由 JS 自动填当前年份 |

**几个小提示**

- 项目卡右侧色块：想放真实截图就把 `<span class="visual-index">01</span>` 换成
  `<img src="assets/img/project-1.png" alt="项目截图">`（样式已写好，自动铺满并裁切）。
- 项目详情的折叠块用的是原生 `<details>`，不需要 JS，去掉 `project-detail` 就变成常显段落。
- 手风琴默认「一次只展开一条」。想允许多条同时展开：打开 `assets/js/main.js`，删掉第 3 节里
  遍历 `notes` 关闭其它条目的那段 `notes.forEach(...)`。
- 链接里的 `href="#"` 记得换成真实地址；站外链接保留 `target="_blank" rel="noopener"`。

## 四、换配色 / 换字体

打开 `assets/css/style.css`，**只改最上面的 `:root` 变量**：

```css
:root {
  --color-iris: #8052ff;    /* 主强调色（按钮、连线、标签） */
  --color-saffron: #ffb829; /* 次强调色（小标题、链接、指标） */
  --color-verdant: #15846e; /* 辅助色（浮窗小标签） */
  --page-max: 1280px;       /* 页面最大宽度 */
  --font-sans: 'Inter', ... "PingFang SC", ...;
}
```

- 想换字体：把 `--font-sans` 换成你自己的字体栈；用 Web Font 就在 `<head>` 加 `<link>`。
- **背景特效一共四层**，从下到上：
  1. `#aurora-canvas`：缓慢漂移的极光光斑（紫 / 琥珀 / 青 / 蓝，叠加混合）
  2. `.bg-glow`：三处径向光晕 + 两条缓慢摆动的光柱（纯 CSS 动画）+ 一层暗压保证文字可读
  3. `#rain-canvas`：斜向雨丝，少量琥珀色
  4. `.cursor-glow`：跟随鼠标的柔光；卡片还有一层跟随指针的高光（`--mx/--my`）

  右下角「特效：开 / 关」按钮一次关掉全部（左下角是「回到顶部」）。
  想彻底删掉背景特效：删 `#aurora-canvas` / `#rain-canvas` / `.cursor-glow` 三个元素，
  以及 `.bg-glow::before/::after` 两条光柱的 CSS 规则即可。
- 不想要首屏动态图形：删掉 `<canvas id="hero-canvas">`，JS 会自动跳过。

## 五、部署到 GitHub Pages

1. 在 GitHub 新建仓库，例如 `personal-website`（public）。
2. 在本目录执行：

   ```bash
   git init
   git add .
   git commit -m "init personal website"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/personal-website.git
   git push -u origin main
   ```

3. 仓库页面 **Settings → Pages**：Source 选 `Deploy from a branch`，Branch 选 `main` + `/ (root)`，保存。
4. 等 1 分钟左右，访问 `https://<你的用户名>.github.io/personal-website/`。

**部署检查清单**

- 所有路径都是相对路径（`assets/...`），仓库改名也不用改代码；只有放在根域名下才建议改成绝对路径。
- GitHub Pages 区分大小写：`assets/Img/` 与 `assets/img/` 是两回事，本地能开、线上 404 通常是这个原因。
- `.nojekyll` 必须提交，否则以下划线开头的文件/目录会被 Jekyll 忽略。
- 更新后浏览器看到的还是旧样式：强制刷新（macOS `Cmd + Shift + R`）。
- 想绑自己的域名：Settings → Pages → Custom domain，并在域名商处加 CNAME 记录。

## 六、常见问题

**页面在本地正常，部署后样式全丢？**
多数是路径大小写不一致，或没有提交 `assets/` 目录（检查 `git status`）。

**手机上打开字被切掉？**
不会——已在 1440 / 1080 / 860 / 560 四个断点验证过。若你新增了固定宽度（如 `width: 1200px`）的元素，改成 `max-width`。

**动画有点多 / 系统开了「减少动态效果」？**
样式表已适配 `prefers-reduced-motion: reduce`，系统开启后会自动关闭入场动画与雨效。

---

## 附：站内链接页

| 文件 | 内容 | 入口 |
| --- | --- | --- |
| `workflows/youth-portrait-workflow.html` | 年轻化人像工作流（32 节点 / 40 连线，可点节点看参数、可下载 JSON） | 案例 01 与「工作经历」第一张卡 |
| `workflows/face-mask-workflow.html` | Mask 工作流（10 节点 / 12 连线：SAM2 → 裁脸 → MorphFace → 合成遮罩 → ProRes） | 同上 |
| `workflows/model-selection.html` | 年轻化底模模型选型（6 个候选模型、5 维加权评分、最终结论） | 同上 |

两个工作流页是自包含的离线展示版，右下角加了「← 返回作品集」回到 `index.html#case-youth`。
模型选型页是站内页（飞书原文需要登录，访客打不开，所以本地化了一份）。

> ⚠️ 这两个工作流页包含影视剧原始画面与人脸参考图，模型选型页包含项目内部评测数据。
> 上线前请确认这些素材可以公开；如不能，改成打码版或撤掉链接。
