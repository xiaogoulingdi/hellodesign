# Hello Design / Haoqi Design Clone

[中文](../zh/README.md) | [Back to root](../../README.md)

This is a high-fidelity clone study inspired by the visual language of [Haoqi Wen](https://haoqi.design/)'s personal website. The project focuses on recreating the homepage's glass/liquid 3D typography, curtain-like lighting, falling sticker motion, pointer interaction, scroll narrative, and arrow-driven transition effects.

Haoqi Wen announced the original personal website on X: [x.com/wenhaoqi/status/2068327540595552355](https://x.com/wenhaoqi/status/2068327540595552355). After the launch, many people in the creative coding and frontend community started studying and recreating the site. This project is a learning-oriented reconstruction for exploring WebGL, FBO refraction, Three.js, Canvas 2D, and motion choreography in polished portfolio websites.

## Links

- Original website: [haoqi.design](https://haoqi.design/)
- Clone demo: [xiaogoulingdi.github.io/hellodesign](https://xiaogoulingdi.github.io/hellodesign/)
- Original author: [Haoqi Wen](https://haoqi.design/)
- Launch post: [Haoqi Wen on X](https://x.com/wenhaoqi/status/2068327540595552355)
- Example original work pages: [Inspire Mono](https://haoqi.design/inspire_mono), [WASM Design Utils](https://haoqi.design/wasm_design_utils)

## Homepage Comparison

![Original vs clone homepage](../screenshots/comparison-home.png)

## Original Homepage Screenshot

![Original haoqi.design homepage](../screenshots/haoqi-original-home.png)

## Clone Homepage Screenshot

![Hello Design clone homepage](../screenshots/hellodesign-clone-home.png)

## Stack

- Vite
- Three.js
- Native ES modules
- Canvas 2D screen-space effects
- CSS / semantic HTML
- Virtual scroll timeline

## Development

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

## Note

This repository is a learning and research-oriented clone. Please respect the original designer's work and copyright. Do not use downloaded proprietary assets, private resources, full production bundles, or unauthorized materials for commercial redistribution.

