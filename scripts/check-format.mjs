import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { check, getFileInfo, resolveConfig } from "prettier";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" });
// Changed files only: introducing CI must not silently reformat students' old work.
const base = process.env.FORMAT_BASE || "HEAD";
const sha = git(
  "rev-parse",
  "--verify",
  "--end-of-options",
  `${base}^{commit}`,
).trim();
const changed = git(
  "diff",
  "--name-only",
  "--diff-filter=ACMR",
  "-z",
  sha,
  "--",
).split("\0");
const added = git("ls-files", "--others", "--exclude-standard", "-z").split(
  "\0",
);
let failures = 0;
for (const file of new Set([...changed, ...added].filter(Boolean))) {
  const info = await getFileInfo(file, { ignorePath: ".prettierignore" });
  if (info.ignored || !info.inferredParser) continue;
  if (
    !(await check(await readFile(file, "utf8"), {
      ...(await resolveConfig(file)),
      filepath: file,
    }))
  ) {
    console.error(`Formatting: ${file}`);
    failures++;
  }
}
if (failures)
  console.error(
    "Run npx prettier --write <listed-files> and commit the result.",
  );
else console.log("Changed files are formatted.");
process.exitCode = failures ? 1 : 0;
