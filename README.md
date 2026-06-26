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
    script.js
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

For quick iteration, you can also open `src/index.html` directly in a browser.

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
