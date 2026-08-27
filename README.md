# parseSkill — Live Deployment Guide

This repository is the deployment-ready version of the parseSkill app. It keeps the actual product code and removes the extra research/data artifacts that were only used during exploration and model setup.

## What was kept

- Backend API: FastAPI app with worker queue processing
- Frontend app: React + TanStack Start UI
- Prisma schema and database layer
- Auth, profile sync, portfolio, recommendations, and chat flows
- Example environment files for local setup

## What was removed

The following were removed because they were not part of the live product build:

- data dumps and CSV datasets
- ESCO research files
- job-posting and job-skill CSV folders
- ML pipeline experiment scripts
- generated cache directories and editor temp files
- old study/spec output files

This keeps the repository focused on the real application rather than on raw research assets.

## Project structure

```text
parseSkill/
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ core/
│  │  ├─ db/
│  │  ├─ extractor/
│  │  ├─ inference/
│  │  ├─ intelligence/
│  │  ├─ jobs/
│  │  ├─ ml/
│  │  ├─ rag/
│  │  ├─ refdata/
│  │  ├─ schemas/
│  │  └─ services/
│  ├─ prisma/
│  ├─ .env.example
│  ├─ requirements.txt
│  ├─ Procfile
│  └─ README.md
├─ frontend/
│  ├─ src/
│  ├─ .env.example
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ ...
├─ .gitignore
├─ README.md
└─ .env.example (if added later for root deployment)
```

## Stack

- Frontend: React, Vite, TanStack Router, TanStack Start
- Backend: FastAPI, Uvicorn
- Worker: Python background job processor
- Database: PostgreSQL + Prisma
- Auth: GitHub OAuth + Neon Auth
- AI: LLM-backed assistant and profile inference

## Local development

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python -m app.worker
```

Run the API in another terminal:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend should point to the backend API, usually:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Environment variables

### Backend

Use values from the backend `.env` file. Required items include:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `FRONTEND_URL`
- `NEON_AUTH_ISSUER_URL`
- `LLM_PROVIDER`
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`

### Frontend

Use values from the frontend `.env` file, including:

- `VITE_API_URL`
- `VITE_NEON_AUTH_URL`

## Deployment checklist

### Production database

- Use PostgreSQL (for example Neon)
- Keep the pooled URL for backend web and worker traffic
- Keep the direct URL for Prisma migrations if needed

### Backend deployment

- Deploy the FastAPI app to a server or hosting platform
- Start both the API and worker processes
- Set production env vars securely
- Keep the same `DATABASE_URL` and auth config used by the app

### Frontend deployment

- Deploy the frontend to a static/SSR host
- Set `VITE_API_URL` to the live backend URL
- Allow backend CORS origin from the deployed frontend URL

### Auth setup

- Configure GitHub OAuth callback URL
- Configure Neon Auth issuer URL if using the alternate sign-in flow
- Ensure the redirect URL matches the deployed app exactly

## Live app launch summary

This project is now organized as a minimal but production-ready app:

- app code stays in backend and frontend
- unnecessary exploration data was removed
- environment files remain for runtime configuration
- backend and frontend can run independently
- deployment steps are documented for a live environment

## Useful verification commands

```bash
cd frontend && npm run build
cd backend && python -m compileall app
```

If these pass, the app is in a good state for deployment preparation.

## Notes

This is not a one-click deployment script; it is a cleaned and launch-ready codebase that is prepared for hosting using a standard backend + frontend + database setup.
