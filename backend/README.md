# parseSkill Study Guide

parseSkill is a developer-intelligence platform that builds a profile from evidence, not self-reported skills. It reads public code repositories, competitive-programming activity, resumes, and other connected sources, then turns that evidence into:

- a unified developer profile
- inferred skills and technology stacks
- project quality and contribution scores
- a skill evolution timeline
- role recommendations
- a grounded AI career assistant
- an exportable portfolio experience

This document is written as a study guide. Start with the simple explanation, then move into the technical architecture, AI flow, data model, tradeoffs, and the questions an interviewer is likely to ask.

## 1. One-Sentence Summary

The system answers one question: what can this developer actually prove they have done?

Instead of letting users manually check boxes for skills, parseSkill infers skills from source code, repository structure, commit history, problem-solving history, and curated reference data.

## 2. Simple Explanation

Think of the product like a smart resume that does not trust declarations alone.

1. The user signs in with GitHub.
2. The backend fetches evidence from GitHub, LeetCode, Codeforces, Kaggle, and an optional resume upload.
3. The worker analyzes repos and turns raw artifacts into structured facts.
4. Those facts are stored in PostgreSQL as normal tables plus graph-like edge tables.
5. The UI shows skills, scores, projects, recommendations, a timeline, and a chat assistant that can answer questions about the profile.

The important idea is that every visible claim should trace back to an artifact.

## 3. What Runs in the Project

The current runtime is intentionally small.

- Frontend: React 19 with TanStack Start, TanStack Router, TanStack Query, and Vite.
- Backend web process: FastAPI serving REST and Server-Sent Events.
- Backend worker process: a long-lived Python worker that polls PostgreSQL for jobs and runs scheduled tasks.
- Database: PostgreSQL 16 with Prisma as the Python client.

There is no Redis, no Celery, and no separate graph database. PostgreSQL does the job of relational store, queue, cache, vector store, and graph traversal engine.

## 4. High-Level Architecture

The project is split into three main layers.

### Frontend

The frontend is the user-facing product. It renders the dashboard, profile views, portfolio, graph explorer, timeline, recommendations, roadmap, chat, and sign-in flows.

Important route surfaces in the current app include:

- landing page
- auth sign-in
- onboarding
- dashboard
- projects
- graph explorer
- timeline
- recommendations
- roadmap
- portfolio
- chat
- public profile pages by username

### Backend web process

The FastAPI app handles HTTP requests and SSE streams only. It does not perform the expensive work itself. Its responsibilities are:

- authenticate users
- validate requests
- enqueue jobs
- expose read APIs
- stream sync or chat updates to the browser

### Worker process

The worker is where the expensive work happens. It:

- polls the PostgreSQL job queue
- claims jobs with `FOR UPDATE SKIP LOCKED`
- runs sync jobs
- runs assistant reply jobs
- runs nightly graph maintenance jobs
- executes lightweight scheduled cleanup tasks

### Why this split exists

This is one of the most important architecture choices in the project.

- The web process stays responsive because it never blocks on repo analysis or LLM calls.
- The worker can crash independently without losing queued jobs.
- SSE can stream progress while the worker is still running.
- The system stays simple enough to reason about because all orchestration is inside one database and two Python processes.

## 5. Repository Layout

The backend is organized by responsibility.

- `app/main.py`: FastAPI entry point.
- `app/worker.py`: worker entry point.
- `app/api/v1/`: versioned API routers.
- `app/core/`: settings and security.
- `app/db/`: database client, queue, pub/sub, and raw queries.
- `app/extractor/`: integrations with GitHub, LeetCode, Codeforces, Kaggle, and resume parsing.
- `app/inference/`: technology detection, skill mapping, and confidence scoring.
- `app/intelligence/`: project and profile scoring.
- `app/ml/`: role recommendation training and inference.
- `app/rag/`: embeddings, retrieval, prompt building, guardrails, and LLM calls.
- `app/jobs/`: background job handlers.
- `app/refdata/`: reference data loading and promotion into app tables.
- `app/schemas/`: request and response schemas.
- `app/services/`: auth, cache, rate limiting, and verification helpers.
- `prisma/schema.prisma`: schema for the relational data model and graph tables.

## 6. User Journey

This is the easiest way to understand the product end to end.

### Step 1: Sign in

