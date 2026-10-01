import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /admin opens the CMS (Sveltia), a static page in public/admin/ that runs
 * on its own, outside the site's app.
 */
export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    throw redirect({ href: "/admin/index.html", reloadDocument: true });
  },
});
