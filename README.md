# Hello Design / Haoqi Design Clone

> 中文说明在前，English version follows.

## 中文

这是一个基于 [Haoqi Wen](https://haoqi.design/) 个人网站视觉语言的高保真复刻实验，重点复刻 `haoqi.design` 首页中的玻璃/液体 3D 字体、背景幕布光影、表情贴纸飘落、鼠标交互、滚动叙事和箭头转场效果。

原作者 Haoqi Wen 在 X 上发布了他的个人网站：[x.com/wenhaoqi/status/2068327540595552355](https://x.com/wenhaoqi/status/2068327540595552355)。发布之后，社区里已经有不少人围绕这个网站进行了学习和复刻。本项目也是一次学习型复刻，用来研究高端个人网站里的 WebGL、FBO 折射、Three.js、Canvas 2D 和动效编排。

- 原版网站：[haoqi.design](https://haoqi.design/)
- 复刻主页：[xiaogoulingdi.github.io/hellodesign](https://xiaogoulingdi.github.io/hellodesign/)
- 原作者主页：[Haoqi Wen](https://haoqi.design/)
- 参考发布：[Haoqi Wen on X](https://x.com/wenhaoqi/status/2068327540595552355)

### 首页对比

![Original vs clone homepage](docs/screenshots/comparison-home.png)

### 原版首页截图

![Original haoqi.design homepage](docs/screenshots/haoqi-original-home.png)

### 复刻版首页截图

![Hello Design clone homepage](docs/screenshots/hellodesign-clone-home.png)

### 技术栈

- Vite
- Three.js
- Native ES modules
- Canvas 2D screen-space effects
- CSS / semantic HTML
- Virtual scroll timeline

### 项目结构

```text
src/
  index.html
  styles.css
  assets/
    audio/
    fonts/
    images/
    models/
    stickers/
    work/
  scripts/
    main.js
    config/
    layers/
    state/
    ui/
    utils/
```

### 本地开发

```bash
npm install
npm run dev
```

默认打开：

```text
http://127.0.0.1:5173/
```

生产构建：

```bash
npm run build
npm run serve
```

构建输出位于 `dist/`。

### 说明

本仓库是学习与研究用途的复刻项目。请尊重原作者的设计与版权，不要将原站下载素材、私有资源、完整生产 bundle 或未经授权的内容用于商业发布。

## English

This is a high-fidelity clone study inspired by the visual language of [Haoqi Wen](https://haoqi.design/)'s personal website. The project focuses on recreating the homepage's glass/liquid 3D typography, curtain-like lighting, falling sticker motion, pointer interaction, scroll narrative, and arrow-driven transition effects.

Haoqi Wen announced the original personal website on X: [x.com/wenhaoqi/status/2068327540595552355](https://x.com/wenhaoqi/status/2068327540595552355). After the launch, many people in the creative coding and frontend community started studying and recreating the site. This project is a learning-oriented reconstruction for exploring WebGL, FBO refraction, Three.js, Canvas 2D, and motion choreography in polished portfolio websites.

- Original website: [haoqi.design](https://haoqi.design/)
- Clone demo: [xiaogoulingdi.github.io/hellodesign](https://xiaogoulingdi.github.io/hellodesign/)
- Original author: [Haoqi Wen](https://haoqi.design/)
- Launch post: [Haoqi Wen on X](https://x.com/wenhaoqi/status/2068327540595552355)

### Homepage Comparison

![Original vs clone homepage](docs/screenshots/comparison-home.png)

### Original Homepage Screenshot

![Original haoqi.design homepage](docs/screenshots/haoqi-original-home.png)

### Clone Homepage Screenshot

![Hello Design clone homepage](docs/screenshots/hellodesign-clone-home.png)

### Stack

- Vite
- Three.js
- Native ES modules
- Canvas 2D screen-space effects
- CSS / semantic HTML
- Virtual scroll timeline

### Development

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Production build:

```bash
npm run build
npm run serve
```

The deployable output is written to `dist/`.

### Note

This repository is a learning and research-oriented clone. Please respect the original designer's work and copyright. Do not use downloaded proprietary assets, private resources, full production bundles, or unauthorized materials for commercial redistribution.
