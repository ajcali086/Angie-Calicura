import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/PageHero";
import { Inline } from "@/components/Inline";
import { PassageDoor, PlateDoor } from "@/components/Door";
import { ListenButton } from "@/components/audio/ListenButton";
import { door } from "@/data/article";
import { timeline } from "@/data/timeline";

export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Timeline · Angie" }] }),
  component: TimelinePage,
});

/** Events grouped by decade, in order. */
const decades = timeline.reduce<{ decade: string; events: typeof timeline }[]>((out, e) => {
  const decade = `${e.sort.slice(0, 3)}0s`;
  const last = out.at(-1);
  if (last?.decade === decade) last.events.push(e);
  else out.push({ decade, events: [e] });
  return out;
}, []);

function TimelinePage() {
  return (
    <SiteShell>
      <PageHero
        kicker="Timeline"
        title="1917 to 2003"
        dek="Every date the post gives for Angie's life, in its own words, with a way back to where it says so."
        compact
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {decades.map(({ decade, events }) => (
          <section key={decade} className="mt-10 first:mt-0">
            <h2 className="border-b border-rule pb-2 font-display text-3xl text-brass">{decade}</h2>
            <ol>
              {events.map((e) => (
                <li
                  key={e.sort + e.quote}
                  className="grid gap-x-6 border-b border-rule/50 py-5 sm:grid-cols-[10rem_1fr]"
                >
                  <p className="text-[0.72rem] tracking-[0.14em] text-brass uppercase sm:pt-1.5">
                    {e.when}
                  </p>
                  <div>
                    <p className="font-display text-lg leading-relaxed text-fog">
                      <Inline text={e.quote} />
                    </p>
                    <div className="flex flex-wrap gap-x-6">
                      {e.plate ? <PlateDoor id={e.plate} /> : <PassageDoor to={door(e.quote)} />}
                      <ListenButton block={e.plate ?? door(e.quote)?.hash} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
