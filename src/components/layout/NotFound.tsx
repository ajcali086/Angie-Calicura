import { Link } from "@tanstack/react-router";
import { SiteShell } from "./SiteShell";

export function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="kicker">Not in the record</p>
        <h1 className="mt-4 font-display text-4xl text-paper">Nothing at this address</h1>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center bg-brass px-5 text-sm tracking-[0.14em] text-ink uppercase"
        >
          Return home
        </Link>
      </div>
    </SiteShell>
  );
}
