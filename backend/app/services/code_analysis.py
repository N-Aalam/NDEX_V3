import ast
from typing import Any


class _StepCollector(ast.NodeVisitor):
    def __init__(self) -> None:
        self.steps: list[dict[str, Any]] = []
        self.edges: list[dict[str, str]] = []
        self.nodes: list[dict[str, str]] = []
        self._last_node_id: str | None = None
        self._counter = 0

    def _new_node(self, label: str, node_type: str) -> str:
        self._counter += 1
        node_id = f"n{self._counter}"
        self.nodes.append({"id": node_id, "label": label, "type": node_type})
        if self._last_node_id:
            self.edges.append({"from": self._last_node_id, "to": node_id})
        self._last_node_id = node_id
        return node_id

    def _add_step(self, description: str, node_id: str | None) -> None:
        self.steps.append({"description": description, "node_id": node_id})

    def visit_Assign(self, node: ast.Assign) -> Any:
        target_names = [self._format_target(target) for target in node.targets]
        label = f"assign {', '.join(target_names)}"
        node_id = self._new_node(label, "assign")
        self._add_step(f"Assign to {', '.join(target_names)}", node_id)
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call) -> Any:
        func_name = self._format_call(node.func)
        label = f"call {func_name}"
        node_id = self._new_node(label, "call")
        self._add_step(f"Call {func_name}", node_id)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> Any:
        label = f"def {node.name}"
        node_id = self._new_node(label, "function")
        self._add_step(f"Define function {node.name}", node_id)
        self.generic_visit(node)

    def visit_Return(self, node: ast.Return) -> Any:
        node_id = self._new_node("return", "return")
        self._add_step("Return from function", node_id)
        self.generic_visit(node)

    def _format_target(self, target: ast.AST) -> str:
        if isinstance(target, ast.Name):
            return target.id
        if isinstance(target, ast.Attribute):
            return f"{self._format_target(target.value)}.{target.attr}"
        return target.__class__.__name__

    def _format_call(self, func: ast.AST) -> str:
        if isinstance(func, ast.Name):
            return func.id
        if isinstance(func, ast.Attribute):
            return f"{self._format_call(func.value)}.{func.attr}"
        return func.__class__.__name__


def analyze_code(code: str) -> dict[str, Any]:
    tree = ast.parse(code)
    collector = _StepCollector()
    collector.visit(tree)
    return {
        "nodes": collector.nodes,
        "edges": collector.edges,
        "steps": collector.steps,
    }
