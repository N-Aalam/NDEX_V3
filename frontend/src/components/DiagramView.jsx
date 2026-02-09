import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

const BOX_WIDTH = 160;
const BOX_HEIGHT = 80;

const DiagramView = ({ diagram, diagramType = "class" }) => {
  const svgRef = useRef(null);
  const mermaidRef = useRef(null);

  const mermaidCode = useMemo(() => {
    if (!diagram || !diagram.mermaid) return "";
    return diagram.mermaid;
  }, [diagram]);

  useEffect(() => {
    if (!mermaidCode) return;
    const mermaidLib = window?.mermaid;
    if (!mermaidLib) {
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = "<pre>Mermaid not loaded.</pre>";
      }
      return;
    }
    mermaidLib.initialize({ startOnLoad: false, securityLevel: "loose" });
    const renderMermaid = async () => {
      try {
        const { svg } = await mermaidLib.render(`mermaid-${Date.now()}`, mermaidCode);
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = `<pre>${String(err)}</pre>`;
        }
      }
    };
    renderMermaid();
  }, [mermaidCode]);

  useEffect(() => {
    if (mermaidCode) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!diagram) {
      return;
    }

    const width = 720;
    const height = 320;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto-start-reverse")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#2563eb");

    const type = (diagram.type || diagramType || "class").toLowerCase();

    if (type === "sequence") {
      const lifelines = diagram.lifelines || diagram.actors || [];
      const messages = diagram.messages || [];
      const padding = 40;
      const spacing = lifelines.length ? (width - padding * 2) / lifelines.length : 120;

      lifelines.forEach((name, index) => {
        const x = padding + index * spacing + spacing / 2;
        svg
          .append("text")
          .attr("x", x)
          .attr("y", 24)
          .attr("text-anchor", "middle")
          .attr("font-weight", 600)
          .text(name);
        svg
          .append("line")
          .attr("x1", x)
          .attr("y1", 36)
          .attr("x2", x)
          .attr("y2", height - 20)
          .attr("stroke", "#94a3b8")
          .attr("stroke-dasharray", "4 4");
      });

      messages
        .slice()
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach((message, index) => {
          const fromIndex = lifelines.indexOf(message.from);
          const toIndex = lifelines.indexOf(message.to);
          if (fromIndex < 0 || toIndex < 0) return;
          const y = 60 + index * 28;
          const x1 = padding + fromIndex * spacing + spacing / 2;
          const x2 = padding + toIndex * spacing + spacing / 2;
          svg
            .append("line")
            .attr("x1", x1)
            .attr("y1", y)
            .attr("x2", x2)
            .attr("y2", y)
            .attr("stroke", "#2563eb")
            .attr("marker-end", "url(#arrow)");
          svg
            .append("text")
            .attr("x", (x1 + x2) / 2)
            .attr("y", y - 6)
            .attr("text-anchor", "middle")
            .attr("font-size", 11)
            .text(message.label || "message");
        });

      return;
    }

    if (type === "activity") {
      const nodes = diagram.nodes || [];
      const edges = diagram.edges || [];
      const startX = 60;
      const startY = 40;
      const spacingY = 70;

      nodes.forEach((node, index) => {
        const x = startX;
        const y = startY + index * spacingY;
        svg
          .append("rect")
          .attr("x", x)
          .attr("y", y)
          .attr("width", 240)
          .attr("height", 44)
          .attr("rx", 10)
          .attr("fill", "#f8fafc")
          .attr("stroke", "#2563eb");
        svg
          .append("text")
          .attr("x", x + 12)
          .attr("y", y + 26)
          .attr("font-weight", 600)
          .text(node.label || node.id);
      });

      edges.forEach((edge) => {
        const fromIndex = nodes.findIndex((node) => node.id === edge.from);
        const toIndex = nodes.findIndex((node) => node.id === edge.to);
        if (fromIndex < 0 || toIndex < 0) return;
        const x1 = startX + 120;
        const y1 = startY + fromIndex * spacingY + 44;
        const x2 = startX + 120;
        const y2 = startY + toIndex * spacingY;
        svg
          .append("line")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("stroke", "#94a3b8")
          .attr("marker-end", "url(#arrow)");
      });
      return;
    }

    if (type === "usecase") {
      const actors = diagram.actors || [];
      const useCases = diagram.use_cases || [];
      const padding = 40;

      actors.forEach((actor, index) => {
        const x = padding;
        const y = padding + index * 90;
        svg.append("circle").attr("cx", x).attr("cy", y).attr("r", 20).attr("fill", "#e2e8f0");
        svg
          .append("text")
          .attr("x", x)
          .attr("y", y + 36)
          .attr("text-anchor", "middle")
          .text(actor);
      });

      useCases.forEach((useCase, index) => {
        const x = width / 2;
        const y = padding + index * 90;
        svg
          .append("ellipse")
          .attr("cx", x)
          .attr("cy", y)
          .attr("rx", 90)
          .attr("ry", 30)
          .attr("fill", "#f8fafc")
          .attr("stroke", "#2563eb");
        svg
          .append("text")
          .attr("x", x)
          .attr("y", y + 4)
          .attr("text-anchor", "middle")
          .text(useCase.name || useCase);
      });
      return;
    }

    const classes = diagram.classes || [];
    const padding = 24;
    const columns = Math.max(1, Math.floor(width / (BOX_WIDTH + padding)));

    const group = svg.append("g").attr("transform", `translate(${padding}, ${padding})`);

    classes.forEach((item, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = column * (BOX_WIDTH + padding);
      const y = row * (BOX_HEIGHT + padding);

      const node = group.append("g").attr("transform", `translate(${x}, ${y})`);

      node
        .append("rect")
        .attr("width", BOX_WIDTH)
        .attr("height", BOX_HEIGHT)
        .attr("rx", 12)
        .attr("fill", "#f8fafc")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 1.5);

      node
        .append("text")
        .attr("x", 12)
        .attr("y", 24)
        .attr("font-weight", 600)
        .text(item.name || "Class");

      const attributes = (item.attributes || []).slice(0, 2).join(", ");
      node
        .append("text")
        .attr("x", 12)
        .attr("y", 48)
        .attr("font-size", 12)
        .attr("fill", "#475569")
        .text(attributes || "no attributes");

      const methods = (item.methods || []).slice(0, 2).join(", ");
      node
        .append("text")
        .attr("x", 12)
        .attr("y", 66)
        .attr("font-size", 12)
        .attr("fill", "#475569")
        .text(methods || "no methods");
    });
  }, [diagram, diagramType, mermaidCode]);

  if (mermaidCode) {
    return <div ref={mermaidRef} className="diagram-canvas" aria-label="Mermaid diagram" />;
  }

  return <svg ref={svgRef} role="img" aria-label="UML diagram" className="diagram-canvas" />;
};

export default DiagramView;
