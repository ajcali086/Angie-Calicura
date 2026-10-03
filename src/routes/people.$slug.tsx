import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntityPage } from "@/components/EntityPage";
import { entityByPath } from "@/model/connections";

export const Route = createFileRoute("/people/$slug")({
  loader: ({ params }) => {
    if (!entityByPath("people", params.slug)) throw notFound();
    return { slug: params.slug };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${entityByPath("people", loaderData?.slug ?? "")?.label ?? ""} · Angie` }],
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useLoaderData();
  return <EntityPage entity={entityByPath("people", slug)!} />;
}
