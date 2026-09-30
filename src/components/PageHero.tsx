import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHero({
  kicker,
  title,
  dek,
  byline,
  image,
  compact,
}: {
  kicker: string;
  title: string;
  dek?: string;
  /** "By …", under the title and dek. */
  byline?: ReactNode;
  image?: string;
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden border-b border-rule">
      {image ? (
        <img
          src={image}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full bg-ink-mid object-cover object-top"
        />
      ) : null}
      <div
        className={cn(
          "absolute inset-0",
          image
            ? "bg-linear-to-t from-ink via-ink/88 to-ink/55"
            : "bg-ink-soft bg-[radial-gradient(ellipse_at_15%_0%,rgb(150_20_42/0.45),transparent_65%)]",
        )}
      />
      <div
        className={cn(
          "relative mx-auto max-w-4xl px-4 sm:px-6",
          compact ? "py-10 sm:py-12" : "py-16 sm:py-24",
          image && "[text-shadow:0_1px_18px_rgb(20_18_16_/_0.92)]",
        )}
      >
        <p className="kicker stagger-in">{kicker}</p>
        <h1 className="stagger-in mt-3 font-display text-3xl leading-[1.05] font-semibold text-paper sm:text-5xl">
          {title}
        </h1>
        {dek ? (
          <p className="stagger-in mt-5 max-w-2xl font-display text-lg leading-relaxed text-fog sm:text-xl">
            {dek}
          </p>
        ) : null}
        {byline ? (
          <p className="stagger-in mt-4 font-sans text-[0.78rem] tracking-[0.14em] text-fog uppercase">
            {byline}
          </p>
        ) : null}
      </div>
    </section>
  );
}
