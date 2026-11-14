import { ArrowUpRight } from "lucide-react";
import repos from "@/data/github-repos.json";

function formatRepoName(name) {
  return name.replace(/[-_]+/g, " ");
}

export function GithubRepos() {
  if (!repos.length) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {repos.map((r) => (
        <li key={r.name}>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="lift inline-flex min-h-11 items-center gap-1 border border-border px-3 py-1 text-sm hover:border-foreground sm:min-h-9"
          >
            <span className="draw-underline">{formatRepoName(r.name)}</span>
            {r.language && <span className="text-xs text-muted-foreground">· {r.language}</span>}
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
