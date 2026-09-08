import test from "node:test";
import assert from "node:assert/strict";
import {
  assertMergePolicy,
  reconcile,
  verifiedDeployment,
} from "../scripts/integration/core.mjs";
import { allPages } from "../scripts/integration/github.mjs";

const repo = "school/studyflow";
const sha = "a".repeat(40);
const checks = ["Quality", "Database", "Browser"];
const policy = {
  required_status_checks: { strict: true, contexts: checks },
  enforce_admins: { enabled: true },
};
const metadata = { allow_auto_merge: true, allow_merge_commit: true };

test("automatic merging refuses missing or incomplete required checks", () => {
  assert.doesNotThrow(() => assertMergePolicy(metadata, policy));
  assert.throws(() => assertMergePolicy({}, policy));
  assert.throws(() => assertMergePolicy(metadata, undefined));
  assert.throws(() =>
    assertMergePolicy(metadata, {
      ...policy,
      required_status_checks: { strict: true, contexts: ["Quality"] },
    }),
  );
  assert.throws(() =>
    assertMergePolicy(metadata, {
      ...policy,
      required_status_checks: { strict: false, contexts: checks },
    }),
  );
});

test("integration plan includes student branches and never writes", async () => {
  const api = async (path, method = "GET") => {
    assert.equal(method, "GET");
    if (path.endsWith("/protection")) return policy;
    if (path.includes("/branches?"))
      return [
        { name: "imurd" },
        { name: "develop" },
        { name: "feat/auth-page" },
      ];
    if (path.includes("/compare/imurd...")) return { ahead_by: 2 };
    if (path.includes("/pulls?")) return [];
    assert.equal(path, `/repos/${repo}`);
    return metadata;
  };
  const result = await reconcile({
    api,
    repo,
    enableAutoMerge: () => assert.fail("dry run must not merge"),
  });
  assert.equal(result.target, "imurd");
  assert.deepEqual(
    result.branches.map((branch) => branch.branch),
    ["develop", "feat/auth-page"],
  );
  assert.ok(
    result.branches.every((branch) => branch.state === "would-create-pr"),
  );
});

function deploymentApi({ run = {}, jobs, current = sha } = {}) {
  return async (path) => {
    if (path.includes("/jobs?"))
      return {
        jobs: jobs || checks.map((name) => ({ name, conclusion: "success" })),
      };
    if (path.endsWith("/branches/imurd")) return { commit: { sha: current } };
    return {
      event: "push",
      head_branch: "imurd",
      head_repository: { full_name: repo },
      repository: { full_name: repo },
      path: ".github/workflows/ci.yml",
      status: "completed",
      conclusion: "success",
      head_sha: sha,
      ...run,
    };
  };
}

test("deployment accepts only the current successfully tested imurd commit", async () => {
  assert.deepEqual(
    await verifiedDeployment({ api: deploymentApi(), repo, runId: 42 }),
    { deploy: true, sha },
  );
  for (const run of [
    { event: "pull_request" },
    { head_branch: "develop" },
    { conclusion: "failure" },
    { path: ".github/workflows/other.yml" },
    { head_repository: { full_name: "other/repo" } },
  ]) {
    await assert.rejects(
      verifiedDeployment({ api: deploymentApi({ run }), repo, runId: 42 }),
    );
  }
  await assert.rejects(
    verifiedDeployment({
      api: deploymentApi({
        jobs: [{ name: "Quality", conclusion: "success" }],
      }),
      repo,
      runId: 42,
    }),
  );
});

test("a newer imurd commit prevents deploying an older successful build", async () => {
  assert.deepEqual(
    await verifiedDeployment({
      api: deploymentApi({ current: "b".repeat(40) }),
      repo,
      runId: 42,
    }),
    { deploy: false, reason: "newer-imurd-commit" },
  );
});

test("branch discovery reads subsequent API pages", async () => {
  const pages = [];
  const result = await allPages(async (path) => {
    pages.push(path);
    return path.endsWith("page=1")
      ? Array.from({ length: 100 }, (_, i) => i)
      : [100];
  }, "/repos/school/studyflow/branches");
  assert.equal(result.length, 101);
  assert.equal(pages.length, 2);
});
