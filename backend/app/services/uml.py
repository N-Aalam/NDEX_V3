import json
import re
from typing import Any

import httpx

from app.core.config import settings


DEFAULT_DIAGRAM = {
    "classes": [],
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

    if diagram_type == "sequence":
        actors: list[str] = []
        messages: list[dict[str, Any]] = []
        if "library" in text.lower():
            actors = ["Member", "LibrarySystem", "Catalog", "Inventory", "Librarian", "Notification"]
            messages = [
                {"from": "Member", "to": "LibrarySystem", "label": "searchBook(query)", "order": 1},
                {"from": "LibrarySystem", "to": "Catalog", "label": "findAvailableBooks(query)", "order": 2},
                {"from": "Catalog", "to": "LibrarySystem", "label": "results", "order": 3},
                {"from": "Member", "to": "LibrarySystem", "label": "requestBorrow(bookId)", "order": 4},
                {"from": "LibrarySystem", "to": "Inventory", "label": "checkAvailability(bookId)", "order": 5},
                {"from": "Inventory", "to": "LibrarySystem", "label": "available", "order": 6},
                {"from": "LibrarySystem", "to": "Librarian", "label": "approveBorrow(memberId, bookId)", "order": 7},
                {"from": "Librarian", "to": "LibrarySystem", "label": "approved", "order": 8},
                {"from": "LibrarySystem", "to": "Inventory", "label": "markBorrowed(bookId, memberId, dueDate)", "order": 9},
                {"from": "LibrarySystem", "to": "Notification", "label": "sendDueDate(memberId, dueDate)", "order": 10},
                {"from": "LibrarySystem", "to": "Member", "label": "borrowConfirmed(dueDate)", "order": 11},
            ]
            return {"type": "sequence", "actors": actors, "lifelines": actors, "messages": messages}
        for line in (l.strip() for l in text.splitlines()):
            if not line:
                continue
            if line.lower().startswith("actors:"):
                actor_list = line.split(":", 1)[1]
                actors = [a.strip() for a in actor_list.split(",") if a.strip()]
                continue
            match = re.match(r"(.+?)\s*->\s*(.+?)\s*:\s*(.+)", line)
            if match:
                src, dst, label = match.group(1).strip(), match.group(2).strip(), match.group(3).strip()
                messages.append({"from": src, "to": dst, "label": label, "order": len(messages) + 1})
                if src not in actors:
                    actors.append(src)
                if dst not in actors:
                    actors.append(dst)
        if not actors:
            name = text.split()[0].title() if text else "Actor"
            actors = [name]
        return {"type": "sequence", "actors": actors, "lifelines": actors, "messages": messages}

    if diagram_type == "activity":
        if "->" in text:
            parts = [p.strip() for p in text.split("->") if p.strip()]
            nodes = [{"id": f"n{idx+1}", "label": part, "type": "action"} for idx, part in enumerate(parts)]
            edges = [
                {"from": nodes[idx]["id"], "to": nodes[idx + 1]["id"], "label": ""}
                for idx in range(len(nodes) - 1)
            ]
            return {"type": "activity", "nodes": nodes, "edges": edges}
        if "library" in text.lower():
            nodes = [
                {"id": "n1", "label": "Start", "type": "start"},
                {"id": "n2", "label": "Search catalog", "type": "action"},
                {"id": "n3", "label": "Select book", "type": "action"},
                {"id": "n4", "label": "Check availability", "type": "action"},
                {"id": "n5", "label": "Approve borrow", "type": "action"},
                {"id": "n6", "label": "Issue loan", "type": "action"},
                {"id": "n7", "label": "Notify member", "type": "action"},
                {"id": "n8", "label": "End", "type": "end"},
            ]
            edges = [
                {"from": "n1", "to": "n2", "label": ""},
                {"from": "n2", "to": "n3", "label": ""},
                {"from": "n3", "to": "n4", "label": ""},
                {"from": "n4", "to": "n5", "label": ""},
                {"from": "n5", "to": "n6", "label": ""},
                {"from": "n6", "to": "n7", "label": ""},
                {"from": "n7", "to": "n8", "label": ""},
            ]
            return {"type": "activity", "nodes": nodes, "edges": edges}
        label = text or "Start"
        return {"type": "activity", "nodes": [{"id": "n1", "label": label, "type": "action"}], "edges": []}

    if diagram_type == "usecase":
        actors: list[str] = []
        use_cases: list[str] = []
        relationships_local: list[dict[str, str]] = []
        if "library" in text.lower():
            actors = ["Member", "Librarian", "Admin"]
            use_cases = [
                "Search catalog",
                "Borrow book",
                "Return book",
                "Renew loan",
                "Pay fine",
                "Manage inventory",
            ]
            relationships_local = [
                {"from": "Member", "to": "Search catalog", "type": "uses"},
                {"from": "Member", "to": "Borrow book", "type": "uses"},
                {"from": "Member", "to": "Return book", "type": "uses"},
                {"from": "Member", "to": "Renew loan", "type": "uses"},
                {"from": "Member", "to": "Pay fine", "type": "uses"},
                {"from": "Librarian", "to": "Manage inventory", "type": "uses"},
            ]
            return {
                "type": "usecase",
                "actors": actors,
                "use_cases": [{"name": name} for name in use_cases],
                "relationships": relationships_local,
            }
        for line in (l.strip() for l in text.splitlines()):
            if not line:
                continue
            if line.lower().startswith("actors:"):
                actors = [a.strip() for a in line.split(":", 1)[1].split(",") if a.strip()]
            if line.lower().startswith("use cases:"):
                use_cases = [u.strip() for u in line.split(":", 1)[1].split(",") if u.strip()]
            match = re.match(r"(.+?)\s+uses\s+(.+)", line, flags=re.IGNORECASE)
            if match:
                relationships_local.append({"from": match.group(1).strip(), "to": match.group(2).strip(), "type": "uses"})
        if not actors:
            actors = ["Actor"]
        if not use_cases:
            use_cases = [text or "Use Case"]
        if not relationships_local:
            relationships_local = [{"from": actors[0], "to": use_cases[0], "type": "uses"}]
        return {
            "type": "usecase",
            "actors": actors,
            "use_cases": [{"name": name} for name in use_cases],
            "relationships": relationships_local,
        }

    if not classes and "library" in text.lower():
        ensure_class("Library")
        add_attributes("Library", ["id", "name", "address"])
        ensure_class("Book")
        add_attributes("Book", ["id", "title", "author", "isbn", "status"])
        ensure_class("Member")
        add_attributes("Member", ["id", "name", "email"])
        ensure_class("Loan")
        add_attributes("Loan", ["id", "issue_date", "due_date", "return_date"])
        ensure_class("Catalog")
        add_attributes("Catalog", ["id"])
        ensure_class("Librarian")
        add_attributes("Librarian", ["id", "name"])
        relationships.extend(
            [
                {"from": "Library", "to": "Catalog", "type": "has_one"},
                {"from": "Catalog", "to": "Book", "type": "has_many"},
                {"from": "Member", "to": "Loan", "type": "has_many"},
                {"from": "Loan", "to": "Book", "type": "belongs_to"},
                {"from": "Loan", "to": "Member", "type": "belongs_to"},
            ]
        )

    if not classes:
        class_name = "Main"
        if text:
            class_name = text.split()[0].title()
        ensure_class(class_name)

    return {"type": "class", "classes": list(classes.values()), "relationships": relationships}


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


def _extract_json(content: str) -> dict[str, Any] | None:
    parsed = _parse_response(content)
    if parsed:
        return parsed
    match = re.search(r"\{.*\}", content, flags=re.DOTALL)
    if not match:
        return None
    return _parse_response(match.group(0))

def _to_mermaid(diagram: dict[str, Any]) -> str | None:
    diagram_type = (diagram.get("type") or "class").lower()
    if diagram_type == "class":
        classes = diagram.get("classes", [])
        rels = diagram.get("relationships", [])
        lines = ["classDiagram"]
        for cls in classes:
            name = cls.get("name", "Class")
            lines.append(f"class {name} {{")
            for attr in cls.get("attributes", []) or []:
                lines.append(f"  +{attr}")
            for method in cls.get("methods", []) or []:
                lines.append(f"  +{method}()")
            lines.append("}")
        for rel in rels:
            left = rel.get("from")
            right = rel.get("to")
            rtype = (rel.get("type") or "").lower()
            if not left or not right:
                continue
            if rtype == "has_many":
                lines.append(f"{left} \"1\" --> \"*\" {right}")
            elif rtype == "belongs_to":
                lines.append(f"{left} \"*\" --> \"1\" {right}")
            else:
                lines.append(f"{left} --> {right}")
        return "\n".join(lines)

    if diagram_type == "sequence":
        actors = diagram.get("actors") or diagram.get("lifelines") or []
        messages = diagram.get("messages", [])
        lines = ["sequenceDiagram"]
        for actor in actors:
            lines.append(f"participant {actor}")
        for msg in sorted(messages, key=lambda m: m.get("order", 0)):
            src = msg.get("from")
            dst = msg.get("to")
            label = msg.get("label", "message")
            if src and dst:
                lines.append(f"{src} ->> {dst}: {label}")
        return "\n".join(lines)

    if diagram_type == "activity":
        nodes = diagram.get("nodes", [])
        edges = diagram.get("edges", [])
        if not nodes:
            return None
        id_to_label = {node.get("id"): node.get("label", node.get("id")) for node in nodes}
        lines = ["flowchart TD"]
        if edges:
            for edge in edges:
                frm = id_to_label.get(edge.get("from"), edge.get("from"))
                to = id_to_label.get(edge.get("to"), edge.get("to"))
                label = edge.get("label")
                if frm and to:
                    if label:
                        lines.append(f"{frm} -->|{label}| {to}")
                    else:
                        lines.append(f"{frm} --> {to}")
        else:
            for idx in range(len(nodes) - 1):
                lines.append(f"{id_to_label[nodes[idx]['id']]} --> {id_to_label[nodes[idx+1]['id']]}")
        return "\n".join(lines)

    if diagram_type == "usecase":
        actors = diagram.get("actors", [])
        use_cases = diagram.get("use_cases", [])
        rels = diagram.get("relationships", [])
        lines = ["flowchart LR"]
        actor_ids = {}
        usecase_ids = {}
        for idx, actor in enumerate(actors, start=1):
            actor_id = f"A{idx}"
            actor_ids[actor] = actor_id
            lines.append(f'{actor_id}((Actor)):::actor')
            lines.append(f'{actor_id}[\"{actor}\"]')
        for idx, uc in enumerate(use_cases, start=1):
            name = uc.get("name") if isinstance(uc, dict) else uc
            if not name:
                continue
            uc_id = f"U{idx}"
            usecase_ids[name] = uc_id
            lines.append(f'{uc_id}([\"{name}\"])')
        for rel in rels:
            left = rel.get("from")
            right = rel.get("to")
            if not left or not right:
                continue
            left_id = actor_ids.get(left) or usecase_ids.get(left) or left.replace(" ", "_")
            right_id = actor_ids.get(right) or usecase_ids.get(right) or right.replace(" ", "_")
            lines.append(f"{left_id} --> {right_id}")
        lines.append("classDef actor fill:#e2e8f0,stroke:#94a3b8;")
        return "\n".join(lines)

    return None


def _build_prompt(input_text: str, diagram_type: str) -> str:
    diagram_type = diagram_type.lower().strip()
    if diagram_type == "sequence":
        return (
            "Return ONLY valid JSON with keys: type, mermaid, actors, lifelines, messages. "
            "type must be 'sequence'. actors/lifelines are lists of names. "
            "messages is a list of {from, to, label, order}. "
            "Include 8-14 messages if the text is brief. "
            "Infer actors and system components for the domain. "
            f"Text: {input_text}"
        )
    if diagram_type == "activity":
        return (
            "Return ONLY valid JSON with keys: type, mermaid, nodes, edges. "
            "type must be 'activity'. nodes are {id, label, type}. edges are {from, to, label}. "
            "Include 6-10 steps if the text is brief. "
            "Use node types like start, action, decision, end when appropriate. "
            f"Text: {input_text}"
        )
    if diagram_type == "usecase":
        return (
            "Return ONLY valid JSON with keys: type, mermaid, actors, use_cases, relationships. "
            "type must be 'usecase'. actors is list of names. use_cases is list of {name}. "
            "relationships are {from, to, type}. "
            "Include 3-6 use cases if the text is brief. "
            "Infer typical actors and use cases for the domain. "
            f"Text: {input_text}"
        )
    return (
        "Return ONLY valid JSON with keys: type, mermaid, classes, relationships. "
        "type must be 'class'. "
        "Each class has name, attributes (list), methods (list). "
        "Relationships include from, to, type. "
        "If text is brief, infer typical classes for the domain. "
        f"Text: {input_text}"
    )


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
            {"role": "system", "content": "You output UML as JSON only."},
            {"role": "user", "content": _build_prompt(input_text, diagram_type)},
        ],
        "temperature": 0,
    }

    headers = {"Accept": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"

    try:
        with httpx.Client(timeout=settings.llm_timeout_seconds) as client:
            response = client.post(settings.llm_api_url, json=payload, headers=headers)
        response.raise_for_status()
    except httpx.HTTPError:
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
        fallback = _fallback_uml(input_text, diagram_type)
        if "mermaid" not in fallback:
            mermaid_code = _to_mermaid(fallback)
            if mermaid_code:
                fallback["mermaid"] = mermaid_code
        return fallback

    parsed = _extract_json(content)
    if not parsed:
        fallback = _fallback_uml(input_text, diagram_type)
        if "mermaid" not in fallback:
            mermaid_code = _to_mermaid(fallback)
            if mermaid_code:
                fallback["mermaid"] = mermaid_code
        return fallback
    if "type" not in parsed:
        parsed["type"] = diagram_type.lower().strip()
    if "mermaid" not in parsed:
        mermaid_code = _to_mermaid(parsed)
        if mermaid_code:
            parsed["mermaid"] = mermaid_code
    return parsed
