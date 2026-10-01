/**
 * Measures every image under public/images and writes their sizes to
 * src/generated/image-sizes.json ({ "/images/plates/plate-01.jpg": [356, 584] }),
 * so an image added through the CMS needs no hand-entered width and height.
 * Run by Vite as it starts (vite.config.ts), and before tests and the model
 * check (package.json). Reads PNG and JPEG headers
 * only; any other file is skipped.
 *
 *   node scripts/measure-images.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public", import.meta.url));

/** [width, height] from a PNG or JPEG's bytes, or null. */
export function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47)
    return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        i += 2;
        continue;
      }
      const length = buf.readUInt16BE(i + 2);
      // SOF0–SOF15, except DHT (C4), JPG (C8) and DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      i += 2 + length;
    }
  }
  return null;
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)],
  );
}

/** Measures every image and writes src/generated/image-sizes.json; returns how many. */
export function measureImages() {
  const sizes = {};
  for (const file of walk(join(root, "images")).sort()) {
    if (!/\.(png|jpe?g)$/i.test(file)) continue;
    const size = imageSize(readFileSync(file));
    if (!size) throw new Error(`can't read the size of ${file}`);
    sizes["/" + relative(root, file).split("\\").join("/")] = size;
  }
  const out = new URL("../src/generated/image-sizes.json", import.meta.url);
  mkdirSync(new URL(".", out), { recursive: true });
  writeFileSync(out, JSON.stringify(sizes, null, 2) + "\n");
  return Object.keys(sizes).length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`measured ${measureImages()} images`);
}
