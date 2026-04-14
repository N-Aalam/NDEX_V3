import json
import re
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
def _fallback_uml(input_text: str, diagram_type: str) -> dict[str, Any]:
    diagram_type = diagram_type.lower().strip()
    text = input_text.strip()

    classes: dict[str, dict[str, Any]] = {}
    relationships: list[dict[str, str]] = []

    def ensure_class(name: str) -> None:
        if name not in classes:
            classes[name] = {"name": name, "attributes": [], "methods": []}

    def add_attributes(name: str, attrs: list[str]) -> None:
        if not attrs:
            return
        ensure_class(name)
        existing = set(classes[name]["attributes"])
        for attr in attrs:
            if attr and attr not in existing:
                classes[name]["attributes"].append(attr)
                existing.add(attr)

    def parse_attributes(raw: str) -> list[str]:
        raw = raw.strip().rstrip(".")
        raw = re.sub(r"\s+and\s+", ", ", raw, flags=re.IGNORECASE)
        parts = [item.strip() for item in raw.split(",")]
        return [item for item in parts if item]

    sentences = re.split(r"[.\n]+", input_text)

    create_re = re.compile(
        r"\bcreate\s+(?:an?\s+)?(?P<name>[A-Za-z_]\w*)\s+class(?:\s+with\s+(?P<attrs>.+))?$",
        re.IGNORECASE,
    )

    rel_has_many = re.compile(
        r"\b(?P<left>[A-Za-z_]\w*)\s+has\s+many\s+(?P<right>[A-Za-z_]\w*)\b",
        re.IGNORECASE,
    )

    rel_belongs = re.compile(
        r"\b(?P<left>[A-Za-z_]\w*)\s+belongs\s+to\s+(?P<right>[A-Za-z_]\w*)\b",
        re.IGNORECASE,
    )

    rel_assigned = re.compile(
        r"\b(?P<left>[A-Za-z_]\w*)\s+can\s+be\s+assigned\s+to\s+one\s+(?P<right>[A-Za-z_]\w*)\b",
        re.IGNORECASE,
    )

    for sentence in (s.strip() for s in sentences):
        if not sentence:
            continue

        match = create_re.search(sentence)
        if match:
            class_name = match.group("name").strip()
            ensure_class(class_name)
            attrs = match.group("attrs")
            if attrs:
                add_attributes(class_name, parse_attributes(attrs))
            continue

        match = rel_has_many.search(sentence)
        if match:
            left = match.group("left").strip()
            right = match.group("right").strip()
            ensure_class(left)
            ensure_class(right)
            relationships.append({"from": left, "to": right, "type": "has_many"})
            continue

        match = rel_belongs.search(sentence)
        if match:
            left = match.group("left").strip()
            right = match.group("right").strip()
            ensure_class(left)
            ensure_class(right)
            relationships.append({"from": left, "to": right, "type": "belongs_to"})
            continue

        match = rel_assigned.search(sentence)
        if match:
            left = match.group("left").strip()
            right = match.group("right").strip()
            ensure_class(left)
            ensure_class(right)
            relationships.append({"from": left, "to": right, "type": "assigned_to"})
            continue

    # -------------------- CLASS DEFAULT --------------------
    if not classes:
        class_name = "Main"
        if text:
            class_name = text.split()[0].title()
        ensure_class(class_name)

    return {
        "type": "class",
        "classes": list(classes.values()),
        "relationships": relationships,
    }


# -------------------- PARSING --------------------
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
        f"User request: {input_text}"
    )


def _extract_json(content: str) -> dict[str, Any] | None:
    parsed = _parse_response(content)
    if parsed:
        return parsed

    match = re.search(r"\{.*\}", content, flags=re.DOTALL)
    if not match:
        return None

    return _parse_response(match.group(0))


# -------------------- MERMAID --------------------
def _to_mermaid(diagram: dict[str, Any]) -> str | None:
    diagram_type = (diagram.get("type") or "class").lower()

    if diagram_type == "class":
        classes = diagram.get("classes", [])
        rels = diagram.get("relationships", [])

        lines = ["classDiagram"]

        for cls in classes:
            name = cls.get("name", "Class")
            lines.append(f"class {name} {{")

            for attr in cls.get("attributes", []):
                lines.append(f"  +{attr}")

            for method in cls.get("methods", []):
                lines.append(f"  +{method}()")

            lines.append("}")

        for rel in rels:
            left = rel.get("from")
            right = rel.get("to")
            rtype = (rel.get("type") or "").lower()

            if not left or not right:
                continue

            if rtype == "has_many":
                lines.append(f'{left} "1" --> "*" {right}')
            elif rtype == "belongs_to":
                lines.append(f'{left} "*" --> "1" {right}')
            else:
                lines.append(f"{left} --> {right}")

        return "\n".join(lines)

    return None


# -------------------- PROMPT --------------------
def _build_prompt(input_text: str, diagram_type: str) -> str:
    diagram_type = diagram_type.lower().strip()

    return (
        "Return ONLY valid JSON with keys: type, mermaid, classes, relationships. "
        "type must be 'class'. "
        "Each class has name, attributes (list), methods (list). "
        "Relationships include from, to, type. "
        "If text is brief, infer typical classes for the domain. "
        f"Text: {input_text}"
    )


# -------------------- MAIN FUNCTION --------------------
def generate_uml(input_text: str, diagram_type: str = "class") -> dict[str, Any]:
    if not settings.llm_api_url:
        fallback = _fallback_uml(input_text, diagram_type)

        if "mermaid" not in fallback:
            mermaid_code = _to_mermaid(fallback)
            if mermaid_code:
                fallback["mermaid"] = mermaid_code

        return fallback

    payload = {
        "model": settings.llm_model,
        "messages": [
            {"role": "system", "content": "You output UML as JSON."},
            {"role": "user", "content": _build_prompt(input_text)},
            {"role": "system", "content": "You output UML as JSON only."},
            {"role": "user", "content": _build_prompt(input_text, diagram_type)},
        ],
        "temperature": 0,
    }

    headers = {}
    headers = {"Accept": "application/json"}

    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    try:
        with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
            response = client.post(settings.llm_api_url, json=payload, headers=headers)

        response.raise_for_status()

    except httpx.HTTPError:
        return _fallback_uml(input_text)
        fallback = _fallback_uml(input_text, diagram_type)

        if "mermaid" not in fallback:
            mermaid_code = _to_mermaid(fallback)
            if mermaid_code:
                fallback["mermaid"] = mermaid_code

        return fallback

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
        return _fallback_uml(input_text, diagram_type)

    parsed = _extract_json(content)

    if not parsed:
        fallback = _fallback_uml(input_text, diagram_type)

        if "mermaid" not in fallback:
            mermaid_code = _to_mermaid(fallback)
            if mermaid_code:
                fallback["mermaid"] = mermaid_code

        return fallback

    if "type" not in parsed:
        parsed["type"] = diagram_type

    if "mermaid" not in parsed:
        mermaid_code = _to_mermaid(parsed)
        if mermaid_code:
            parsed["mermaid"] = mermaid_code

    return parsed
