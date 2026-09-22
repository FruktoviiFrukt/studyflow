import { appendFile } from "node:fs/promises";
import { githubClient } from "./github.mjs";
import { verifiedDeployment } from "./core.mjs";

const result = await verifiedDeployment({
  api: githubClient(),
  repo: process.env.GITHUB_REPOSITORY,
  runId: process.env.CI_RUN_ID,
});
if (process.env.GITHUB_OUTPUT)
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `deploy=${result.deploy}\nsha=${result.sha || ""}\n`,
  );
console.log(JSON.stringify(result));
