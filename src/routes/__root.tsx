import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { article, plain } from "@/data/article";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `Angie · ${article.author}` },
      { name: "description", content: plain(article.subtitle) },
      // A preview of someone else's article in a new form. Not for search engines.
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#141210" },
    ],
    links: [
      {
        rel: "preload",
        href: "/fonts/cormorant-garamond-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/outfit-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="bg-ink font-sans text-paper">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
