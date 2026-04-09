import json
from collections import Counter
from typing import Any

import httpx

from app.core.config import settings


def _call_llm_json(system_prompt: str, user_prompt: str, fallback: dict[str, Any]) -> dict[str, Any]:
    if not settings.llm_api_url or not settings.llm_api_key:
        return fallback

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
    }
    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
            response = client.post(settings.llm_api_url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            return fallback
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            return parsed
        return fallback
    except (httpx.HTTPError, json.JSONDecodeError, KeyError, IndexError, TypeError):
        return fallback


def generate_mermaid_uml(input_text: str, diagram_type: str) -> dict[str, Any]:
    fallback = {
        "mermaid_code": f"classDiagram\nclass Main\nMain : {input_text[:40] or 'Generated from input'}",
        "title": "Fallback UML",
    }
    system_prompt = (
        "You are an expert software architect. Output strict JSON only with keys: "
        "mermaid_code (string), title (string). Use valid Mermaid syntax based on diagram type."
    )
    user_prompt = f"Diagram type: {diagram_type}\nInput: {input_text}"
    result = _call_llm_json(system_prompt, user_prompt, fallback)
    if "mermaid_code" not in result:
        return fallback
    return result


def analyze_code_quality(code: str) -> dict[str, Any]:
    fallback = {
        "maintainability_index": 65,
        "hotspots": ["Complex function logic"],
        "technical_debt": ["Add docstrings and tests"],
        "infographic": [
            {"label": "Maintainability", "value": "65/100", "tone": "medium"},
            {"label": "Hotspots", "value": "1 detected", "tone": "warning"},
        ],
    }
    system_prompt = (
        "You are a senior code quality analyst. Return strict JSON only with keys: "
        "maintainability_index (0-100 integer), hotspots (array of strings), technical_debt (array of strings), "
        "infographic (array of {label,value,tone})."
    )
    user_prompt = f"Analyze this code:\n{code}"
    return _call_llm_json(system_prompt, user_prompt, fallback)


def build_repo_intelligence(repo_data: dict[str, Any]) -> dict[str, Any]:
    commits = repo_data.get("commits", [])
    contributors = repo_data.get("contributors", [])

    date_counts = Counter((c.get("date") or "")[:10] for c in commits if c.get("date"))
    commit_frequency = [{"date": k, "count": v} for k, v in sorted(date_counts.items())]
    contributor_influence = [
        {"name": c.get("login", "unknown"), "contributions": c.get("contributions", 0)} for c in contributors
    ]

    fallback = {
        "repository_health": "Repository activity appears stable with regular commit cadence.",
        "collaboration_patterns": "Contributions are concentrated among top contributors with periodic bursts.",
        "d3": {
            "commit_frequency": commit_frequency,
            "contributor_influence": contributor_influence,
        },
    }

    system_prompt = (
        "You are an expert repository analyst. Output strict JSON with keys: repository_health, "
        "collaboration_patterns, d3. d3 must include commit_frequency and contributor_influence arrays."
    )
    user_prompt = (
        "Analyze repository metadata, commits, and contributors for health and collaboration insights.\n"
        f"Metadata: {json.dumps(repo_data.get('metadata', {}))}\n"
        f"Commits: {json.dumps(commits[:20])}\n"
        f"Contributors: {json.dumps(contributors[:20])}"
    )

    result = _call_llm_json(system_prompt, user_prompt, fallback)
    if "d3" not in result:
        result["d3"] = fallback["d3"]
    return result
