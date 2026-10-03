import { article } from "@/data/article";
import { cn } from "@/lib/utils";

/** The author's name, linked to the About page on Sheridan Wyoming History. */
export function AuthorLink({ className }: { className?: string }) {
  return (
    <a
      href={article.aboutUrl}
      className={cn(
        "underline decoration-current/40 underline-offset-4 hover:text-paper hover:decoration-current",
        className,
      )}
    >
      {article.author}
    </a>
  );
}
