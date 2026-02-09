import { useEffect, useRef } from "react";
import * as d3 from "d3";

const BOX_WIDTH = 160;
const BOX_HEIGHT = 80;

const DiagramView = ({ diagram }) => {
  const svgRef = useRef(null);

  useEffect(() => {
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
  }, [diagram]);

  return <svg ref={svgRef} role="img" aria-label="UML diagram" />;
};

export default DiagramView;
