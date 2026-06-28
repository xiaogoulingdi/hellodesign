# hellodesign

A layered WebGL portfolio study based on the interaction language of `haoqi.design`. The page uses a fixed viewport and a virtual scroll timeline to move through the hero, biography, work grid, hyperspace statement, and contact scenes.

The repository currently contains locally downloaded public assets from the reference site. Keep or publish those assets only when you have the appropriate permission.

## Stack

- Vite 8
- Three.js 0.185
- Native ES modules
- Canvas 2D for screen-space effects
- CSS and semantic HTML for text and layout

## Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

Production build:

```bash
npm run build
npm run serve
```

The deployable output is written to `dist/`.

## Layered Architecture

```text
src/
  index.html                     Text, links, scene markup
  styles.css                     Layout, theme, typography, responsive rules
  assets/
    audio/                       Background audio
    fonts/                       Local typefaces
    images/                      Portrait and global images
    models/                      hello.gltf, cursor.glb, cnt.gltf
    stickers/                    Falling sticker PNG files
    work/                        Portfolio thumbnails
  scripts/
    main.js                      Application bootstrap and render loop
    config/
      site.js                    Timeline ranges and theme defaults
      stickers.js                Sticker assets and particle parameters
    layers/
      scene-layer.js             DOM scene visibility and transitions
      webgl-layer.js             Three.js models, lights, and materials
      fx-layer.js                Halftone, pointer glow, and hyperspace lines
      sticker-layer.js           Image-based falling sticker animation
    state/
      timeline-state.js          Wheel, touch, keyboard, pointer state
      theme-state.js             System/dark/light theme manager
    ui/
      hud.js                     Clock, pointer readout, sound, navigation
    utils/
      canvas.js
      math.js
```

Each layer reads the shared timeline state and owns only its own rendering. Text can be edited without touching WebGL, and assets can be replaced without changing the timeline code.

## Common Edits

- Page text and links: `src/index.html`
- Scroll duration and scene boundaries: `src/scripts/config/site.js`
- Sticker files and fall behavior: `src/scripts/config/stickers.js`
- 3D color, lighting, model scale: `src/scripts/layers/webgl-layer.js`
- Speed lines, halftone, pointer glow: `src/scripts/layers/fx-layer.js`
- Scene transitions and work-grid travel: `src/scripts/layers/scene-layer.js`
- Fonts, spacing, mobile layout: `src/styles.css`

Replace assets in their matching folders and keep the same filenames, or update the corresponding path in HTML/config.

## Input

- Mouse wheel and trackpad: move the virtual timeline
- Touch drag: move the virtual timeline on mobile
- Arrow/Page/Home/End keys: keyboard navigation
- Pointer movement: camera parallax, lighting, and pixel trail
- `THEME[A/D/L]`: automatic, dark, and light theme modes
- `SOUND[\/-]`: local background audio toggle

## Deployment

The GitHub Pages workflow builds `dist/` from `main`. This local revision has not been pushed; review it locally before publishing.
