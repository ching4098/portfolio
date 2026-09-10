import { motion } from "framer-motion";
import { Star, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Pill } from "@/components/pill";
import { stagger, item } from "@/lib/motion";
import repos from "@/data/github-repos.json";

function formatRepoName(name) {
  return name.replace(/[-_]+/g, " ");
}

export function GithubRepos() {
  if (!repos.length) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {repos.map((r) => (
        <motion.div key={r.name} variants={item} layout>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:opacity-70">
                  {formatRepoName(r.name)}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
              <div className="flex flex-wrap items-center gap-2">
                {r.language && <Pill>{r.language}</Pill>}
                {r.stars > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3" />
                    {r.stars}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