The user signs in with GitHub. GitHub is the anchor identity because it is the strongest source of evidence for professional coding activity.

### Step 2: Connect other sources

The user can optionally link other platforms such as LeetCode, Codeforces, and Kaggle. These links are verified rather than blindly trusted.

### Step 3: Trigger sync

The user clicks Update Profile. That action enqueues a `sync_profile` job instead of doing the work in the request thread.

### Step 4: Background analysis

The worker pulls repositories, extracts manifests and README content, detects technologies, computes evidence strength, recalculates scores, refreshes the RAG index, and stores all results.

### Step 5: UI refresh

The browser listens over SSE, receives progress updates, and updates the dashboard when the sync finishes.

### Step 6: Use the assistant

The chat assistant retrieves grounded context from the profile and project index, then streams a response token by token.

## 7. Data Sources and What They Contribute

The platform is only as good as the evidence it can collect.

### GitHub

GitHub is the primary source. The system uses repo metadata, README files, language breakdowns, commit history, manifest files, workflow files, stars, forks, and contributor signals.

What this tells the system:

- what technologies the user likely used
- how deep the user worked in each repo
- whether a project is template-derived or original
- whether the repo looks like a real application or a stub
- how recent the activity is

### LeetCode

LeetCode contributes solved problem counts, topic tags, contest activity, and rating-like signals.

### Codeforces

Codeforces contributes rating, contest count, solved tags, and public activity history.

### Kaggle

Kaggle contributes competition activity, notebooks, datasets, and kernel languages.

### Resume upload

The optional resume upload is parsed locally and used as extra evidence. It is useful for education, work history, and projects that are not visible in public code.

## 8. Backend Request Flow

### A. Triggering a profile sync

This is the most important flow in the system.

1. The frontend sends a sync request.
2. FastAPI inserts a `sync_profile` row into `job_queue`.
3. FastAPI publishes a Postgres notification so the UI can subscribe to progress.
4. The worker claims the job with `FOR UPDATE SKIP LOCKED`.
5. The worker fetches and analyzes source data.
6. The worker writes projects, technologies, skills, and timeline facts in PostgreSQL.
7. The worker recomputes profile scores.
8. The worker rebuilds the assistant retrieval index.
9. The worker logs the sync result and notifies the browser that it is done.

### B. Answering a chat question

1. The frontend sends a chat question.
2. FastAPI enqueues an `assistant_reply` job.
3. The worker retrieves grounded chunks from the profile and project index.
4. The prompt builder prepares the final LLM prompt.
5. Tokens are streamed back over SSE.
6. The final answer and citations are stored.
7. Numeric hallucination checks may log suspicious claims for review.

### C. Nightly maintenance

The worker also handles recurring maintenance jobs such as graph maintenance and cache cleanup.

## 9. Backend Architecture in Technical Terms

### `app/main.py`

The FastAPI app initializes the database connection, pub/sub connections, CORS, and API routes. It is intentionally thin. Its job is to expose HTTP and SSE, not to perform analysis.

Why this is good:

- request latency stays low
- the web tier is easier to scale independently
- the analysis logic is kept out of the API lifecycle

### `app/worker.py`

The worker owns the asynchronous poll loop and the scheduler.

It runs three kinds of background work:

- queue processing for user-triggered jobs
- stale lock cleanup
- scheduled jobs like nightly PageRank and cache purging

Why not Celery or Redis:

- no extra infrastructure
- fewer moving parts
- the queue is transactionally consistent with the main data store
- crash recovery is simpler because pending jobs remain in Postgres

### `app/db/queue.py`

The queue uses a transactional claim pattern.

The key behavior is:

- select the next pending row
- lock it with `FOR UPDATE SKIP LOCKED`
- mark it as running
- either complete it or retry it later

This avoids double-processing without introducing a separate broker.

### `app/db/pubsub.py`

Postgres `LISTEN / NOTIFY` is used for low-latency progress updates.

Why this over WebSockets or a third-party pub/sub system:

- the communication is one-way most of the time
- SSE is enough for progress and streamed tokens
- Postgres already exists in the architecture
- the project avoids a second real-time service

### `app/api/v1/`

The API is organized by resource area:

- auth
- sync
- profile
- skills
- projects
- timeline
- recommendations
- roadmap
- chat
- portfolio
- graph
- public

