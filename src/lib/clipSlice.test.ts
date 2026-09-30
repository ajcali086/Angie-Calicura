import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { encodePcmWav } from "./clipSlice.ts";

describe("encodePcmWav", () => {
  it("writes a 16-bit PCM WAV header", async () => {
    const left = new Float32Array([0, 0.5, -0.5, 1]);
    const blob = encodePcmWav([left], 44100);
    assert.equal(blob.type, "audio/wav");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const ascii = (from: number, n: number) => String.fromCharCode(...bytes.slice(from, from + n));
    const view = new DataView(bytes.buffer);
    assert.equal(ascii(0, 4), "RIFF");
    assert.equal(ascii(8, 4), "WAVE");
    assert.equal(ascii(12, 4), "fmt ");
    assert.equal(view.getUint16(20, true), 1);
    assert.equal(view.getUint16(22, true), 1);
    assert.equal(view.getUint32(24, true), 44100);
    assert.equal(view.getUint16(34, true), 16);
    assert.equal(ascii(36, 4), "data");
    assert.equal(view.getUint32(40, true), 4 * 2);
    assert.equal(bytes.byteLength, 44 + 8);
  });
});
