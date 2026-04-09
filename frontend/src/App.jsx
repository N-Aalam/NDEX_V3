import { useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { getMe, login, register } from "./lib/api.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";

const tokenKey = "ndex_token";

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
      setStatus("Authenticated");
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <main>
      <header className="card app-header">
        <div>
          <h1>NDEX — Multi-Page Analysis Workspace</h1>
          <p className="small">Dashboard, profile enhancements, project history, Supabase sync, and richer analysis.</p>
        </div>
        <div className="nav-row">
          <NavLink to="/dashboard" className="nav-link">
            Dashboard
          </NavLink>
          <NavLink to="/projects" className="nav-link">
            Projects
          </NavLink>
          <NavLink to="/workspace" className="nav-link">
            Workspace
          </NavLink>
          <NavLink to="/profile" className="nav-link">
            Profile
          </NavLink>
        </div>
      </header>

      <section className="card grid two">
        <div className="grid auth-card">
          <div className="section-title">
            <h2>{authMode === "login" ? "Sign In" : "Create account"}</h2>
            <span className="badge">{authMode}</span>
          </div>
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
          <div className="grid two">
            <button onClick={onAuth}>{authMode === "login" ? "Login" : "Register"}</button>
            <button className="secondary" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>
              Switch to {authMode === "login" ? "Register" : "Login"}
            </button>
          </div>
          {status && <p className="small">{status}</p>}
        </div>
        <div className="auth-summary">
          {profile ? (
            <>
              <p className="small">Logged in as:</p>
              <strong>{profile.full_name || profile.email}</strong>
              <p className="small">{profile.email}</p>
              <button className="secondary" onClick={() => setToken("")}>
                Logout
              </button>
            </>
          ) : (
            <p className="small">Authenticate to unlock dashboard, history, and analysis pages.</p>
          )}
        </div>
      </section>

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
    </main>
  );
};

export default App;
