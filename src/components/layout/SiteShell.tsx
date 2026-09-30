import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PlayerSpacer } from "@/components/audio/PlayerBar";
import { ReadingProgress, SkipLink } from "./ReadingChrome";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="velvet flex min-h-dvh flex-col">
      <SkipLink />
      <ReadingProgress />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
      <PlayerSpacer />
    </div>
  );
}
