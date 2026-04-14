import { useState } from "react";

import CommitList from "../components/CommitList.jsx";
import DiagramHistory from "../components/DiagramHistory.jsx";
import DiagramView from "../components/DiagramView.jsx";
import GraphView from "../components/GraphView.jsx";
import RepoTree from "../components/RepoTree.jsx";
import { analyzeCode, analyzeRepo, generateUml, getUmlHistory } from "../lib/api.js";

const WorkspacePage = ({ token, activeProject }) => {
  const [umlText, setUmlText] = useState("");
  const [umlDiagram, setUmlDiagram] = useState(null);
  const [diagramHistory, setDiagramHistory] = useState([]);

  const [codeText, setCodeText] = useState("def add(a, b):\n    return a + b\n\nresult = add(1, 2)");
  const [codeGraph, setCodeGraph] = useState(null);
  const [steps, setSteps] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [repoUrl, setRepoUrl] = useState("https://github.com/octocat/Hello-World");
  const [repoTree, setRepoTree] = useState([]);
  const [repoCommits, setRepoCommits] = useState([]);
  const [repoInsights, setRepoInsights] = useState(null);
  const [status, setStatus] = useState("");

  const withGuard = (callback) => {
    if (!token) {
      setStatus("Login required");
      return;
    }
    if (!activeProject) {
      setStatus("Select a project first");
      return;
    }
    callback();
  };

  const onUmlGenerate = () =>
    withGuard(async () => {
      try {
        const data = await generateUml(token, {
          project_id: activeProject,
          input_text: umlText,
          diagram_type: "class"
        });
        setUmlDiagram(data.diagram_json);
        setDiagramHistory((prev) => [data, ...prev]);
      } catch (error) {
        setStatus(error.message);
      }
    });

  const onLoadUmlHistory = () =>
    withGuard(async () => {
      try {
        const items = await getUmlHistory(token, activeProject);
        setDiagramHistory(items);
      } catch (error) {
        setStatus(error.message);
      }
    });

  const onAnalyzeCode = () =>
    withGuard(async () => {
      try {
        const data = await analyzeCode(token, {
          project_id: activeProject,
          language: "python",
          code: codeText
        });
        setCodeGraph(data.execution_graph);
        setSteps(data.execution_graph.steps || []);
        setMetrics(data.execution_graph.ai_metrics || null);
      } catch (error) {
        setStatus(error.message);
      }
    });

  const onAnalyzeRepo = () =>
    withGuard(async () => {
      try {
        const data = await analyzeRepo(token, {
          project_id: activeProject,
          repo_url: repoUrl
        });
        setRepoTree(data.dependency_graph.entries || []);
        setRepoCommits(data.commits || []);
        setRepoInsights(data.dependency_graph.ai_insights || null);
      } catch (error) {
        setStatus(error.message);
      }
    });

  return (
    <>
      {status && <p className="small">{status}</p>}

      <section className="card">
        <div className="section-title">
          <h2>UML Generator</h2>
          <span className="badge">AI</span>
        </div>
        <div className="grid two">
          <div className="grid">
            <textarea value={umlText} onChange={(event) => setUmlText(event.target.value)} />
            <div className="grid two">
              <button onClick={onUmlGenerate}>Generate UML</button>
              <button className="secondary" onClick={onLoadUmlHistory}>
                Load History
              </button>
            </div>
            <DiagramHistory items={diagramHistory} onSelect={setUmlDiagram} />
          </div>
          <DiagramView diagram={umlDiagram} />
        </div>
      </section>

      <section className="card grid two">
        <div className="grid">
          <h2>Code Analyzer</h2>
          <textarea value={codeText} onChange={(event) => setCodeText(event.target.value)} />
          <button onClick={onAnalyzeCode}>Analyze Code</button>
          <ul className="list">
            {steps.map((step, index) => (
              <li key={`${step.node_id || "step"}-${index}`}>{step.description}</li>
            ))}
          </ul>
          {metrics && (
            <div>
              <p className="small">Maintainability: {metrics.maintainability_index ?? "n/a"}/100</p>
              <ul className="list">
                {(metrics.hotspots || []).map((hotspot) => (
                  <li key={hotspot}>Hotspot: {hotspot}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <GraphView graph={codeGraph} />
      </section>

      <section className="card grid two">
        <div className="grid">
          <h2>Repo Analyzer</h2>
          <input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} />
          <button onClick={onAnalyzeRepo}>Analyze Repo</button>
          <CommitList commits={repoCommits} />
          {repoInsights && (
            <ul className="list">
              <li>{repoInsights.repository_health}</li>
              <li>{repoInsights.collaboration_patterns}</li>
            </ul>
          )}
        </div>
        <RepoTree entries={repoTree} />
      </section>
    </>
  );
};

export default WorkspacePage;
