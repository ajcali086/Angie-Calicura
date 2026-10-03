import { claimMotion, reducedMotion } from "./motionBudget";

/**
 * Ref for a plate image: fades it in (0.4s, styles.css) once it has loaded.
 * An image already loaded, or one rendered before script runs, shows at once.
 */
export function fadeIn(img: HTMLImageElement | null) {
  if (!img || img.complete || img.dataset.fade || reducedMotion()) return;
  img.dataset.fade = "pending";
  // Shares the two animation slots with the passage reveal.
  const done = () => (img.dataset.fade = claimMotion(400) ? "shown" : "instant");
  img.addEventListener("load", done, { once: true });
  img.addEventListener("error", done, { once: true });
}
