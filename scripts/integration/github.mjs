import { execFileSync } from "node:child_process";

export function githubClient(token = process.env.GH_TOKEN) {
  // Local read-only diagnostics may use the existing gh login without printing it.
  const credential =
    token ||
    (!process.env.GITHUB_ACTIONS &&
      execFileSync("gh", ["auth", "token"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim());
  if (!credential) throw new Error("GitHub token is required");
  return async (path, method = "GET", body) => {
    if (!path.startsWith("/repos/"))
      throw new Error("Only repository API endpoints are allowed");
    const response = await fetch(`https://api.github.com${path}`, {
      method,
      signal: AbortSignal.timeout(30_000),
      headers: {
        Authorization: `Bearer ${credential}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new Error(`GitHub API ${method} returned HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  };
}

export async function allPages(api, path, key) {
  const result = [];
  for (let page = 1; ; page++) {
    const data = await api(
      `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
    );
    const items = key ? data[key] : data;
    if (!Array.isArray(items)) throw new Error("Invalid paginated response");
    result.push(...items);
    if (items.length < 100) return result;
  }
}

export function validateRepository(repo) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))
    throw new Error("Invalid repository name");
  return repo;
}
