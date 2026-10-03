const FADE = 0.04;

function fade(channel: Float32Array, sampleRate: number) {
  const n = Math.min(channel.length, Math.floor(FADE * sampleRate));
  if (n <= 1) return;
  for (let i = 0; i < n; i++) {
    const g = i / (n - 1);
    channel[i] *= g;
    channel[channel.length - 1 - i] *= g;
  }
}

export function encodePcmWav(channels: Float32Array[], sampleRate: number): Blob {
  const ch = channels.length;
  const frames = channels[0]?.length ?? 0;
  const bytesPerSample = 2;
  const block = ch * bytesPerSample;
  const dataSize = frames * block;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  const ascii = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, ch, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * block, true);
  view.setUint16(32, block, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, dataSize, true);
  let o = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Blob([out], { type: "audio/wav" });
}

/** 16-bit PCM WAV from an AudioBuffer already sliced. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
    buffer.getChannelData(i),
  );
  return encodePcmWav(channels, buffer.sampleRate);
}

export async function slicePassageWav(
  encoded: ArrayBuffer,
  start: number,
  end: number,
  ctx: AudioContext,
): Promise<Blob> {
  const decoded = await ctx.decodeAudioData(encoded.slice(0));
  const rate = decoded.sampleRate;
  const from = Math.max(0, Math.floor(start * rate));
  const to = Math.min(decoded.length, Math.floor(end * rate));
  if (to - from < rate * 0.2) throw new Error("clip too short");
  const frames = to - from;
  const out = ctx.createBuffer(decoded.numberOfChannels, frames, rate);
  for (let c = 0; c < decoded.numberOfChannels; c++) {
    const slice = decoded.getChannelData(c).subarray(from, to);
    out.copyToChannel(slice, c);
    fade(out.getChannelData(c), rate);
  }
  return encodeWav(out);
}