This mirrors the product surface and makes the API easier to reason about during interviews.

## 10. AI Architecture

The AI in this project is not one monolithic model. It is a pipeline.

### Layer 1: extraction

The extractors pull raw evidence from GitHub and the other sources. This layer is about collecting facts, not making judgments.

### Layer 2: technology detection

The technology detector looks for manifests, deployment files, framework markers, and structural clues.

It identifies things like:

- package manifests
- backend frameworks
- frontend frameworks
- CI/CD markers
- deployment markers
- testing signals
- scaffolding or template patterns

### Layer 3: skill mapping

Technologies are mapped to skills through curated reference data.

This is the bridge between raw artifacts and user-facing skill labels. For example, a repo might reveal React, TypeScript, and Docker, but the system needs to map those technologies into broader skills or domains that people understand.

### Layer 4: confidence scoring

The confidence engine turns evidence into a normalized score. It uses multiple dimensions, including breadth, depth, recency, and diversity.

The important design principle is that a skill score is not just a guess. It is a composite of evidence signals.

### Layer 5: project intelligence

Project scoring evaluates things like:

- contribution weight
- architectural patterns
- test presence
- CI/CD presence
- deployment config presence
- documentation quality
- complexity

This makes the project page more than a list of repos. It becomes a structured assessment of engineering effort.

### Layer 6: role prediction

The role predictor recommends likely career roles from the skill graph.

The system uses a cosine-similarity baseline by default and only switches to a trained model when the trained model is clearly better.

### Layer 7: RAG assistant

The assistant does not invent user facts. It retrieves evidence chunks, builds a prompt, and then streams an answer that stays grounded in profile data.

### Layer 8: hallucination checks

Responses are checked for suspicious numeric claims. If the model says something like a number, percentage, or score that the system cannot justify, the event can be logged for review.

## 11. AI Flow: From Code to Skill to Answer

This is the most interview-relevant flow in the project.

### A. Repo analysis flow

1. Fetch repo metadata and file content.
2. Detect manifests and technology markers.
3. Estimate originality, template use, and contribution weight.
4. Compute project complexity and documentation quality.
5. Map technologies to skills.
6. Aggregate per-skill evidence.
7. Persist skills with confidence and evidence breakdowns.

### B. Timeline flow

1. Read commit dates.
2. Bucket them into quarters.
3. Attribute technology usage over time.
4. Persist a technology activity fact table.

This powers the skill evolution timeline and helps show growth over time rather than just a static snapshot.

### C. Assistant flow

1. Take the user question.
2. Embed the question.
3. Retrieve relevant chunks using hybrid search.
4. Build a prompt containing profile context and citations.
5. Stream the answer.
6. Persist the assistant reply and the evidence trail.

## 12. Why the AI Is Built This Way

This section is the tradeoff story interviewers usually want.

### Why not just use an LLM to infer everything?

Because that would be ungrounded.

The project needs deterministic evidence, reproducible scores, and traceable outputs. The LLM is used as a presenter and helper, not as the source of truth.

### Why use a hybrid system instead of one model?

Because different tasks need different tools.

- classification needs structured features
- retrieval needs text similarity plus vectors
- score calculation needs deterministic formulas
- explanation needs natural language

Trying to force one model to do all of that would make the system harder to debug and less trustworthy.

### Why keep a cosine baseline even if there is an XGBoost model?

Because the baseline is always available and easy to reason about.

The trained model only replaces it when it materially outperforms the baseline. That avoids overfitting the product to a model that may not stay reliable.

### Why use curated mapping data at all?

Because raw technologies are too specific for user-facing insights.

A developer does not want to see just a long list of file types. They want meaningful skill groupings and role suggestions.

## 13. Database Architecture

PostgreSQL is doing a lot of work here.

### Relational data

Standard tables store users, sessions, projects, chat, sync logs, rate limits, and portfolio data.

### Graph data

Graph-like relationships are stored in explicit edge tables such as skill relationships, project-to-technology links, and skill-to-role mappings.

The graph is queried with recursive CTEs instead of a separate graph database.

Why Postgres instead of Neo4j:

- one database instead of two
- easier deployment
- strong transactional guarantees
- enough graph capability for the current scale

### Vector search

