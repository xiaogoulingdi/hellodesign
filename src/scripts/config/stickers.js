const stickerUrl = (name) => new URL(`../../assets/stickers/${name}`, import.meta.url).href;

export const stickerConfig = [
  "s_01.png",
  "s_02.png",
  "s_03.png",
  "s_04.png",
  "s_05.png",
  "s_06.png",
  "s_07.png",
  "s_08.png",
  "s_09.png",
  "s_10.png",
  "s_11.png",
  "s_12.png"
].map((name, index) => ({
  src: stickerUrl(name),
  index,
  size: 76 + ((index * 37) % 76),
  x: 0.08 + ((index * 0.173) % 0.84),
  delay: (index % 6) * 0.055,
  drift: ((index * 41) % 160) - 80,
  rotation: ((index * 71) % 160) - 80,
  speed: 0.74 + ((index * 17) % 42) / 100
}));
