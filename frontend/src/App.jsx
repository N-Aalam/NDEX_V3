import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { getMe, login, register } from "./lib/api.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";

const tokenKey = "ndex_token";

const navClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

const App = () => {
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [token, setToken] = useState(localStorage.getItem(tokenKey) || "");
  const [profile, setProfile] = useState(null);
  const [activeProject, setActiveProject] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!token) {
      setProfile(null);
      localStorage.removeItem(tokenKey);
      return;
    }

    localStorage.setItem(tokenKey, token);
    getMe(token)
      .then(setProfile)
      .catch(() => {
        setToken("");
        setProfile(null);
      });
  }, [token]);

  const onAuth = async () => {
    try {
      if (authMode === "register") {
        await register({ email, password, full_name: fullName || null });
      }
      const auth = await login(email, password);
      setToken(auth.access_token || "");
      setStatus("Authenticated successfully");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <main className="app-shell">
      <aside className="card sidebar">
        <h1>NDEX</h1>
        <p className="small">Neural Design Explorer</p>

        <nav className="nav-stack">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={navClass}>
            Projects
          </NavLink>
          <NavLink to="/workspace" className={navClass}>
            Workspace
          </NavLink>
          <NavLink to="/profile" className={navClass}>
            Profile
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {profile ? (
            <>
              <strong>{profile.full_name || profile.email}</strong>
              <p className="small">{profile.email}</p>
              <button className="secondary" onClick={() => setToken("")}>
                Logout
              </button>
            </>
          ) : (
            <p className="small">Sign in to activate all workspace features.</p>
          )}
        </div>
      </aside>

      <section className="content-panel">
        <header className="card hero-banner">
          <p className="badge">AI Powered Platform</p>
          <h2>Multi-Page Analysis Workspace</h2>
          <p className="small">Unified dashboard, project history, repo/code/UML analyzers, and profile sync.</p>
        </header>

        <section className="card auth-strip">
          <div className="auth-grid">
            {authMode === "register" && (
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
            )}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
            <button onClick={onAuth}>{authMode === "login" ? "Login" : "Register"}</button>
            <button className="secondary" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              {authMode === "login" ? "Switch to Register" : "Switch to Login"}
            </button>
          </div>
          {status && <p className="small">{status}</p>}
        </section>

        <section className="page-view">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage token={token} />} />
            <Route
              path="/projects"
              element={<ProjectsPage token={token} activeProject={activeProject} setActiveProject={setActiveProject} />}
            />
            <Route path="/workspace" element={<WorkspacePage token={token} activeProject={activeProject} />} />
            <Route path="/profile" element={<ProfilePage token={token} />} />
          </Routes>
        </section>
      </section>
    </main>
  );
};

export default App;
