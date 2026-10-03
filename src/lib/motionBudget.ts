/**
 * The spec's ceiling: about three animated elements in view at once. The
 * player's ember can be one, so reveals and plate fades share two slots.
 * An element that finds no slot free is simply shown, without animating.
 */
const SLOTS = 2;
let busyUntil: number[] = [];

/** Claims a slot for `ms`; false if two fades are already running. */
export function claimMotion(ms: number): boolean {
  const now = performance.now();
  busyUntil = busyUntil.filter((t) => t > now);
  if (busyUntil.length >= SLOTS) return false;
  busyUntil.push(now + ms);
  return true;
}

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
