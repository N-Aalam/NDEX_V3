import { useEffect, useState } from "react";

import { getDashboard } from "../lib/api.js";

const DashboardPage = ({ token }) => {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getDashboard(token);
        setSummary(data);
      } catch (error) {
        setStatus(error.message);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  if (!token) {
    return <p className="small">Sign in to see dashboard insights.</p>;
  }

  return (
    <section className="card">
      <div className="section-title">
        <h2>Dashboard</h2>
        <span className="badge">Analytics</span>
      </div>
      {status && <p className="small">{status}</p>}
      {summary && (
        <div className="grid two">
          <div className="metric-card">
            <strong>{summary.total_projects}</strong>
            <p className="small">Projects</p>
          </div>
          <div className="metric-card">
            <strong>{summary.total_diagrams}</strong>
            <p className="small">UML diagrams</p>
          </div>
          <div className="metric-card">
            <strong>{summary.total_code_sessions}</strong>
            <p className="small">Code analyses</p>
          </div>
          <div className="metric-card">
            <strong>{summary.total_repo_analyses}</strong>
            <p className="small">Repo analyses</p>
          </div>
        </div>
      )}
      {summary?.recent_projects?.length > 0 && (
        <div>
          <h3>Recent projects</h3>
          <ul className="list">
            {summary.recent_projects.map((project) => (
              <li key={project.id}>
                {project.name} · {new Date(project.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default DashboardPage;
