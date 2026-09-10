import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const USERNAME = "ching4098";
const OUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/data/github-repos.json");

async function main() {
  const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=8`, {
    headers: {
      "User-Agent": "portfolio-build-script",
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API responded ${res.status}`);
  }

  const repos = await res.json();
  const filtered = repos
    .filter((r) => !r.fork && r.name.toLowerCase() !== "portfolio")
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.html_url,
      language: r.language,
      stars: r.stargazers_count,
      updatedAt: r.updated_at,
    }));

  await writeFile(OUT_PATH, JSON.stringify(filtered, null, 2) + "\n");
  console.log(`[fetch-github-repos] wrote ${filtered.length} repos to ${OUT_PATH}`);
}

main().catch(async (err) => {
  console.warn(`[fetch-github-repos] fetch failed, keeping existing data: ${err.message}`);
  try {
    await readFile(OUT_PATH);
  } catch {
    await writeFile(OUT_PATH, "[]\n");
  }
});
