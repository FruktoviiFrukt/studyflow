import { allPages, validateRepository } from "./github.mjs";

export const TARGET = "imurd";
export const REQUIRED_CHECKS = ["Quality", "Database", "Browser"];

export function assertMergePolicy(repo, protection) {
  if (!repo.allow_auto_merge || !repo.allow_merge_commit)
    throw new Error("Owner must enable auto-merge and merge commits");
  const checks = protection?.required_status_checks;
  const contexts = new Set([
    ...(checks?.contexts || []),
    ...(checks?.checks || []).map((check) => check.context),
  ]);
  if (
    !checks?.strict ||
    !REQUIRED_CHECKS.every((name) => contexts.has(name)) ||
    !protection?.enforce_admins?.enabled
  ) {
    throw new Error(
      "Protect imurd with strict Quality/Database/Browser checks and enforce rules for administrators",
    );
  }
}

export async function reconcile({ api, repo, enableAutoMerge, dryRun = true }) {
  validateRepository(repo);
  const root = `/repos/${repo}`;
  const metadata = await api(root);
  const result = { target: TARGET, dryRun, branches: [], setup: [] };
  let protection;
  try {
    protection = await api(`${root}/branches/${TARGET}/protection`);
  } catch {
    result.setup.push(
      "Protection settings unavailable: owner access/configuration required",
    );
  }
  try {
    assertMergePolicy(metadata, protection);
  } catch (error) {
    result.setup.push(error.message);
    if (!dryRun) throw error;
  }
  const branches = await allPages(api, `${root}/branches`);
  if (!branches.some((branch) => branch.name === TARGET))
    throw new Error("Publish the imurd branch first");
  for (const branch of branches) {
    if (branch.name === TARGET) continue;
    const entry = { branch: branch.name, state: "checking" };
    result.branches.push(entry);
    try {
      const comparison = await api(
        `${root}/compare/${TARGET}...${encodeURIComponent(branch.name)}`,
      );
      if (comparison.ahead_by === 0) {
        entry.state = "already-included";
        continue;
      }
      let [pr] = await allPages(
        api,
        `${root}/pulls?state=open&base=${TARGET}&head=${encodeURIComponent(`${repo.split("/")[0]}:${branch.name}`)}`,
      );
      if (!pr) {
        if (dryRun) {
          entry.state = "would-create-pr";
          continue;
        }
        pr = await api(`${root}/pulls`, "POST", {
          title: `Sync ${branch.name} into imurd`.slice(0, 240),
          head: branch.name,
          base: TARGET,
          body: "Интеграция изменений в imurd. Исходная ветка не изменяется. Слияние разрешено только после Quality, Database и Browser. При конфликте PR остаётся открытым.",
        });
      }
      entry.pr = pr.number;
      pr = await api(`${root}/pulls/${pr.number}`);
      // Never modify source branches, even to bring them up to date.
      if (
        pr.base.ref !== TARGET ||
        pr.head.repo?.full_name !== repo ||
        pr.head.ref !== branch.name ||
        pr.state !== "open"
      )
        throw new Error("PR identity changed; refusing action");
      if (pr.draft) {
        entry.state = "draft";
        continue;
      }
      if (pr.mergeable === false) {
        entry.state = "conflict";
        continue;
      }
      if (pr.mergeable === null) {
        entry.state = "mergeability-pending";
        continue;
      }
      if (pr.auto_merge) {
        entry.state = "auto-merge-enabled";
        continue;
      }
      if (dryRun) {
        entry.state = "would-enable-auto-merge";
        continue;
      }
      await enableAutoMerge(pr.number, pr.head.sha);
      entry.state = "auto-merge-enabled";
    } catch (error) {
      entry.state = "blocked";
      entry.error = error.message;
    }
  }
  return result;
}

export async function verifiedDeployment({ api, repo, runId }) {
  validateRepository(repo);
  if (!/^\d+$/.test(String(runId))) throw new Error("Invalid CI run ID");
  const root = `/repos/${repo}`;
  const run = await api(`${root}/actions/runs/${runId}`);
  if (
    run.event !== "push" ||
    run.head_branch !== TARGET ||
    run.head_repository?.full_name !== repo ||
    run.repository?.full_name !== repo ||
    run.path !== ".github/workflows/ci.yml" ||
    run.status !== "completed" ||
    run.conclusion !== "success"
  ) {
    throw new Error(
      "Deployment requires successful push CI on this repository's imurd branch",
    );
  }
  const jobs = await allPages(
    api,
    `${root}/actions/runs/${runId}/jobs?filter=latest`,
    "jobs",
  );
  if (
    !REQUIRED_CHECKS.every((name) =>
      jobs.some((job) => job.name === name && job.conclusion === "success"),
    )
  )
    throw new Error("Required CI jobs did not all pass");
  const branch = await api(`${root}/branches/${TARGET}`);
  if (branch.commit.sha !== run.head_sha)
    return { deploy: false, reason: "newer-imurd-commit" };
  if (!/^[a-f0-9]{40}$/.test(run.head_sha))
    throw new Error("Invalid commit SHA");
  return { deploy: true, sha: run.head_sha };
}
