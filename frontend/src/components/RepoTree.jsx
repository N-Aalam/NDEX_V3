const RepoTree = ({ entries }) => {
  if (!entries?.length) {
    return <p className="small">No repository data yet.</p>;
  }

  const tree = {};
  entries.forEach((entry) => {
    const parts = entry.path.split("/");
    let cursor = tree;
    parts.forEach((part, index) => {
      if (!cursor[part]) {
        cursor[part] = { __children: {}, __type: index === parts.length - 1 ? entry.type : "tree" };
      }
      cursor = cursor[part].__children;
    });
  });

  const renderNode = (node) => (
    <ul className="list">
      {Object.entries(node).map(([name, value]) => (
        <li key={name}>
          {value.__type === "tree" ? "📁" : "📄"} {name}
          {Object.keys(value.__children).length > 0 && renderNode(value.__children)}
        </li>
      ))}
    </ul>
  );

  return renderNode(tree);
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

const EXT_COLORS = {
  js: "#84cc16",
  jsx: "#22c55e",
  ts: "#38bdf8",
  tsx: "#0ea5e9",
  json: "#a855f7",
  css: "#6366f1",
  md: "#f59e0b",
  default: "#94a3b8"
};

const buildHierarchy = (entries) => {
  const root = { name: "repo", path: "", type: "tree", children: new Map() };
  entries.forEach((entry) => {
    const parts = entry.path.split("/").filter(Boolean);
    let cursor = root;
    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!cursor.children.has(part)) {
        cursor.children.set(part, {
          name: part,
          path: currentPath,
          type: index === parts.length - 1 ? entry.type : "tree",
          size: index === parts.length - 1 ? entry.size || 1 : 0,
          children: new Map()
        });
      }
      cursor = cursor.children.get(part);
    });
  });

  const toArray = (node) => ({
    ...node,
    children: Array.from(node.children.values()).map(toArray)
  });

  return toArray(root);
};

const flattenLeaves = (node, list = []) => {
  if (!node.children.length) {
    list.push(node.path);
  } else {
    node.children.forEach((child) => flattenLeaves(child, list));
  }
  return list;
};

const RepoTree = ({ entries }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const zoomRef = useRef(null);
  const zoomNodeRef = useRef(null);
  const playbackRef = useRef(null);
  const rafRef = useRef(null);

  const [activePath, setActivePath] = useState("");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [playing, setPlaying] = useState(false);

  const hierarchy = useMemo(() => buildHierarchy(entries || []), [entries]);
  const leaves = useMemo(() => flattenLeaves(hierarchy), [hierarchy]);

  const stopPlayback = () => {
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
    setPlaying(false);
  };

  const updateTooltipPosition = (event) => {
    if (!tooltipRef.current) return;
    const { clientX, clientY } = event;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      tooltipRef.current.style.left = `${clientX + 14}px`;
      tooltipRef.current.style.top = `${clientY + 14}px`;
    });
  };

  useEffect(() => {
    if (!entries?.length) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 720;
    const height = 420;
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const root = d3
      .hierarchy(hierarchy)
      .sum((d) => (d.size && d.size > 0 ? d.size : 1))
      .sort((a, b) => b.value - a.value);

    d3.pack().size([width, height]).padding(4)(root);

    const g = svg.append("g").attr("class", "pack-root");

    const zoom = d3
      .zoom()
      .scaleExtent([0.7, 2.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const zoomToNode = (d) => {
      if (!d || !d.x || !d.y) {
        return;
      }
      const scale = Math.min(2.2, Math.max(0.9, width / (d.r * 2.2)));
      const translate = [width / 2 - d.x * scale, height / 2 - d.y * scale];
      svg
        .transition()
        .duration(650)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    };

    zoomNodeRef.current = zoomToNode;

    const nodes = g
      .selectAll("g")
      .data(root.descendants().filter((d) => d.depth > 0))
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .on("click", (_, d) => {
        setActivePath(d.data.path);
        zoomToNode(d);
      })
      .on("mouseenter", (_, d) => {
        const isFolder = Boolean(d.children);
        const size = d.value || 0;
        setHoverInfo({
          name: d.data.name,
          path: d.data.path || d.data.name,
          type: isFolder ? "folder" : "file",
          size
        });
        if (playing) {
          stopPlayback();
        }
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", () => setHoverInfo(null));

    const circle = nodes
      .append("circle")
      .attr("r", 0)
      .attr("class", (d) => {
        if (d.children) {
          return "pack-node folder";
        }
        const ext = d.data.name.split(".").pop()?.toLowerCase();
        return `pack-node file ext-${ext || "default"}`;
      })
      .attr("fill", (d) => {
        if (d.children) {
          return "rgba(148, 163, 184, 0.2)";
        }
        const ext = d.data.name.split(".").pop()?.toLowerCase();
        return EXT_COLORS[ext] || EXT_COLORS.default;
      });

    circle
      .transition()
      .duration(600)
      .attr("r", (d) => d.r);

    nodes
      .append("text")
      .attr("class", "pack-label")
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .style("opacity", (d) => (d.r > 18 ? 1 : 0))
      .text((d) => (d.data.name.length > 10 ? `${d.data.name.slice(0, 9)}…` : d.data.name));

    nodes.append("title").text((d) => d.data.path || d.data.name);

    return () => {
      svg.on(".zoom", null);
    };
  }, [entries, hierarchy, playing]);

  useEffect(() => {
    if (!entries?.length) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    svg
      .selectAll("circle.pack-node")
      .classed("active", (d) => d.data.path === activePath);
  }, [activePath, entries]);

  useEffect(() => {
    if (!playing || !leaves.length) {
      return undefined;
    }
    let index = 0;
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }
    playbackRef.current = setInterval(() => {
      const path = leaves[index];
      setActivePath(path);
      const svg = d3.select(svgRef.current);
      const targetNode = svg
        .selectAll("g")
        .filter((d) => d?.data?.path === path)
        .datum();
      if (targetNode && zoomNodeRef.current) {
        zoomNodeRef.current(targetNode);
      }
      index = (index + 1) % leaves.length;
    }, 220);

    return () => {
      clearInterval(playbackRef.current);
    };
  }, [playing, leaves]);

  useEffect(() => () => stopPlayback(), []);

  if (!entries?.length) {
    return <p className="small">No repository data yet.</p>;
  }

  return (
    <div className="pack-shell">
      <div className="pack-toolbar">
        <div className="pack-actions">
          <button type="button" onClick={() => setPlaying(true)}>
            Play
          </button>
          <button type="button" className="secondary" onClick={stopPlayback}>
            Stop
          </button>
        </div>
        <div className="pack-legend">
          {Object.entries(EXT_COLORS).map(([ext, color]) =>
            ext === "default" ? null : (
              <span key={ext} className="legend-item">
                <span className="legend-dot" style={{ background: color }} />
                .{ext}
              </span>
            )
          )}
          <span className="legend-item">
            <span className="legend-dot folder" />
            folder
          </span>
        </div>
      </div>
      {hoverInfo && (
        <div ref={tooltipRef} className="pack-tooltip">
          <p className="tooltip-title">{hoverInfo.name}</p>
          <p className="small">{hoverInfo.path}</p>
          <p className="small">
            {hoverInfo.type} • {Math.max(1, hoverInfo.size)} units
          </p>
        </div>
      )}
      <svg ref={svgRef} className="diagram-canvas pack-canvas" role="img" aria-label="Repo bubble pack" />
    </div>
  );
};

export default RepoTree;