PostgreSQL with `pgvector` stores embeddings for RAG retrieval.

Why this instead of a standalone vector database:

- the dataset is small enough that Postgres is sufficient
- embeddings stay co-located with the source chunks
- simpler backups and migrations

### Full-text search

Postgres text search is used for BM25-style retrieval and exact-ish lexical matches.

### Queue and cache

The queue and cache are tables in the same database.

That means:

- no duplicate state in Redis
- no separate eviction service
- easier operational debugging

## 14. Frontend Architecture

The frontend is a modern React application with TanStack Start and TanStack Router.

The important idea is that the UI is not a static dashboard. It is a live, data-driven workspace that listens for sync progress and chat updates.

### UI responsibilities

- show profile and account status
- display computed skill and project scores
- visualize graph relationships
- show learning and role recommendations
- host the chat assistant
- support public profile pages

### Why TanStack Start and TanStack Router

The frontend uses route-based composition and strong query-state management.

Why this over a framework like Next.js in this codebase:

- the current app is already organized around TanStack Router routes
- it fits the existing Vite-based stack
- React Query integrates cleanly with the data layer
- the routing model is explicit and local

### Why SSE on the frontend

The app mostly needs one-way server updates:

- sync status
- chat token streaming
- completion events

SSE is simpler than a full bidirectional socket layer for this use case.

## 15. Why the Project Uses This Stack

This project deliberately avoids a bloated architecture.

### FastAPI

Used because it is async, Python-native, and gives automatic OpenAPI docs.

Why not a separate Node backend:

- the AI and data-processing stack is already Python-heavy
- one language reduces glue code
- the backend can call ML and RAG code directly

### Prisma Python client

Used to keep typed database access and schema-driven migrations.

Why not a fully hand-written SQL layer:

- Prisma gives structure and maintainability for most CRUD paths
- raw SQL is still used where the query builder is not expressive enough

### PostgreSQL

Used as the single source of truth for data, graph edges, queueing, search, and embeddings.

Why not split into multiple stores:

- fewer infrastructure pieces
- fewer synchronization bugs
- simpler local setup
- easier interview explanation

### APScheduler

Used because the project needs only a small amount of recurring maintenance.

Why not an external scheduler:

- less operational overhead
- the worker already exists
- the maintenance tasks are not large enough to justify another service

### Server-Sent Events

Used for progress and token streaming.

Why not WebSockets:

- most communication is one-way
- SSE is easier to reason about and debug
- fits HTTP infrastructure better

### Hybrid retrieval

Used because lexical search and vector search catch different kinds of relevance.

Why not only embeddings:

- embeddings can miss exact entity matches
- full-text search is better for names, technologies, and rare terms

### XGBoost plus cosine fallback

Used because the system wants a stronger model when available, but a transparent baseline when it is not.

## 16. Key Background Jobs

### `sync_profile`

The main ingestion job. It pulls GitHub repos, detects technologies, computes score breakdowns, updates skills, writes timelines, and rebuilds retrieval data.

### `assistant_reply`

The chat job. It retrieves grounded context, streams LLM output, stores citations, and logs suspicious numeric claims.

### `nightly_pagerank`

The graph maintenance job. It recomputes PageRank over the skill co-occurrence graph to support ranking and recommendation features.

## 17. Important Tradeoffs

These are the decisions you should be ready to explain in an interview.

### Single database over microservices

Chosen for simplicity, consistency, and easier debugging.

Tradeoff: scaling is less independent than a fully distributed system.

### Manual sync over automatic sync

Chosen to respect API limits and keep the system predictable.

Tradeoff: data is not continuously fresh unless the user refreshes it.

### Evidence first over user-entered skills

Chosen to reduce noise and recruiter skepticism.

Tradeoff: the system may miss some soft skills or off-platform work.

### Deterministic scoring plus ML

Chosen so scores are explainable.

Tradeoff: there is more engineering work than simply calling an LLM.

### SSE instead of WebSockets

Chosen because the project mostly streams one-way updates.

Tradeoff: if future features need rich bidirectional collaboration, sockets may become more attractive.

### Postgres graph over a graph database

Chosen because the graph is important but not large enough to justify a separate database.

Tradeoff: complex graph queries are still more verbose than in a dedicated graph engine.

### Baseline model plus optional trained model

