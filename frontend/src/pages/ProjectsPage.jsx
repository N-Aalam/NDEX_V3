import { useEffect, useState } from "react";

import { createProject, getProjectHistory, listProjects } from "../lib/api.js";

const ProjectsPage = ({ token, activeProject, setActiveProject }) => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");

  const loadProjects = async () => {
    try {
      const data = await listProjects(token);
      setProjects(data);
      if (!activeProject && data.length > 0) {
        setActiveProject(data[0].id);
      }
    } catch (error) {
      setStatus(error.message);
    }
  };

  const loadHistory = async (projectId) => {
    if (!projectId) return;
    try {
      const data = await getProjectHistory(token, projectId);
      setHistory(data.items || []);
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeProject) {
      loadHistory(activeProject);
    }
  }, [token, activeProject]);

  const onCreate = async () => {
    try {
      const project = await createProject(token, { name });
      setName("");
      setProjects((prev) => [project, ...prev]);
      setActiveProject(project.id);
      setStatus("Project created");
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (!token) {
    return <p className="small">Sign in to manage projects.</p>;
  }

  return (
    <section className="card grid two">
      <div className="grid">
        <div className="section-title">
          <h2>Projects</h2>
          <button className="secondary" onClick={loadProjects}>
            Refresh
          </button>
        </div>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" />
        <button onClick={onCreate}>Create Project</button>
        <select value={activeProject || ""} onChange={(event) => setActiveProject(event.target.value)}>
          <option value="">Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h2>Project History</h2>
        {history.length === 0 ? (
          <p className="small">No history yet.</p>
        ) : (
          <ul className="list">
            {history.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <span className="badge">{item.type}</span> {item.summary}
                <br />
                <span className="small">{new Date(item.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {status && <p className="small">{status}</p>}
    </section>
  );
};

export default ProjectsPage;
