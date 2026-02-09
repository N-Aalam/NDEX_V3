import { useEffect, useRef } from "react";
import * as d3 from "d3";

const GraphView = ({ graph }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!graph || !graph.nodes) {
      return;
    }

    const width = 720;
    const height = 280;

    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const nodes = graph.nodes.map((node) => ({ ...node }));
    const links = (graph.edges || [])
      .map((edge) => ({
        ...edge,
        source: edge.source ?? edge.from,
        target: edge.target ?? edge.to
      }))
      .filter((edge) => edge.source && edge.target);

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append("g")
      .attr("stroke", "#94a3b8")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke-width", 1.5);

    const node = svg
      .append("g")
      .selectAll("g")
      .data(simulation.nodes())
      .enter()
      .append("g");

    node
      .append("circle")
      .attr("r", 18)
      .attr("fill", "#2563eb");

    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .attr("fill", "#fff")
      .attr("font-size", 10)
      .text((d) => d.label?.slice(0, 6) || d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("transform", (d) => `translate(${d.x}, ${d.y})`);
    });

    return () => simulation.stop();
  }, [graph]);

  return <svg ref={svgRef} role="img" aria-label="Execution graph" className="diagram-canvas" />;
};

export default GraphView;