Chosen to avoid making the system dependent on a model that may not always be available.

Tradeoff: the best model path needs training data and validation discipline.

## 18. Things an Interviewer May Ask

You should be able to explain each of these clearly.

- Why does the project use PostgreSQL for the queue and graph instead of Redis and Neo4j?
- Why is GitHub the primary identity source?
- What happens when the user clicks Update Profile?
- How does the system know a skill is real?
- How are skills mapped from technologies?
- Why is the AI assistant considered grounded?
- What is the difference between the cosine baseline and the trained role model?
- Why is SSE sufficient for this app?
- What happens if the worker crashes mid-job?
- How does the project prevent hallucinated claims in chat?

## 19. Quick Study Notes by File

- `app/main.py`: web process startup and API wiring.
- `app/worker.py`: queue polling, retry logic, and scheduled jobs.
- `app/db/queue.py`: atomic job claiming and retries.
- `app/jobs/sync_profile.py`: repo analysis, scoring, timeline writes, and RAG refresh.
- `app/jobs/assistant_reply.py`: grounded chat response generation.
- `app/jobs/nightly_pagerank.py`: periodic graph ranking.
- `app/rag/retriever.py`: hybrid retrieval across text and vectors.
- `app/ml/role_predictor.py`: role recommendation inference.
- `app/api/v1/router.py`: API composition.
- `frontend/src/routes/`: user-facing pages and flows.

## 20. Interview Questions and Answers

### 1. What problem does parseSkill solve?

It replaces self-reported skill profiles with evidence-backed developer intelligence. The goal is to show what a developer can actually prove from their work history.

### 2. Why not let users manually add skills like on a normal profile site?

Because self-reported skills create noise. The project is designed around evidence from code, commits, and public activity so the profile is more trustworthy.

### 3. What happens when a user syncs their profile?

The frontend enqueues a background job, the worker pulls GitHub data, detects technologies, computes confidence and project scores, writes graph relationships, refreshes retrieval chunks, and notifies the browser over SSE.

### 4. Why is PostgreSQL the central platform choice?

Because it can handle relational data, graph edges, full-text search, vector search, queueing, and pub/sub in one system. That keeps the stack small and the architecture easier to operate.

### 5. How does the system turn raw technologies into skills?

It detects technologies from manifests and repo structure, then maps those technologies into skill rows through curated reference data. Evidence from multiple repos is then aggregated into a confidence score.

### 6. What makes the assistant grounded?

It does not answer from memory alone. It retrieves relevant chunks from the profile and project store, builds a prompt with that evidence, and stores citations with the final reply.

### 7. Why is the role predictor designed with a fallback baseline?

Because a baseline is always available and easy to validate. The trained model only takes over when it clearly outperforms the baseline on held-out data.

### 8. What is the hardest engineering tradeoff in the system?

The hardest tradeoff is explainability versus automation. The project deliberately chooses explainable, evidence-backed behavior even when a simpler AI-first approach would be faster to build.

## 21. What To Memorize Before an Interview

If you only remember a few things, remember these.

1. parseSkill is an evidence-based developer-intelligence platform.
2. FastAPI serves HTTP/SSE, and the worker does the expensive work.
3. PostgreSQL is used for the relational data, graph edges, queue, cache, search, and vectors.
4. Skills are inferred from repo evidence and mapped through curated reference data.
5. The assistant is a retrieval-based system, not a free-form hallucination engine.
6. The architecture favors simplicity, traceability, and explainability over over-engineered infrastructure.

## 22. Running the Backend Locally

The backend expects a Python environment, PostgreSQL, and the required environment variables.

Typical flow:

1. Create and activate a virtual environment.
2. Install dependencies from `requirements.txt`.
3. Configure the database connection.
4. Generate Prisma client artifacts.
5. Apply the schema to PostgreSQL.
6. Start the web process with `uvicorn app.main:app --reload`.
7. Start the worker with `python -m app.worker`.

## 23. Final Mental Model

The easiest way to remember the whole project is this:

- the frontend is the presentation layer
- the FastAPI web app is the orchestration layer
- the worker is the analysis layer
- PostgreSQL is the system of record and coordination layer
- the AI stack is a grounded evidence pipeline, not a single black-box model

If you can explain those five layers clearly, you can explain the project in an interview.
