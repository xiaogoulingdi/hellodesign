# Hello Design / Haoqi Design Clone

[English](../en/README.md) | [返回首页](../../README.md)

这是一个基于 [Haoqi Wen](https://haoqi.design/) 个人网站视觉语言的高保真复刻实验，重点复刻 `haoqi.design` 首页中的玻璃/液体 3D 字体、背景幕布光影、表情贴纸飘落、鼠标交互、滚动叙事和箭头转场效果。

原作者 Haoqi Wen 在 X 上发布了他的个人网站：[x.com/wenhaoqi/status/2068327540595552355](https://x.com/wenhaoqi/status/2068327540595552355)。发布之后，社区里已经有不少人围绕这个网站进行了学习和复刻。本项目也是一次学习型复刻，用来研究高端个人网站里的 WebGL、FBO 折射、Three.js、Canvas 2D 和动效编排。

## 链接

- 原版网站：[haoqi.design](https://haoqi.design/)
- 复刻主页：[xiaogoulingdi.github.io/hellodesign](https://xiaogoulingdi.github.io/hellodesign/)
- 原作者主页：[Haoqi Wen](https://haoqi.design/)
- 参考发布：[Haoqi Wen on X](https://x.com/wenhaoqi/status/2068327540595552355)
- 原作者作品页示例：[Inspire Mono](https://haoqi.design/inspire_mono)、[WASM Design Utils](https://haoqi.design/wasm_design_utils)

## 首页对比

![Original vs clone homepage](../screenshots/comparison-home.png)

## 原版首页截图

![Original haoqi.design homepage](../screenshots/haoqi-original-home.png)

## 复刻版首页截图

![Hello Design clone homepage](../screenshots/hellodesign-clone-home.png)

## 技术栈

- Vite
- Three.js
- Native ES modules
- Canvas 2D screen-space effects
- CSS / semantic HTML
- Virtual scroll timeline

## 项目结构

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

## 本地开发

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

## 说明

本仓库是学习与研究用途的复刻项目。请尊重原作者的设计与版权，不要将原站下载素材、私有资源、完整生产 bundle 或未经授权的内容用于商业发布。

