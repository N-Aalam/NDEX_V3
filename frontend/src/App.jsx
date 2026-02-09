import { useMemo, useState } from "react";

import DiagramHistory from "./components/DiagramHistory.jsx";
import DiagramView from "./components/DiagramView.jsx";
import GraphView from "./components/GraphView.jsx";
import RepoTree from "./components/RepoTree.jsx";
import CommitList from "./components/CommitList.jsx";
import ProfileCard from "./components/ProfileCard.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const App = () => {
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [token, setToken] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [activeProject, setActiveProject] = useState("");
  const [umlText, setUmlText] = useState("");
  const [umlDiagram, setUmlDiagram] = useState(null);
  const [diagramHistory, setDiagramHistory] = useState([]);
  const [codeText, setCodeText] = useState("def add(a, b):\n    return a + b\n\nresult = add(1, 2)");
  const [codeGraph, setCodeGraph] = useState(null);
  const [steps, setSteps] = useState([]);
  const [repoUrl, setRepoUrl] = useState("https://github.com/octocat/Hello-World");
  const [repoTree, setRepoTree] = useState([]);
  const [repoCommits, setRepoCommits] = useState([]);
  const [status, setStatus] = useState("");

  const headers = useMemo(() => {
    if (!token) {
      return { "Content-Type": "application/json" };
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  }, [token]);

  const setError = (message) => {
    setStatus(message);
    setTimeout(() => setStatus(""), 4000);
  };

  const handleAuth = async () => {
    try {
      if (authMode === "register") {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        if (!response.ok) {
          throw new Error("Registration failed");
        }
      }

      const form = new URLSearchParams();
      form.append("username", authEmail);
      form.append("password", authPassword);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const json = await response.json();
      setToken(json.access_token || "");
      setStatus("Authenticated");
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects/list`, { headers });
      if (!response.ok) {
        throw new Error("Failed to load projects");
      }
      const json = await response.json();
      setProjects(json);
      if (json.length > 0 && !activeProject) {
        setActiveProject(json[0].id);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const createProject = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: projectName })
      });
      if (!response.ok) {
        throw new Error("Failed to create project");
      }
      const json = await response.json();
      setProjects((prev) => [json, ...prev]);
      setProjectName("");
      setActiveProject(json.id);
    } catch (error) {
      setError(error.message);
    }
  };

  const loadDiagramHistory = async () => {
    if (!activeProject) {
      setError("Select a project first");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/uml/list?project_id=${activeProject}`, { headers });
      if (!response.ok) {
        throw new Error("Failed to load diagram history");
      }
      const json = await response.json();
      setDiagramHistory(json);
    } catch (error) {
      setError(error.message);
    }
  };

  const generateUml = async () => {
    try {
      const response = await fetch(`${API_BASE}/uml/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: activeProject,
          input_text: umlText,
          diagram_type: "class"
        })
      });
      if (!response.ok) {
        throw new Error("UML generation failed");
      }
      const json = await response.json();
      setUmlDiagram(json.diagram_json);
      setDiagramHistory((prev) => [json, ...prev]);
    } catch (error) {
      setError(error.message);
    }
  };

  const analyzeCode = async () => {
    try {
      const response = await fetch(`${API_BASE}/code/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: activeProject,
          language: "python",
          code: codeText
        })
      });
      if (!response.ok) {
        throw new Error("Code analysis failed");
      }
      const json = await response.json();
      setCodeGraph(json.execution_graph);
      setSteps(json.execution_graph.steps || []);
    } catch (error) {
      setError(error.message);
    }
  };

  const analyzeRepo = async () => {
    try {
      const response = await fetch(`${API_BASE}/repo/analyze`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: activeProject,
          repo_url: repoUrl
        })
      });
      if (!response.ok) {
        throw new Error("Repo analysis failed");
      }
      const json = await response.json();
      setRepoTree(json.dependency_graph.entries || []);
      setRepoCommits(json.commits || json.dependency_graph.commits || []);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main>
      <header className="card">
        <h1>NDEX — Neural Design Explorer</h1>
        <p className="small">Phase 4 frontend: UML + Code + Repo visualization connected to the API.</p>
      </header>

      <ProfileCard />

      <section className="card grid two">
        <div>
          <div className="section-title">
            <h2>Authentication</h2>
            <span className="badge">{authMode === "login" ? "Login" : "Register"}</span>
          </div>
          <div className="grid">
            <input
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="Email"
              type="email"
            />
            <input
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="Password"
              type="password"
            />
            <div className="grid two">
              <button onClick={handleAuth}>{authMode === "login" ? "Login" : "Register"}</button>
              <button
                className="secondary"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              >
                Switch to {authMode === "login" ? "Register" : "Login"}
              </button>
            </div>
          </div>
        </div>
        <div>
          <div className="section-title">
            <h2>Projects</h2>
            <button className="secondary" onClick={fetchProjects}>
              Refresh
            </button>
          </div>
          <div className="grid">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="New project name"
            />
            <button onClick={createProject}>Create Project</button>
            <select value={activeProject} onChange={(event) => setActiveProject(event.target.value)}>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {status && <p className="small">{status}</p>}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>UML Generator</h2>
          <span className="badge">Phase 2</span>
        </div>
        <div className="grid two">
          <div className="grid">
            <textarea
              value={umlText}
              onChange={(event) => setUmlText(event.target.value)}
              placeholder="Describe classes and relationships..."
            />
            <div className="grid two">
              <button onClick={generateUml}>Generate UML</button>
              <button className="secondary" onClick={loadDiagramHistory}>
                Load History
              </button>
            </div>
            <DiagramHistory items={diagramHistory} onSelect={setUmlDiagram} />
          </div>
          <DiagramView diagram={umlDiagram} />
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Code Analyzer</h2>
          <span className="badge">Phase 3</span>
        </div>
        <div className="grid two">
          <div className="grid">
            <textarea value={codeText} onChange={(event) => setCodeText(event.target.value)} />
            <button onClick={analyzeCode}>Analyze Code</button>
            <div>
              <strong>Execution steps</strong>
              <ul className="list">
                {steps.map((step, index) => (
                  <li key={`${step.node_id}-${index}`}>{step.description}</li>
                ))}
              </ul>
            </div>
          </div>
          <GraphView graph={codeGraph} />
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Repo Analyzer</h2>
          <span className="badge">Phase 4</span>
        </div>
        <div className="grid two">
          <div className="grid">
            <input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} />
            <button onClick={analyzeRepo}>Analyze Repo</button>
            <p className="small">Paste a public GitHub repository URL.</p>
            <div>
              <strong>Recent commits</strong>
              <CommitList commits={repoCommits} />
            </div>
          </div>
          <div>
            <RepoTree entries={repoTree} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default App;
