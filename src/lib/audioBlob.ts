const buffers = new Map<string, ArrayBuffer>();
const blobUrls = new Map<string, string>();
const inflight = new Map<string, Promise<ArrayBuffer>>();

/** Same-origin fetch so the clipper can decode. Cached per src. */
export function loadAudioBuffer(src: string): Promise<ArrayBuffer> {
  const hit = buffers.get(src);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(src);
  if (pending) return pending;
  const job = fetch(src, { cache: "force-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`audio ${res.status}`);
      return res.arrayBuffer();
    })
    .then((buf) => {
      buffers.set(src, buf);
      inflight.delete(src);
      return buf;
    })
    .catch((err) => {
      inflight.delete(src);
      throw err;
    });
  inflight.set(src, job);
  return job;
}

/** Warm the cache from the player so a later share does not wait on the wire. */
export function primeAudioBuffer(src: string) {
  void loadAudioBuffer(src).catch(() => {});
}

export async function audioBlobUrl(src: string): Promise<string> {
  const existing = blobUrls.get(src);
  if (existing) return existing;
  const buf = await loadAudioBuffer(src);
  const url = URL.createObjectURL(new Blob([buf]));
  blobUrls.set(src, url);
  return url;
}
