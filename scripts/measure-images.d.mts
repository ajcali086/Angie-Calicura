/** Measures every image and writes src/generated/image-sizes.json; returns how many. */
export function measureImages(): number;
/** [width, height] from a PNG or JPEG's bytes, or null. */
export function imageSize(buf: Uint8Array): [number, number] | null;
