import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntityPage } from "@/components/EntityPage";
import { entityByPath } from "@/model/connections";

export const Route = createFileRoute("/places/$slug")({
  loader: ({ params }) => {
    if (!entityByPath("places", params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${entityByPath("places", loaderData?.slug ?? "")?.label ?? ""} · Angie` }],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useLoaderData();
  return <EntityPage entity={entityByPath("places", slug)!} />;
}
