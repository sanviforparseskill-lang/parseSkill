# parseSkill

parseSkill is a developer-intelligence platform that builds a profile from evidence such as GitHub repositories, coding activity, resumes, and connected developer platforms.

The application is split into three runtime services:

- **Frontend:** React, Vite, TanStack Router, and TanStack Start
- **Backend API:** FastAPI serving REST and Server-Sent Events
- **Worker:** long-running Python process that consumes jobs from PostgreSQL
- **Database:** PostgreSQL, recommended through Neon

## Repository Layout

```text
parseSkill/
|-- backend/       FastAPI API, worker, Prisma schema, integrations
|-- frontend/      React/TanStack Start application
`-- README.md
```

## Local Development

### Backend

From PowerShell:

```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set the backend values in `backend/.env`, then generate the Prisma client:

```powershell
python -m prisma generate --schema prisma/schema.prisma
```

Run the worker in one terminal:

```powershell
python -m app.worker
```

Run the API in a second terminal:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

In a separate terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The local frontend API URL is:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Environment Variables

### Backend

The backend reads variables from `backend/.env` through `backend/app/core/config.py`.

Required for a working production deployment:

```env
ENVIRONMENT=production
DATABASE_URL=your-neon-pooled-connection-string
DIRECT_URL=your-neon-direct-connection-string
JWT_SECRET=long-random-secret
JWT_ALGORITHM=HS256
SESSION_COOKIE_NAME=ps_session
ACCESS_TOKEN_TTL_MINUTES=60
REFRESH_TOKEN_TTL_DAYS=30
FRONTEND_URL=https://your-frontend-domain
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_OAUTH_REDIRECT_URI=https://your-api-domain/api/v1/auth/callback/github
GITHUB_OAUTH_SCOPES=read:user user:email public_repo
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-flash-latest
NEON_AUTH_ISSUER_URL=your-neon-auth-issuer-url
STORAGE_DIR=./storage
```

Optional backend variables:

```env
LEETCODE_SESSION_TOKEN=
KAGGLE_USERNAME=
KAGGLE_KEY=
SENTRY_DSN=
POSTHOG_API_KEY=
```

`DATABASE_URL` should use Neon's pooled host. `DIRECT_URL` should use the direct host and is required for Prisma operations and PostgreSQL notifications.

The current backend uses Gemini. Use `GEMINI_API_KEY`; the older Anthropic/OpenAI names in some example documentation are not used by `app/core/config.py`.

### Frontend

The frontend reads Vite variables at build time:

```env
VITE_API_URL=https://your-api-domain/api/v1
VITE_NEON_AUTH_URL=your-neon-auth-issuer-url
```

Never put backend secrets or OAuth client secrets in the frontend. Any `VITE_*` value is visible in the browser.

## Production Deployment

The recommended deployment is **Vercel + Render + Neon**.

### 1. Create the Neon database

1. Create a PostgreSQL project in Neon.
2. Enable the extensions required by `backend/prisma/schema.prisma`: `pgcrypto`, `pg_trgm`, `vector`, and `btree_gin`.
3. Copy the pooled connection string into `DATABASE_URL`.
4. Copy the direct connection string into `DIRECT_URL`.

If this is a new database and no Prisma migrations exist yet, initialize the schema from the backend directory:

```bash
python -m prisma generate --schema prisma/schema.prisma
python -m prisma db push --schema prisma/schema.prisma
```

### 2. Deploy the API to Render

Create a Render **Web Service** connected to this repository.

Use these settings:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt && python -m prisma generate --schema prisma/schema.prisma
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /healthz
```

Add all required backend environment variables from the section above. Set `FRONTEND_URL` to the final Vercel URL, with no trailing slash.

After deployment, this endpoint must return `{"status":"ok"}`:

```text
https://your-api-domain.onrender.com/healthz
```

### 3. Deploy the worker to Render

Create a second Render service using the same repository, but select **Background Worker**.

Use these settings:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt && python -m prisma generate --schema prisma/schema.prisma
Start Command: python -m app.worker
```

Copy the same backend environment variables into the worker. The worker must stay running because it processes profile-sync and assistant jobs. Avoid a sleeping/free worker for production.

### 4. Deploy the frontend to Vercel

Create a Vercel project connected to this repository.

Use these settings:

```text
Root Directory: frontend
Build Command: npm run build
Install Command: npm install
```

Add these Vercel environment variables:

```env
VITE_API_URL=https://your-api-domain.onrender.com/api/v1
VITE_NEON_AUTH_URL=your-neon-auth-issuer-url
```

Redeploy Vercel whenever a `VITE_*` value changes because these values are embedded during the frontend build.

### 5. Configure GitHub OAuth

In GitHub Developer Settings, set the OAuth application callback URL to the backend endpoint:

```text
https://your-api-domain.onrender.com/api/v1/auth/callback/github
```

Set the identical value in Render:

```env
GITHUB_OAUTH_REDIRECT_URI=https://your-api-domain.onrender.com/api/v1/auth/callback/github
```

The callback URL must match exactly.

### 6. Configure Neon Auth

Use the issuer URL from the Neon project Auth settings in both places:

```env
# Render API and worker
NEON_AUTH_ISSUER_URL=your-neon-auth-issuer-url

# Vercel frontend
VITE_NEON_AUTH_URL=your-neon-auth-issuer-url
```

If Neon Auth is not being used, leave both values empty and use GitHub OAuth.

## Important Cookie and Domain Setup

The backend authenticates with HTTP-only cookies. For the most reliable production setup, use custom subdomains under the same domain:

```text
app.example.com  -> Vercel
api.example.com  -> Render
```

Then use:

```env
FRONTEND_URL=https://app.example.com
VITE_API_URL=https://api.example.com/api/v1
GITHUB_OAUTH_REDIRECT_URI=https://api.example.com/api/v1/auth/callback/github
```

Using unrelated default domains such as `vercel.app` and `onrender.com` can cause browsers to reject or omit cross-site authentication cookies.

## Verification

Run these checks before deployment:

```bash
cd frontend && npm run build
cd ../backend && python -m compileall app
```

After deployment:

1. Open the Render `/healthz` endpoint.
2. Open the Vercel frontend.
3. Sign in with GitHub.
4. Confirm the redirect reaches onboarding or dashboard.
5. Trigger profile synchronization.
6. Check Render worker logs for job processing.
7. Test chat, SSE progress, sign-out, and a browser refresh.

## Security Notes

- Never commit `backend/.env` or real API keys.
- Use a new strong `JWT_SECRET` in production.
- Rotate any credential that has ever been committed to a public repository.
- Do not expose backend secrets through `VITE_*` variables.
- Render's local filesystem is ephemeral. Use a persistent disk or object storage if uploaded resumes must survive redeployments.
