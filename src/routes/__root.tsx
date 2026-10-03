import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { PlayerBar } from "@/components/audio/PlayerBar";
import { article, plain } from "@/data/article";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `Angie · ${article.author}` },
      { name: "description", content: plain(article.subtitle) },
      { name: "theme-color", content: "#150809" },
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
        <AudioProvider>
          <Outlet />
          <PlayerBar />
        </AudioProvider>
        <Scripts />
      </body>
    </html>
  );
}
