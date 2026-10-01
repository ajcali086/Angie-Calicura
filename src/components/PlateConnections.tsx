import { Link } from "@tanstack/react-router";
import { EntityLink } from "@/components/EntityPage";
import { entitiesOnPlate, relatedPlates } from "@/model/connections";

const GROUPS = [
  ["appears-in", "In the picture"],
  ["photographed-at", "Photographed here"],
  ["documented-in", "Named here"],
] as const;

/**
 * "How this connects" on a plate page: who and what the plate's records name,
 * and up to three nearby plates that share one of them. A plate that names
 * no entity shows nothing: the record shows its own thinness.
 */
export function PlateConnections({ plateId }: { plateId: string }) {
  const named = entitiesOnPlate(plateId);
  if (!named.length) return null;
  const related = relatedPlates(plateId);
  return (
    <section className="mt-10 border-t border-rule pt-6">
      <h2 className="kicker">How this connects</h2>
      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        {GROUPS.map(([type, label]) => {
          const these = named.filter((n) => n.type === type);
          return these.length ? (
            <div key={type}>
              <dt className="text-[0.68rem] tracking-[0.14em] text-muted uppercase">{label}</dt>
              <dd className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {these.map((n) => (
                  <EntityLink key={n.entity.id} entity={n.entity} />
                ))}
              </dd>
            </div>
          ) : null;
        })}
        {related.length ? (
          <div>
            <dt className="text-[0.68rem] tracking-[0.14em] text-muted uppercase">
              Related plates
            </dt>
            <dd className="mt-1 space-y-1">
              {related.map((r) => (
                <p key={r.plate.id} className="text-fog">
                  <Link
                    to="/archive/$id"
                    params={{ id: r.plate.id }}
                    className="text-paper underline decoration-rule underline-offset-4 hover:text-brass"
                  >
                    Plate {r.plate.number}
                  </Link>{" "}
                  <span className="text-muted">
                    shares {r.shared.map((e) => e.label).join(", ")}
                  </span>
                </p>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
