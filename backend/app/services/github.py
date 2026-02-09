from __future__ import annotations

from urllib.parse import urlparse

import httpx

from app.core.config import settings


class GitHubRepoError(ValueError):
    pass


def _parse_repo_url(repo_url: str) -> tuple[str, str]:
    parsed = urlparse(repo_url)
    if parsed.netloc not in {"github.com", "www.github.com"}:
        raise GitHubRepoError("Only GitHub URLs are supported")
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if len(parts) < 2:
        raise GitHubRepoError("Repo URL must include owner and repo")
    owner, repo = parts[0], parts[1].replace(".git", "")
    return owner, repo


def _build_headers() -> dict[str, str]:
    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"
    return headers


def _get_default_branch(client: httpx.Client, owner: str, repo: str) -> str:
    response = client.get(f"https://api.github.com/repos/{owner}/{repo}")
    response.raise_for_status()
    data = response.json()
    return data.get("default_branch", "main")


def fetch_repo_tree(repo_url: str) -> dict:
    owner, repo = _parse_repo_url(repo_url)
    headers = _build_headers()

    with httpx.Client(headers=headers, timeout=settings.github_timeout_seconds) as client:
        branch = _get_default_branch(client, owner, repo)
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        response = client.get(tree_url)
        response.raise_for_status()
        tree_data = response.json()

    entries = [
        {
            "path": item.get("path"),
            "type": item.get("type"),
        }
        for item in tree_data.get("tree", [])
        if item.get("path")
    ]

    return {
        "repo": f"{owner}/{repo}",
        "branch": branch,
        "entries": entries,
    }
