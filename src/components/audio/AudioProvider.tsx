import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { PARTS, blockWindow, cueAt, partDuration, type Cue, type PartId } from "@/data/audio";

/**
 * One <audio> element for the whole site, mounted at the root so playback
 * carries on across page changes. Playback state lives in a small store;
 * components read it through useAudio(selector) and re-render only when
 * what they selected changes, so a chapter page doesn't re-render at every
 * clock tick, only when the spoken sentence does.
 */
export type AudioSnapshot = {
  part: PartId | null;
  playing: boolean;
  time: number;
  rate: number;
  follow: boolean;
  cue: Cue | null;
};

type Store = {
  get: () => AudioSnapshot;
  set: (patch: Partial<AudioSnapshot>) => void;
  subscribe: (fn: () => void) => () => void;
};

function createStore(initial: AudioSnapshot): Store {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      const next = { ...state, ...patch };
      if (patch.part !== undefined || patch.time !== undefined) {
        next.cue = next.part ? cueAt(next.part, next.time) : null;
      }
      state = next;
      listeners.forEach((fn) => fn());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

type Controls = {
  play: (part: PartId, at?: number) => void;
  playBlock: (block: string) => boolean;
  toggle: () => void;
  seek: (time: number) => void;
  skip: (delta: number) => void;
  setRate: (rate: number) => void;
  setFollow: (follow: boolean) => void;
  step: (direction: 1 | -1) => void;
  close: () => void;
};

const StoreContext = createContext<Store | null>(null);
const ControlsContext = createContext<Controls | null>(null);

const SAVED = "angie-audio";

export function AudioProvider({ children }: { children: ReactNode }) {
  const store = useMemo(
    () => createStore({ part: null, playing: false, time: 0, rate: 1, follow: true, cue: null }),
    [],
  );
  const audio = useRef<HTMLAudioElement>(null);
  // With preload="none" a new source has no metadata (and can't seek) until
  // playback starts, so a seek asked for before then waits here and is
  // applied on loadedmetadata.
  const pendingSeek = useRef<number | null>(null);

  // Restore where the listener left off, paused.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED) ?? "null") as {
        part?: PartId;
        time?: number;
        rate?: number;
      } | null;
      if (saved?.part && PARTS.some((p) => p.id === saved.part)) {
        const el = audio.current!;
        el.src = PARTS.find((p) => p.id === saved.part)!.src;
        pendingSeek.current = saved.time ?? 0;
        el.playbackRate = saved.rate ?? 1;
        store.set({ part: saved.part, time: saved.time ?? 0, rate: saved.rate ?? 1 });
      }
    } catch {
      // No storage: start fresh.
    }
  }, [store]);

  // Keep the store's clock in step while playing (timeupdate alone is ~4 Hz).
  useEffect(() => {
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      const el = audio.current;
      if (el && !el.paused && pendingSeek.current == null && now - last > 100) {
        last = now;
        store.set({ time: el.currentTime });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const save = () => {
      const { part, time, rate } = store.get();
      try {
        if (part) localStorage.setItem(SAVED, JSON.stringify({ part, time, rate }));
        else localStorage.removeItem(SAVED);
      } catch {
        // ignore
      }
    };
    const timer = window.setInterval(save, 5000);
    window.addEventListener("pagehide", save);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [store]);

  const controls = useMemo<Controls>(() => {
    const el = () => audio.current!;
    const moveTo = (a: HTMLAudioElement, time: number) => {
      if (a.readyState >= 1) a.currentTime = time;
      else pendingSeek.current = time;
    };
    const play = (part: PartId, at = 0) => {
      const a = el();
      const src = PARTS.find((p) => p.id === part)!.src;
      if (!a.src.endsWith(src)) {
        a.src = src;
        pendingSeek.current = at;
      } else {
        moveTo(a, at);
      }
      a.playbackRate = store.get().rate;
      void a.play().catch(() => store.set({ playing: false }));
      store.set({ part, time: at, follow: true });
    };
    return {
      play,
      playBlock: (block) => {
        const w = blockWindow(block);
        if (!w) return false;
        play(w.part, w.start);
        return true;
      },
      toggle: () => {
        const a = el();
        const { part } = store.get();
        if (!part) return play(PARTS[0].id, 0);
        if (a.paused) void a.play().catch(() => store.set({ playing: false }));
        else a.pause();
      },
      seek: (time) => {
        const t = Math.max(0, time);
        moveTo(el(), t);
        store.set({ time: t });
      },
      skip: (delta) => {
        const a = el();
        const now = a.readyState >= 1 ? a.currentTime : (pendingSeek.current ?? store.get().time);
        const t = Math.max(0, Math.min((a.duration || Infinity) - 0.1, now + delta));
        moveTo(a, t);
        store.set({ time: t });
      },
      setRate: (rate) => {
        el().playbackRate = rate;
        store.set({ rate });
      },
      setFollow: (follow) => store.set({ follow }),
      step: (direction) => {
        const { part } = store.get();
        const i = PARTS.findIndex((p) => p.id === part);
        const next = PARTS[i + direction];
        if (next) play(next.id, 0);
      },
      close: () => {
        const a = el();
        a.pause();
        a.removeAttribute("src");
        a.load();
        store.set({ part: null, playing: false, time: 0 });
        try {
          localStorage.removeItem(SAVED);
        } catch {
          // ignore
        }
      },
    };
  }, [store]);

  const onEnded = useCallback(() => {
    const { part } = store.get();
    const i = PARTS.findIndex((p) => p.id === part);
    if (i >= 0 && i < PARTS.length - 1) controls.play(PARTS[i + 1].id, 0);
    else store.set({ playing: false });
  }, [controls, store]);

  return (
    <StoreContext.Provider value={store}>
      <ControlsContext.Provider value={controls}>
        {children}
        <audio
          ref={audio}
          preload="none"
          onLoadedMetadata={() => {
            const a = audio.current!;
            if (pendingSeek.current != null) {
              a.currentTime = pendingSeek.current;
              pendingSeek.current = null;
            }
            a.playbackRate = store.get().rate;
          }}
          onPlay={() => store.set({ playing: true })}
          onPause={() => store.set({ playing: false, time: audio.current?.currentTime ?? 0 })}
          onSeeked={() => store.set({ time: audio.current?.currentTime ?? 0 })}
          onEnded={onEnded}
        />
      </ControlsContext.Provider>
    </StoreContext.Provider>
  );
}

/** Read one value from the audio state; re-renders only when it changes. */
export function useAudio<T>(select: (s: AudioSnapshot) => T): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAudio needs <AudioProvider>");
  const server = useMemo(
    () => select({ part: null, playing: false, time: 0, rate: 1, follow: true, cue: null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- server snapshot is the fixed initial state
    [],
  );
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => server,
  );
}

export function useAudioControls(): Controls {
  const controls = useContext(ControlsContext);
  if (!controls) throw new Error("useAudioControls needs <AudioProvider>");
  return controls;
}

export const partLength = partDuration;
