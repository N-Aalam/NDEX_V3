import json
from typing import Any

import httpx

from app.core.config import settings


DEFAULT_DIAGRAM = {
    "classes": [],
    "relationships": [],
}


def _fallback_uml(input_text: str) -> dict[str, Any]:
    class_name = "Main"
    if input_text.strip():
        class_name = input_text.strip().split()[0].title()
    return {
        "classes": [
            {
                "name": class_name,
                "attributes": [],
                "methods": [],
            }
        ],
        "relationships": [],
    }


def _parse_response(content: str) -> dict[str, Any] | None:
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    if "classes" not in data or "relationships" not in data:
        return None
    return data


def _build_prompt(input_text: str) -> str:
    return (
        "You are a UML generator. Return ONLY valid JSON with keys: classes, relationships. "
        "Each class has name, attributes (list), methods (list). Relationships include from, to, type. "
        f"Text: {input_text}"
    )


def generate_uml(input_text: str) -> dict[str, Any]:
    if not settings.llm_api_url:
        return _fallback_uml(input_text)

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": "You output UML as JSON."},
            {"role": "user", "content": _build_prompt(input_text)},
        ],
        "temperature": 0,
    }

    headers = {}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    try:
        with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
            response = client.post(settings.llm_api_url, json=payload, headers=headers)
        response.raise_for_status()
    except httpx.HTTPError:
        return _fallback_uml(input_text)

    data = response.json()
    content = None
    if isinstance(data, dict):
        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            message = choices[0].get("message", {})
            content = message.get("content")
        if content is None and "output" in data:
            content = data.get("output")

    if not content:
        return _fallback_uml(input_text)

    parsed = _parse_response(content)
    return parsed or _fallback_uml(input_text)
