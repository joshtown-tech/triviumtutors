// Renders the mark to the PNG sizes browsers and social cards want.
import sharp from "sharp";
import { readFileSync } from "node:fs";
const svg = readFileSync("public/brand/trivium-mark.svg");
for (const [name, size] of [["trivium-mark-512.png", 512], ["apple-icon.png", 180]]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(name === "apple-icon.png" ? `src/app/${name}` : `public/brand/${name}`);
}
console.log("icons written");
