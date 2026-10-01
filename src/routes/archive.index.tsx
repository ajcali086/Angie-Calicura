import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/fadeIn";
import { ImageOff } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { chapters, plain, plates } from "@/data/article";
import { plateImages, type PlateImage } from "@/data/plateImages";

export const Route = createFileRoute("/archive/")({
  head: () => ({ meta: [{ title: "Plates · Angie" }] }),
  component: ArchiveIndex,
});

function ArchiveIndex() {
  const withImages = Object.keys(plateImages).length;
  return (
    <SiteShell>
      <PageHero
        kicker="Plates"
        title={`${plates.length} plates`}
        dek={`Every image in the post, in its order, with the post's caption. ${withImages} of the images have been added so far; the rest show their caption until they are.`}
        compact
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {chapters.map((c) => (
          <section key={c.slug} className="mt-12 first:mt-0">
            <h2 className="kicker border-b border-rule pb-2">
              Part {c.number} · {c.title}
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {plates
                .filter((p) => p.chapter === c.slug)
                .map((p) => {
                  const image = plateImages[p.id];
                  return (
                    <li key={p.id}>
                      <Link to="/archive/$id" params={{ id: p.id }} className="group block">
                        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-ink-soft">
                          {image?.set ? (
                            <SetTile set={image.set} />
                          ) : image ? (
                            <img
                              src={image.src}
                              alt=""
                              loading="lazy"
                              ref={fadeIn}
                              className="size-full object-cover"
                            />
                          ) : (
                            <ImageOff className="size-5 text-muted" aria-hidden />
                          )}
                        </div>
                        <p className="mt-2 text-[0.68rem] tracking-[0.14em] text-brass uppercase">
                          Plate {p.number}
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm leading-snug text-fog group-hover:text-paper">
                          {plain(p.caption)}
                        </p>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}

/** A plate of several photographs, all squeezed into its tile. */
function SetTile({ set }: { set: PlateImage[] }) {
  return (
    <div
      className={cn("grid size-full gap-px", set.length === 2 ? "grid-cols-1" : "grid-cols-2")}
      style={{
        gridTemplateRows: `repeat(${set.length === 2 ? 2 : Math.ceil(set.length / 2)}, minmax(0, 1fr))`,
      }}
    >
      {set.map((image, i) => (
        <img
          key={image.src}
          src={image.src}
          alt=""
          loading="lazy"
          ref={fadeIn}
          className={cn("size-full object-cover", set.length % 2 === 1 && i === 0 && "col-span-2")}
        />
      ))}
    </div>
  );
}
