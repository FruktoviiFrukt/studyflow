import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { githubClient } from "./github.mjs";
import { reconcile } from "./core.mjs";

const repo = process.env.GITHUB_REPOSITORY || "FruktoviiFrukt/studyflow";
const dryRun = process.env.AUTO_INTEGRATE_ENABLED !== "true";
if (!dryRun && !process.env.INTEGRATION_TOKEN)
  throw new Error(
    "INTEGRATION_TOKEN must be configured for automatic PR events",
  );
if (!dryRun) process.env.GH_TOKEN = process.env.INTEGRATION_TOKEN;
const result = await reconcile({
  api: githubClient(),
  repo,
  dryRun,
  enableAutoMerge: async (number, sha) => {
    // No --admin, --delete-branch or update-branch: source refs stay untouched.
    execFileSync(
      "gh",
      [
        "pr",
        "merge",
        String(number),
        "--repo",
        repo,
        "--auto",
        "--merge",
        "--match-head-commit",
        sha,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
  },
});
await mkdir(".review-output", { recursive: true });
await writeFile(
  ".review-output/integration.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
if (result.branches.some((branch) => branch.state === "blocked"))
  process.exitCode = 1;
