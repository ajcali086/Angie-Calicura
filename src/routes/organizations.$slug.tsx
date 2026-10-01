import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntityPage } from "@/components/EntityPage";
import { entityByPath } from "@/model/connections";

export const Route = createFileRoute("/organizations/$slug")({
  loader: ({ params }) => {
    if (!entityByPath("organizations", params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${entityByPath("organizations", loaderData?.slug ?? "")?.label ?? ""} · Angie` },
    ],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useLoaderData();
  return <EntityPage entity={entityByPath("organizations", slug)!} />;
}
