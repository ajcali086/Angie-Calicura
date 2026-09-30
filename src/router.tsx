import { createRouter } from "@tanstack/react-router";
import { NotFound } from "@/components/layout/NotFound";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
  });
}
