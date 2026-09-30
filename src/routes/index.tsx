import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { Inline } from "@/components/Inline";
import { PassageDoor } from "@/components/Door";
import { ListenArticle } from "@/components/audio/ListenArticle";
import { article, chapters, door, plain, plateById, plates } from "@/data/article";
import { discrepancies } from "@/data/discrepancies";
import { plateImages } from "@/data/plateImages";
import { timeline } from "@/data/timeline";
import { titleImage } from "@/data/titleImage";

export const Route = createFileRoute("/")({ component: Home });

const [name, ...rest] = article.title.split(": ");
const coverPlate = plateById(titleImage.plate)!;
const cover = plateImages[titleImage.plate];
const opening = "So, who remembers Angie, the notorious madam of the Ideal Hotel?";

function Home() {
  const withImages = Object.keys(plateImages).length;
  const rooms = [
    {
      href: "/timeline",
      label: "Timeline",
      count: `${timeline.length} dated events, each in the post’s words`,
    },
    {
      href: "/archive",
      label: "Plates",
      count: `${plates.length} plates, ${withImages} with images so far`,
    },
    {
      href: "/sources",
      label: "Sources",
      count: "The newspapers, records and people the post draws on",
    },
    {
      href: "/left-open",
      label: "Left Open",
      count: `${discrepancies.length} questions the post leaves unanswered`,
    },
  ] as const;

  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-rule">
        <img
          src={cover.src}
          alt={titleImage.alt}
          width={cover.width}
          height={cover.height}
          fetchPriority="high"
          style={{ objectPosition: titleImage.position }}
          className="absolute inset-0 size-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-ink via-ink/80 to-ink/10" />
        <Link
          to="/archive/$id"
          params={{ id: coverPlate.id }}
          className="absolute top-3 right-3 z-10 flex min-h-11 max-w-[16rem] items-center bg-ink/85 px-3 py-1.5 text-right font-sans text-[0.66rem] leading-snug tracking-[0.12em] text-paper uppercase hover:text-brass sm:top-4 sm:right-4 sm:max-w-sm"
        >
          Plate {coverPlate.number} · {plain(coverPlate.caption)}
        </Link>
        <div className="relative mx-auto max-w-4xl px-4 pt-72 pb-14 [text-shadow:0_1px_18px_rgb(20_18_16_/_0.92)] sm:px-6 sm:pt-96">
          <p className="kicker stagger-in">Sheridan Wyoming History · {article.author}</p>
          <h1 className="stagger-in mt-4 font-display text-4xl leading-[1.05] font-semibold text-paper sm:text-6xl">
            {name}
          </h1>
          <p className="stagger-in mt-4 font-display text-xl text-fog italic sm:text-2xl">
            {rest.join(": ")}
          </p>
          <p className="stagger-in mt-2 font-sans text-[0.78rem] tracking-[0.14em] text-brass uppercase">
            {article.subtitle}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <figure className="border-l-2 border-brass pl-5">
          <blockquote className="font-display text-2xl leading-snug text-paper sm:text-3xl">
            <Inline text={opening} />
          </blockquote>
          <figcaption>
            <PassageDoor to={door(opening)} />
          </figcaption>
        </figure>

        <ListenArticle />

        <h2 className="kicker mt-14">The article, in three parts</h2>
        <ol className="mt-3">
          {chapters.map((c) => (
            <li key={c.slug} className="border-b border-rule">
              <Link
                to="/chapters/$slug"
                params={{ slug: c.slug }}
                className="group flex min-h-20 items-baseline gap-6 py-5"
              >
                <span className="w-8 shrink-0 font-display text-2xl text-brass">
                  {String(c.number).padStart(2, "0")}
                </span>
                <span className="font-display text-2xl text-paper group-hover:text-brass">
                  {c.title}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <div className="mt-12 grid gap-px bg-rule sm:grid-cols-2">
          {rooms.map((room) => (
            <Link
              key={room.href}
              to={room.href}
              className="group block bg-ink p-5 hover:bg-ink-soft"
            >
              <span className="kicker">{room.label}</span>
              <span className="mt-2 block text-sm leading-relaxed text-fog group-hover:text-paper">
                {room.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
