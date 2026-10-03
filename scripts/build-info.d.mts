/** The short commit SHA: Vercel's, else git's, else "local". */
export function resolveSha(env?: Record<string, string | undefined>, git?: () => string): string;
/** The build's date in UTC, YYYY-MM-DD. */
export function buildDate(now?: Date): string;
export function writeBuildInfo(): { sha: string; date: string };
