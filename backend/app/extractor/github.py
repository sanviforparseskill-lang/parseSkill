"""GitHub extractor (Section 4 / 6.1): pulls repos, per-repo manifest files,
languages, and commit authorship for the currently syncing user.

Bulk listing goes through the REST v3 endpoints (simpler pagination than
GraphQL for this shape); per-file contents also use REST's contents API.
A GraphQL v4 batched query is the documented target for reducing request
count against the 5000 req/hour budget (Section 4 rate-limit strategy) —
left as a follow-up since REST is enough to get the pipeline correct first.
"""

from __future__ import annotations

import asyncio
import base64

import httpx

GITHUB_API = "https://api.github.com"

# Manifest files technology_detector.py knows how to parse (Section 5.2 Step 1).
MANIFEST_FILES = [
    "package.json",
    "requirements.txt",
    "Pipfile",
    "pyproject.toml",
    "pom.xml",
    "build.gradle",
    "Cargo.toml",
    "go.mod",
    "Gemfile",
    "composer.json",
    "Dockerfile",
    "docker-compose.yml",
]


class GitHubExtractor:
    def __init__(self, access_token: str):
        self._client = httpx.AsyncClient(
            base_url=GITHUB_API,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            timeout=30.0,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def _get(self, url: str, **kwargs) -> httpx.Response:
        """GET with backoff on GitHub's primary/secondary rate limits
        (Section 4 rate-limit strategy) instead of hard-failing the whole
        sync the moment one request gets throttled."""
        for attempt in range(3):
            resp = await self._client.get(url, **kwargs)
            if resp.status_code == 403 and resp.headers.get("X-RateLimit-Remaining") == "0":
                reset_at = resp.headers.get("X-RateLimit-Reset")
                wait_s = max(float(reset_at) - time.time(), 1.0) if reset_at else 60.0
                await asyncio.sleep(min(wait_s, 120.0))
                continue
            if resp.status_code == 429:
                retry_after = resp.headers.get("Retry-After")
                await asyncio.sleep(float(retry_after) if retry_after else 10.0)
                continue
            return resp
        return resp

    async def list_repos(self, handle: str) -> list[dict]:
        repos: list[dict] = []
        page = 1
        while True:
            resp = await self._get(f"/users/{handle}/repos", params={"per_page": 100, "page": page, "type": "owner"})
            resp.raise_for_status()
            batch = resp.json()
            if not batch:
                break
            repos.extend(batch)
            page += 1
        return repos

    async def repo_languages(self, full_name: str) -> dict[str, int]:
        resp = await self._get(f"/repos/{full_name}/languages")
        resp.raise_for_status()
        return resp.json()

    async def repo_topics(self, full_name: str) -> list[str]:
        resp = await self._get(f"/repos/{full_name}/topics", headers={"Accept": "application/vnd.github.mercy-preview+json"})
        resp.raise_for_status()
        return resp.json().get("names", [])

    async def fetch_file(self, full_name: str, path: str) -> str | None:
        resp = await self._get(f"/repos/{full_name}/contents/{path}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        payload = resp.json()
        if payload.get("encoding") != "base64":
            return None
        return base64.b64decode(payload["content"]).decode("utf-8", errors="ignore")

    async def fetch_manifests(self, full_name: str) -> dict[str, str]:
        """Fetches every known manifest that exists in the repo root
        (Section 5.2 Step 1), plus repo-tree-derived signals technology_detector
        needs for CI/CD and orchestration detection (`_has_ci_workflows`,
        `_repo_paths`) — bundled into the same dict rather than a separate
        round trip since sync_profile calls this once per repo anyway."""
        found: dict[str, str] = {}
        for filename in MANIFEST_FILES:
            content = await self.fetch_file(full_name, filename)
            if content is not None:
                found[filename] = content

        paths = await self.repo_tree(full_name)
        found["_repo_paths"] = paths  # type: ignore[assignment]
        found["_has_ci_workflows"] = any(p.startswith(".github/workflows/") for p in paths)  # type: ignore[assignment]
        return found

    async def repo_tree(self, full_name: str) -> list[str]:
        """Full recursive file-path listing via the Git Trees API (Section
        5.3 Step 2 input) — one request instead of walking directories, and
        cheap on the request budget since it's a single call per repo."""
        repo_resp = await self._client.get(f"/repos/{full_name}")
        if repo_resp.status_code != 200:
            return []
        default_branch = repo_resp.json().get("default_branch", "main")

        tree_resp = await self._client.get(f"/repos/{full_name}/git/trees/{default_branch}", params={"recursive": "1"})
        if tree_resp.status_code != 200:
            return []
        tree = tree_resp.json()
        if tree.get("truncated"):
            pass  # huge monorepos get a partial tree; still useful for pattern detection
        return [entry["path"] for entry in tree.get("tree", []) if entry.get("type") == "blob"]

    async def fetch_readme(self, full_name: str) -> str | None:
        for filename in ("README.md", "README.rst", "README.txt", "readme.md", "Readme.md"):
            content = await self.fetch_file(full_name, filename)
            if content:
                return content
        return None

    async def commit_authorship(self, full_name: str, author_login: str) -> dict:
        """Proxy for `git log --author` via the commits endpoint (Section 5.2
        "Authorship analysis"): first/last commit, total commit count, and
        per-commit dates (for the timeline's per-quarter bucketing)
        attributed to this user, for boilerplate/contribution weighting."""
        resp = await self._client.get(f"/repos/{full_name}/commits", params={"author": author_login, "per_page": 100})
        if resp.status_code == 409:
            return {"commit_count": 0, "first_commit_at": None, "last_commit_at": None, "commit_dates": []}
        resp.raise_for_status()
        commits = resp.json()
        if not commits:
            return {"commit_count": 0, "first_commit_at": None, "last_commit_at": None, "commit_dates": []}
        dates = [c["commit"]["author"]["date"] for c in commits if c.get("commit")]
        return {
            "commit_count": len(commits),
            "first_commit_at": min(dates) if dates else None,
            "last_commit_at": max(dates) if dates else None,
            "commit_dates": dates,
        }

    async def contributor_stats(self, full_name: str, author_login: str) -> dict:
        """Additions/deletions authored by this user, via the stats/contributors
        endpoint (Section 5.3 Step 3 `total_lines_authored` input). GitHub
        computes these asynchronously for repos without a cached stats
        snapshot and returns 202 while it works — poll a few times rather
        than treating that as "no data"."""
        for _ in range(3):
            resp = await self._client.get(f"/repos/{full_name}/stats/contributors")
            if resp.status_code == 409:
                return {"additions": 0, "deletions": 0}
            if resp.status_code == 202:
                await asyncio.sleep(2)
                continue
            if resp.status_code != 200:
                return {"additions": 0, "deletions": 0}
            for entry in resp.json() or []:
                if entry.get("author", {}).get("login") == author_login:
                    additions = sum(w.get("a", 0) for w in entry.get("weeks", []))
                    deletions = sum(w.get("d", 0) for w in entry.get("weeks", []))
                    return {"additions": additions, "deletions": deletions}
            return {"additions": 0, "deletions": 0}
        return {"additions": 0, "deletions": 0}
