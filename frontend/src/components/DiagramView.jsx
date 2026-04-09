import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import mermaid from "mermaid";

const BOX_WIDTH = 160;
const BOX_HEIGHT = 80;

const DiagramView = ({ diagram }) => {
  const svgRef = useRef(null);
  const isMermaidDiagram = Boolean(diagram?.image_url);
  const [editableCode, setEditableCode] = useState("");
  const [renderedSvg, setRenderedSvg] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });
  }, []);

  useEffect(() => {
    if (diagram?.mermaid_code) {
      setEditableCode(diagram.mermaid_code);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [diagram]);

  useEffect(() => {
    if (!isMermaidDiagram || !editableCode.trim()) {
      setRenderedSvg("");
      return;
    }

    let cancelled = false;
    const renderMermaid = async () => {
      try {
        const { svg } = await mermaid.render(`uml-${Date.now()}`, editableCode);
        if (!cancelled) {
          setRenderedSvg(svg);
        }
      } catch {
        if (!cancelled) {
          setRenderedSvg("<p class='small'>Unable to render Mermaid code.</p>");
        }
      }
    };

    renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [editableCode, isMermaidDiagram]);

  useEffect(() => {
    if (isMermaidDiagram) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!diagram || !diagram.classes) {
      return;
    }

    const classes = diagram.classes;
    const padding = 24;
    const columns = Math.max(1, Math.floor(720 / (BOX_WIDTH + padding)));

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
  }, [diagram, isMermaidDiagram]);

  if (isMermaidDiagram) {
    return (
      <div>
        <div className="grid two" style={{ marginBottom: 12 }}>
          <button className="secondary" onClick={() => setZoom((prev) => Math.min(2.5, prev + 0.1))}>
            Zoom In
          </button>
          <button className="secondary" onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}>
            Zoom Out
          </button>
          <button className="secondary" onClick={() => setPan((prev) => ({ ...prev, x: prev.x - 30 }))}>
            Pan Left
          </button>
          <button className="secondary" onClick={() => setPan((prev) => ({ ...prev, x: prev.x + 30 }))}>
            Pan Right
          </button>
          <button className="secondary" onClick={() => setPan((prev) => ({ ...prev, y: prev.y - 30 }))}>
            Pan Up
          </button>
          <button className="secondary" onClick={() => setPan((prev) => ({ ...prev, y: prev.y + 30 }))}>
            Pan Down
          </button>
        </div>
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "auto",
            padding: 12,
            minHeight: 320,
            marginBottom: 12
          }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left"
            }}
            dangerouslySetInnerHTML={{ __html: renderedSvg }}
          />
        </div>
        <img
          src={diagram.image_url}
          alt={diagram.title || "Generated UML diagram"}
          style={{ width: "100%", borderRadius: 12, border: "1px solid #e2e8f0" }}
        />
        <textarea
          value={editableCode}
          onChange={(event) => setEditableCode(event.target.value)}
          style={{ marginTop: 12 }}
          placeholder="Edit Mermaid code here for live re-render"
        />
      </div>
    );
  }

  return <svg ref={svgRef} role="img" aria-label="UML diagram" />;
};

export default DiagramView;
