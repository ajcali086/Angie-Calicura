import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const doorClass =
  "inline-flex min-h-11 items-center text-[0.7rem] tracking-[0.14em] text-brass uppercase hover:text-paper";

export function PassageDoor({
  to,
  label = "Read the passage",
  className,
}: {
  to: { slug: string; hash: string } | undefined;
  label?: string;
  className?: string;
}) {
  if (!to) return null;
  return (
    <Link
      to="/chapters/$slug"
      params={{ slug: to.slug }}
      hash={to.hash}
      className={cn(doorClass, className)}
    >
      {label}
    </Link>
  );
}

export function PlateDoor({ id, label = "See the plate" }: { id: string; label?: string }) {
  return (
    <Link to="/archive/$id" params={{ id }} className={doorClass}>
      {label}
    </Link>
  );
}
