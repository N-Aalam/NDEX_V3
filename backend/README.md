# NDEX API (Phase 1 + Phase 2 UML)
# NDEX API (Phase 1)

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

Copy `.env.example` to `.env` and update values as needed.

```bash
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload
```

## VS Code

Open the repository root in VS Code and use the launch configuration:

- Run and Debug → **NDEX API (FastAPI)**
- This uses `backend/.venv` and sets `PYTHONPATH` to `backend`.

## Postman

Import the collection and environment from `backend/postman`:

- `NDEX Phase 1.postman_collection.json`
- `NDEX Phase 1.postman_environment.json`

Set the `baseUrl` and run the requests in order:

1. **Register**
2. **Login** (captures `access_token` to the environment)
3. **Create Project** (captures `project_id`)
4. **UML Generate**
5. **List Projects**
6. **Delete Project**

## LLM API

Set `LLM_API_URL` to an OpenAI-compatible chat completions endpoint, for example:

```
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-key
LLM_MODEL=gpt-4o-mini
```

If `LLM_API_URL` is empty, the UML generator uses a simple fallback parser.
3. **Create Project**
4. **List Projects**
5. **Delete Project**

## Auth

- Register: `POST /auth/register`
- Login: `POST /auth/login`

## Projects

- Create: `POST /projects/create`
- List: `GET /projects/list`
- Delete: `DELETE /projects/{project_id}`

## UML

- Generate: `POST /uml/generate`
