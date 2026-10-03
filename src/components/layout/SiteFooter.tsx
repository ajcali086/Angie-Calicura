import { Link } from "@tanstack/react-router";
import { AuthorLink } from "@/components/AuthorLink";
import { buildInfo } from "@/buildInfo";
import { article } from "@/data/article";
import { nav } from "@/data/nav";

export function SiteFooter() {
  return (
    <footer id="site-footer" className="mt-auto border-t border-rule bg-ink-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md text-sm leading-relaxed text-fog">
          <p>
            <AuthorLink />
            ’s article for Sheridan Wyoming History,{" "}
            <em data-credit>
              presented as a <span className="font-display text-[1.08em]">Museumwright</span> museum
            </em>
            . The text and captions are the author’s.
          </p>
          <p data-adaptation-note className="mt-3">
            Adapted for this museum;{" "}
            <a
              href={article.url}
              className="text-brass underline decoration-current/40 underline-offset-4 hover:text-paper hover:decoration-current"
            >
              read the original, unedited version here
            </a>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] tracking-[0.16em] text-fog uppercase">
          {nav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="flex min-h-11 items-center hover:text-brass"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="border-t border-rule/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 py-4 sm:px-6">
          {/* The exact build on screen, always shown: scripts/build-info.mjs. */}
          <p data-build className="text-[0.62rem] tracking-wide text-muted tabular-nums">
            build {buildInfo.sha} · {buildInfo.date}
          </p>
          {/* The curator's workbench (public/admin/, Sveltia CMS): the CMS's whole public surface. */}
          <a
            href="/admin/index.html"
            data-admin
            className="inline-flex min-h-11 items-center text-[0.68rem] tracking-[0.16em] text-fog/70 uppercase hover:text-brass"
          >
            Museum sign-in
          </a>
        </div>
      </div>
    </footer>
  );
}
