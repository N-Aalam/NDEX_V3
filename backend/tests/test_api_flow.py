
def auth_headers(client):
    email = "demo@example.com"
    password = "demo-pass-123"

    register_response = client.post(
        "/auth/register",
        json={"email": email, "password": password, "full_name": "Demo User"},
    )
    assert register_response.status_code in {200, 400}

    login_response = client.post(
        "/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_auth_profile_project_and_dashboard(client):
    headers = auth_headers(client)

    me_response = client.get("/users/me", headers=headers)
    assert me_response.status_code == 200

    update_response = client.put(
        "/users/me",
        headers=headers,
        json={"full_name": "Updated User", "preferred_theme": "dark"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["preferred_theme"] == "dark"

    create_project_response = client.post(
        "/projects/create",
        headers=headers,
        json={"name": "My Project"},
    )
    assert create_project_response.status_code == 200
    project_id = create_project_response.json()["id"]

    list_response = client.get("/projects/list", headers=headers)
    assert list_response.status_code == 200
    assert any(project["id"] == project_id for project in list_response.json())

    dashboard_response = client.get("/dashboard/summary", headers=headers)
    assert dashboard_response.status_code == 200
    assert dashboard_response.json()["total_projects"] >= 1


def test_uml_and_code_flow(client):
    headers = auth_headers(client)
    project_id = client.post("/projects/create", headers=headers, json={"name": "UML Project"}).json()["id"]

    uml_response = client.post(
        "/uml/generate",
        headers=headers,
        json={
            "project_id": project_id,
            "input_text": "User has many Projects",
            "diagram_type": "class",
        },
    )
    assert uml_response.status_code == 200

    code_response = client.post(
        "/code/analyze",
        headers=headers,
        json={
            "project_id": project_id,
            "language": "python",
            "code": "def add(a,b):\n    return a+b\nadd(1,2)",
        },
    )
    assert code_response.status_code == 200
    assert "steps" in code_response.json()["execution_graph"]


def test_repo_analyze_with_mocked_github(client, monkeypatch):
    headers = auth_headers(client)
    project_id = client.post("/projects/create", headers=headers, json={"name": "Repo Project"}).json()["id"]

    monkeypatch.setattr(
        "app.api.routes.repo.fetch_repo_tree",
        lambda _url: {
            "repo": "octocat/Hello-World",
            "branch": "main",
            "entries": [{"path": "README.md", "type": "blob"}],
            "commits": [{"sha": "1", "message": "init"}],
            "contributors": [{"login": "octocat", "contributions": 1}],
            "metadata": {"full_name": "octocat/Hello-World"},
        },
    )
    monkeypatch.setattr(
        "app.api.routes.repo.build_repo_intelligence",
        lambda _data: {
            "repository_health": "Good",
            "collaboration_patterns": "Low",
            "d3": {"commit_frequency": [], "contributor_influence": []},
        },
    )

    repo_response = client.post(
        "/repo/analyze",
        headers=headers,
        json={
            "project_id": project_id,
            "repo_url": "https://github.com/octocat/Hello-World",
        },
    )
    assert repo_response.status_code == 200
    assert repo_response.json()["dependency_graph"]["entries"][0]["path"] == "README.md"
