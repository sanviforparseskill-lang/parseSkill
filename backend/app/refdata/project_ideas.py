"""Curated project-idea bank (Section 5.5 Step 4).

Static, hand-curated seed data — not derived from ml_pipeline — matched
against a user's skill gap by `app/api/v1/recommendations.py`. Each idea
names the skills it exercises by *skill name* (matched case-insensitively
against `skills.name`) so matching doesn't depend on skill ids being stable
across environments.

This is a starter set (not the full curated 200+ envisioned in Section 5.5)
covering the skills most roles in the ESCO/LinkedIn role set actually
require; extend it by appending entries in the same shape as adoption grows
past what the recommendation engine can source from generic templates.
"""

from __future__ import annotations

PROJECT_IDEAS: list[dict] = [
    # --- Python ---
    {"title": "CLI log analyzer", "description": "Parse gigabyte-scale log files with generators and regex, surface top error patterns and rate-per-minute charts in the terminal.", "skills_exercised": ["Python"], "complexity": "beginner", "estimated_hours": 12, "why_this_project": "Exercises core Python (generators, regex, argparse) without needing a framework."},
    {"title": "Async web scraper with rate limiting", "description": "Build a scraper using asyncio + httpx that respects robots.txt and per-domain rate limits, storing results in SQLite.", "skills_exercised": ["Python"], "complexity": "intermediate", "estimated_hours": 20, "why_this_project": "Forces real asyncio concurrency patterns, not toy examples."},
    {"title": "Type-checked plugin system", "description": "Design a plugin architecture using Protocol classes and entry_points, with mypy strict mode passing.", "skills_exercised": ["Python"], "complexity": "advanced", "estimated_hours": 25, "why_this_project": "Structural typing and dynamic loading are underused Python skills recruiters notice."},

    # --- JavaScript / TypeScript ---
    {"title": "Debounced search-as-you-type widget", "description": "Vanilla JS/TS component with debouncing, request cancellation (AbortController), and keyboard navigation.", "skills_exercised": ["JavaScript", "TypeScript"], "complexity": "beginner", "estimated_hours": 10, "why_this_project": "Covers the DOM/event-handling fundamentals frameworks usually hide."},
    {"title": "Type-safe state machine library", "description": "Small TypeScript library implementing a finite state machine with compile-time-checked transitions using discriminated unions.", "skills_exercised": ["TypeScript"], "complexity": "advanced", "estimated_hours": 18, "why_this_project": "Demonstrates advanced generic/type-narrowing skill, not just 'uses TS'."},

    # --- React ---
    {"title": "Kanban board with drag-and-drop", "description": "React app with optimistic updates, undo/redo via a command stack, and persisted state.", "skills_exercised": ["React"], "complexity": "intermediate", "estimated_hours": 22, "why_this_project": "Optimistic UI + undo/redo forces real state-management design, not just CRUD forms."},
    {"title": "Component library with visual regression tests", "description": "Build 10-15 accessible components, document with Storybook, and add visual regression tests.", "skills_exercised": ["React"], "complexity": "advanced", "estimated_hours": 30, "why_this_project": "Shows design-system thinking and accessibility, both under-demonstrated by typical React portfolios."},

    # --- Node.js / backend APIs ---
    {"title": "Rate-limited public API with API keys", "description": "Express/Fastify API with per-key rate limiting (token bucket), request signing, and OpenAPI docs.", "skills_exercised": ["Node.js"], "complexity": "intermediate", "estimated_hours": 18, "why_this_project": "API-provider concerns (auth, rate limiting, docs) are what separates 'built a CRUD API' from production experience."},
    {"title": "Webhook delivery system with retries", "description": "Service that delivers webhooks with exponential backoff, dead-letter queue, and delivery logs.", "skills_exercised": ["Node.js"], "complexity": "advanced", "estimated_hours": 25, "why_this_project": "Reliable delivery/retry logic is a common real-world backend requirement rarely covered in tutorials."},

    # --- SQL / PostgreSQL ---
    {"title": "Query performance playground", "description": "Load a large public dataset, write slow queries, then use EXPLAIN ANALYZE and indexes to speed them up 10x+; document each fix.", "skills_exercised": ["SQL", "PostgreSQL"], "complexity": "intermediate", "estimated_hours": 15, "why_this_project": "Query optimization is a rare, high-signal skill most portfolios never demonstrate."},
    {"title": "Multi-tenant schema with row-level security", "description": "Design a Postgres schema for multi-tenant SaaS using RLS policies instead of a tenant_id filter in every query.", "skills_exercised": ["PostgreSQL"], "complexity": "advanced", "estimated_hours": 20, "why_this_project": "RLS is a production-grade Postgres feature that signals real database design depth."},

    # --- Docker / Kubernetes ---
    {"title": "Multi-stage Dockerized microservice", "description": "Containerize an app with a multi-stage build under 100MB, health checks, and non-root user.", "skills_exercised": ["Docker"], "complexity": "beginner", "estimated_hours": 8, "why_this_project": "Image size/security hygiene is what interviewers actually probe on, not just 'has a Dockerfile'."},
    {"title": "Local Kubernetes cluster with autoscaling demo", "description": "Deploy a small app to kind/minikube with HPA, readiness/liveness probes, and a load test that triggers scale-out.", "skills_exercised": ["Kubernetes", "Docker"], "complexity": "advanced", "estimated_hours": 25, "why_this_project": "Watching HPA actually scale under load is far more convincing than a static manifest."},

    # --- Cloud / AWS ---
    {"title": "Serverless image-processing pipeline", "description": "S3 upload triggers a Lambda that resizes/watermarks images and writes to a CDN-backed bucket, all via IaC (Terraform/CDK).", "skills_exercised": ["AWS"], "complexity": "intermediate", "estimated_hours": 20, "why_this_project": "Event-driven serverless plus infrastructure-as-code covers two in-demand skills in one project."},
    {"title": "Cost-aware auto-scaling batch processor", "description": "SQS-triggered Fargate tasks with spot-instance fallback and a Grafana dashboard tracking cost per job.", "skills_exercised": ["AWS"], "complexity": "advanced", "estimated_hours": 30, "why_this_project": "Cost-consciousness alongside scaling is what separates senior cloud engineers from tutorial-followers."},

    # --- Machine Learning ---
    {"title": "End-to-end tabular ML pipeline with drift monitoring", "description": "Train a model, serve it via FastAPI, and add a feature-drift monitor that alerts when input distribution shifts.", "skills_exercised": ["Machine Learning", "Python"], "complexity": "advanced", "estimated_hours": 28, "why_this_project": "MLOps concerns (drift, monitoring) are what's missing from 90% of 'trained a model' portfolio projects."},
    {"title": "From-scratch gradient boosting on a Kaggle dataset", "description": "Implement a simplified gradient boosting classifier from scratch, benchmark against XGBoost on the same dataset.", "skills_exercised": ["Machine Learning"], "complexity": "intermediate", "estimated_hours": 18, "why_this_project": "Implementing the algorithm (not just calling .fit()) proves conceptual understanding."},

    # --- Data Engineering ---
    {"title": "Idempotent ETL pipeline with schema evolution", "description": "Build a pipeline that ingests changing-schema CSVs into a warehouse table, handling new/removed columns without breaking.", "skills_exercised": ["Data Engineering", "SQL"], "complexity": "advanced", "estimated_hours": 24, "why_this_project": "Schema evolution and idempotency are the two things that separate toy ETL scripts from production pipelines."},

    # --- Go ---
    {"title": "Concurrent job scheduler", "description": "Build a job scheduler in Go using goroutines/channels with worker pools, backpressure, and graceful shutdown.", "skills_exercised": ["Go"], "complexity": "intermediate", "estimated_hours": 18, "why_this_project": "Go's concurrency primitives are its whole value proposition — this project can't be faked with a tutorial CRUD app."},

    # --- Rust ---
    {"title": "Zero-copy CSV parser", "description": "Write a CSV parser in Rust that avoids allocations on the hot path, benchmarked against a naive implementation.", "skills_exercised": ["Rust"], "complexity": "advanced", "estimated_hours": 22, "why_this_project": "Ownership/borrowing discipline under a performance constraint is exactly what Rust roles screen for."},

    # --- Java / Spring ---
    {"title": "Event-sourced order system", "description": "Spring Boot service using event sourcing + CQRS for an order workflow, with a replayable event log.", "skills_exercised": ["Java", "Spring"], "complexity": "advanced", "estimated_hours": 28, "why_this_project": "Event sourcing/CQRS is an architecture pattern that signals beyond-CRUD Java experience."},

    # --- Django / FastAPI ---
    {"title": "Background job queue with progress streaming", "description": "Django/FastAPI app that enqueues long-running jobs and streams progress to the browser via SSE/websockets.", "skills_exercised": ["Django", "FastAPI", "Python"], "complexity": "intermediate", "estimated_hours": 18, "why_this_project": "Real-time progress feedback is a common product requirement rarely covered in framework tutorials."},

    # --- GraphQL ---
    {"title": "GraphQL API with DataLoader batching", "description": "Build a GraphQL API and fix the N+1 query problem using DataLoader; benchmark before/after.", "skills_exercised": ["GraphQL"], "complexity": "intermediate", "estimated_hours": 16, "why_this_project": "N+1 is the single most common GraphQL production bug — fixing it demonstrates real understanding."},

    # --- Redis / Kafka ---
    {"title": "Rate limiter and leaderboard service", "description": "Redis-backed sliding-window rate limiter plus a real-time leaderboard using sorted sets.", "skills_exercised": ["Redis"], "complexity": "intermediate", "estimated_hours": 14, "why_this_project": "Sorted sets and sliding-window counters are Redis features most tutorials skip in favor of simple caching."},
    {"title": "Exactly-once event processor", "description": "Kafka consumer that achieves exactly-once processing semantics using idempotency keys and transactional writes.", "skills_exercised": ["Kafka"], "complexity": "advanced", "estimated_hours": 26, "why_this_project": "Exactly-once semantics is the hardest, most interview-relevant Kafka topic."},

    # --- CI/CD / Testing ---
    {"title": "Self-hosted CI pipeline with caching", "description": "Set up a CI pipeline (GitHub Actions or self-hosted) with dependency caching, matrix builds, and flaky-test quarantine.", "skills_exercised": ["CI/CD"], "complexity": "intermediate", "estimated_hours": 12, "why_this_project": "Build speed and flaky-test handling are practical CI concerns most personal projects never hit."},
    {"title": "Mutation-tested test suite", "description": "Add mutation testing (e.g. mutmut/Stryker) to an existing project and raise the mutation score, not just line coverage.", "skills_exercised": ["Testing"], "complexity": "advanced", "estimated_hours": 15, "why_this_project": "Mutation score is a much stronger signal of test quality than coverage percentage."},

    # --- System design / distributed systems ---
    {"title": "Toy distributed key-value store with Raft", "description": "Implement leader election and log replication (a simplified Raft) for a 3-node in-memory KV store.", "skills_exercised": ["Distributed Systems"], "complexity": "advanced", "estimated_hours": 35, "why_this_project": "Consensus algorithms are the single highest-signal distributed-systems project for interviews."},

    # --- Security ---
    {"title": "OAuth2 authorization server from scratch", "description": "Implement the authorization code + PKCE flow without a library, then write tests for the common attack vectors (CSRF, token replay).", "skills_exercised": ["Security"], "complexity": "advanced", "estimated_hours": 24, "why_this_project": "Building the protocol (not just consuming a library) forces real understanding of the security properties involved."},

    # --- Mobile ---
    {"title": "Offline-first note app with conflict resolution", "description": "React Native/Flutter app that syncs to a backend and resolves edit conflicts with a CRDT or last-write-wins strategy.", "skills_exercised": ["React Native", "Flutter"], "complexity": "advanced", "estimated_hours": 28, "why_this_project": "Offline sync/conflict resolution is the hard part of mobile apps that tutorials always skip."},

    # --- DevOps / observability ---
    {"title": "SLO dashboard with alerting", "description": "Instrument a service with Prometheus metrics, define SLOs (latency/error budget), and wire alerts for burn-rate.", "skills_exercised": ["DevOps"], "complexity": "intermediate", "estimated_hours": 16, "why_this_project": "SLO/error-budget thinking is what distinguishes SRE-adjacent DevOps experience from 'wrote a Dockerfile'."},

    # --- HTML/CSS/accessibility ---
    {"title": "Fully keyboard-navigable data table", "description": "Build a sortable/filterable data table that's 100% operable via keyboard and passes an axe-core accessibility audit.", "skills_exercised": ["HTML", "CSS", "Accessibility"], "complexity": "intermediate", "estimated_hours": 14, "why_this_project": "Accessibility is rarely demonstrated in portfolios despite being a frequent interview/requirement topic."},
]
