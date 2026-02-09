import { useEffect, useMemo, useState } from "react";

import DiagramView from "./components/DiagramView.jsx";
import GraphView from "./components/GraphView.jsx";

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
  const [codeText, setCodeText] = useState("def add(a, b):\n    return a + b\n\nresult = add(1, 2)");
  const [codeGraph, setCodeGraph] = useState(null);
  const [steps, setSteps] = useState([]);
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
      if (json.access_token) {
        await fetchProjects(json.access_token);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const fetchProjects = async (authToken = token) => {
    try {
      const authHeaders = authToken
        ? { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` }
        : headers;
      const response = await fetch(`${API_BASE}/projects/list`, { headers: authHeaders });
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

  useEffect(() => {
    if (token) {
      fetchProjects(token);
    }
  }, [token]);

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
      const executionGraph = json.execution_graph || {};
      setCodeGraph(executionGraph);
      setSteps(executionGraph.steps || []);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main>
      <nav className="topbar">
        <div>
          <p className="brand">NDEX Studio</p>
          <p className="small">Neural Design Explorer • Phase 4</p>
        </div>
        <div className="topbar-group">
          <div className="project-switcher">
            <span className="small">Active project</span>
            <select value={activeProject} onChange={(event) => setActiveProject(event.target.value)}>
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="profile">
            <div className="avatar">NA</div>
            <div>
              <p className="profile-name">NDEX Operator</p>
              <p className="small">admin@ndex.local</p>
            </div>
          </div>
        </div>
      </nav>

      <header className="card hero">
        <h1>NDEX — Neural Design Explorer</h1>
        <p className="small">Model architecture, UML, and execution traces in one workspace.</p>
      </header>

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
            <div className="project-list">
              <p className="small">Project list</p>
              <ul className="list flush">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      className={`pill ${activeProject === project.id ? "active" : ""}`}
                      onClick={() => setActiveProject(project.id)}
                    >
                      {project.name}
                    </button>
                  </li>
                ))}
                {!projects.length && <li className="small muted">No projects yet.</li>}
              </ul>
            </div>
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
            <button onClick={generateUml}>Generate UML</button>
          </div>
          <div className="visual-card">
            <div className="visual-header">
              <div>
                <p className="visual-title">UML Output</p>
                <p className="small">Classes and relationships</p>
              </div>
              <span className="badge soft">Diagram</span>
            </div>
            <DiagramView diagram={umlDiagram} />
          </div>
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
          <div className="visual-card">
            <div className="visual-header">
              <div>
                <p className="visual-title">Execution Graph</p>
                <p className="small">Runtime flow nodes</p>
              </div>
              <span className="badge soft">Analysis</span>
            </div>
            <GraphView graph={codeGraph} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default App;
