# hellodesign

A small personal homepage prototype with a glowing handwritten `hello`, scroll-driven motion, pointer-reactive highlights, and an editorial portfolio layout.

## Features

- Full-screen layered canvas rendering
- Pointer-driven light bloom, specular highlights, and dot noise
- Scroll-driven `hello` transform and late-stage falling sticker effect
- Dark editorial homepage layout with fixed navigation and status HUD
- Zero runtime dependencies
- Simple `npm run build` output to `dist/`

## Project Structure

```text
hellodesign/
  src/
    index.html
    styles.css
    scripts/
      main.js
      config/
        site.js
        stickers.js
      layers/
        background-layer.js
        hello-layer.js
        sticker-layer.js
        light-layer.js
      state/
        app-state.js
        theme-state.js
      ui/
        hud.js
      utils/
        canvas.js
        math.js
    assets/
      fonts/
      images/
      stickers/
      textures/
  scripts/
    build.mjs
    clean.mjs
    serve.mjs
  docs/
    screenshots/
  dist/
```

## Development

Build the site:

```bash
npm run build
```

Serve the built files locally:

```bash
npm run serve
```

Then open `http://localhost:4173`.

For quick iteration against source files:

```bash
npm run dev
```

Because the code uses ES modules, use the local server instead of opening `src/index.html` with `file://`.

## Editing Guide

Common things to change:

- Handwritten text and font stack: `src/scripts/config/site.js`
- Sticker positions, type, colors, and timing inputs: `src/scripts/config/stickers.js`
- Default theme behavior: `src/scripts/config/site.js`
- Handwritten tube rendering: `src/scripts/layers/hello-layer.js`
- Falling sticker drawing: `src/scripts/layers/sticker-layer.js`
- Background grid and base color: `src/scripts/layers/background-layer.js`
- Pointer light and global bloom: `src/scripts/layers/light-layer.js`
- Navigation, clock, theme toggle, and reveal behavior: `src/scripts/ui/hud.js`

Asset folders are intentionally empty and tracked with `.gitkeep` files:

- `src/assets/fonts/`
- `src/assets/images/`
- `src/assets/stickers/`
- `src/assets/textures/`

Put future replacement fonts, emoji art, portraits, stickers, and texture images there.

## Interaction Notes

The visual effect is split into three canvas layers:

- `background-canvas`: grid, base color, subtle motion
- `hello-canvas`: handwritten tube lettering, highlights, halftone texture, falling stickers
- `light-canvas`: global pointer bloom and screen-space noise

The `hello` layer responds to two inputs:

- Pointer position changes local highlights and bloom.
- Scroll progress changes position, rotation, scale, stretch, and sticker visibility.

## Deployment

The generated `dist/` folder can be deployed to any static host, including GitHub Pages, Netlify, Vercel, or Cloudflare Pages.

This repository includes a GitHub Pages workflow. Push to `main`, enable Pages with **GitHub Actions** as the source, and the workflow will build and publish `dist/`.

## Screenshots

- `docs/screenshots/preview.png`
- `docs/screenshots/preview-scroll.png`
