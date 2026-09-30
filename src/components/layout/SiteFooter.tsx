import { Link } from "@tanstack/react-router";
import { article } from "@/data/article";
import { nav } from "@/data/nav";

export function SiteFooter() {
  return (
    <footer id="site-footer" className="mt-auto border-t border-rule bg-ink-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <p className="max-w-md text-sm leading-relaxed text-fog">
          {article.author}’s article for Sheridan Wyoming History, set in the form of{" "}
          <em>The Spirit of Martinez</em>. The text and captions are the author’s.
        </p>
        <a
          href={article.url}
          className="-mt-6 inline-flex min-h-11 items-center text-[0.72rem] tracking-[0.16em] text-brass uppercase hover:text-paper md:hidden"
        >
          Read the original
        </a>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.72rem] tracking-[0.16em] text-fog uppercase">
          <a
            href={article.url}
            className="hidden min-h-11 items-center text-brass hover:text-paper md:flex"
          >
            Read the original
          </a>
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
        <p className="mx-auto max-w-6xl px-4 py-4 text-[0.7rem] tracking-wide text-fog sm:px-6">
          Design pilot · preview only
        </p>
      </div>
    </footer>
  );
}
