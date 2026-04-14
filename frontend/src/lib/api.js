const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const jsonHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

async function parseResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let detail = fallbackMessage;
  try {
    const body = await response.json();
    detail = body.detail || fallbackMessage;
  } catch {
    detail = fallbackMessage;
  }
  throw new Error(detail);
}

export async function register(payload) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Registration failed");
}

export async function login(email, password) {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form
  });

  return parseResponse(response, "Login failed");
}

export async function getMe(token) {
  const response = await fetch(`${API_BASE}/users/me`, { headers: jsonHeaders(token) });
  return parseResponse(response, "Failed to load profile");
}

export async function updateMe(token, payload) {
  const response = await fetch(`${API_BASE}/users/me`, {
    method: "PUT",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Failed to update profile");
}

export async function syncMe(token) {
  const response = await fetch(`${API_BASE}/users/me/sync`, {
    method: "POST",
    headers: jsonHeaders(token)
  });
  return parseResponse(response, "Supabase sync failed");
}

export async function getDashboard(token) {
  const response = await fetch(`${API_BASE}/dashboard/summary`, { headers: jsonHeaders(token) });
  return parseResponse(response, "Failed to load dashboard");
}

export async function listProjects(token) {
  const response = await fetch(`${API_BASE}/projects/list`, { headers: jsonHeaders(token) });
  return parseResponse(response, "Failed to load projects");
}

export async function createProject(token, payload) {
  const response = await fetch(`${API_BASE}/projects/create`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Failed to create project");
}

export async function getProjectHistory(token, projectId) {
  const response = await fetch(`${API_BASE}/projects/${projectId}/history`, { headers: jsonHeaders(token) });
  return parseResponse(response, "Failed to load project history");
}

export async function generateUml(token, payload) {
  const response = await fetch(`${API_BASE}/uml/generate`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "UML generation failed");
}

export async function getUmlHistory(token, projectId) {
  const response = await fetch(`${API_BASE}/uml/list?project_id=${projectId}`, { headers: jsonHeaders(token) });
  return parseResponse(response, "Failed to load UML history");
}

export async function analyzeCode(token, payload) {
  const response = await fetch(`${API_BASE}/code/analyze`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Code analysis failed");
}

export async function analyzeRepo(token, payload) {
  const response = await fetch(`${API_BASE}/repo/analyze`, {
    method: "POST",
    headers: jsonHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseResponse(response, "Repository analysis failed");
}
