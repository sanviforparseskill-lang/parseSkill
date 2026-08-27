"""Curated technology -> skill -> role ontology seed (Section 15.1's
"curated ~400-technology/~80-skill layer", never authored — see
promote_to_app.py and ml_pipeline/README.md gap #1).

This is a practical starting set, not the full spec'd scope: it covers the
technologies commonly detected by `technology_detector.py` (npm/pypi/etc.
package names) plus common devops/database/mobile/ML tooling, mapped to a
compact skill vocabulary and a handful of common engineering roles.

Idempotent — upserts by natural key, safe to re-run as the curated set grows.

    python -m app.refdata.seed_curated_ontology
"""

from __future__ import annotations

import asyncio

from app.db.client import connect_db, disconnect_db, db

# ---------------------------------------------------------------------------
# Skills: name -> category (matches frontend Category buckets loosely;
# category-colors.ts normalizes free text, so plain lowercase words are fine)
# ---------------------------------------------------------------------------

SKILLS: dict[str, str] = {
    # Language/Core
    "JavaScript": "language", "TypeScript": "language", "Python": "language",
    "Java": "language", "Go": "language", "Rust": "language", "C++": "language",
    "C#": "language", "PHP": "language", "Ruby": "language", "HTML": "language",
    "CSS": "language", "SQL": "language", "Kotlin": "language", "Swift": "language",
    "Dart": "language", "Scala": "language", "Elixir": "language", "Shell Scripting": "language",
    # Frontend
    "React": "frontend", "Frontend Build Tooling": "frontend",
    "CSS Frameworks": "frontend", "Form Handling & Validation": "frontend",
    "Client-Side Routing": "frontend", "State Management & Data Fetching": "frontend",
    "UI Component Libraries": "frontend", "Animation & Motion Design": "frontend",
    "Data Visualization": "frontend", "Progressive Web App Development": "frontend",
    "Linting & Code Quality": "frontend", "Mobile App Development (Hybrid)": "frontend",
    "Vue.js": "frontend", "Angular": "frontend", "Svelte": "frontend",
    "State Management (Redux/Flux)": "frontend", "CSS-in-JS": "frontend",
    "Static Site Generation": "frontend", "Web Components": "frontend",
    # Backend
    "Node.js Backend Development": "backend", "REST API Design": "backend",
    "Django": "backend", "Flask": "backend", "FastAPI": "backend",
    "Express.js": "backend", "Spring Boot": "backend", "Ruby on Rails": "backend",
    "Laravel": "backend", "GraphQL": "backend", "Authentication & Authorization": "backend",
    "Microservices Architecture": "backend", "Message Queues & Event Streaming": "backend",
    "WebSockets & Real-Time Communication": "backend", "API Gateway Design": "backend",
    "Serverless Functions": "backend", "Caching Strategies": "backend",
    "NestJS": "backend", ".NET / ASP.NET": "backend", "gRPC": "backend",
    # Database
    "Relational Databases": "database", "PostgreSQL": "database", "MySQL": "database",
    "MongoDB": "database", "Redis": "database", "ORM/Query Building": "database",
    "Database Schema Design": "database", "Search & Indexing (Elasticsearch)": "database",
    "SQLite": "database", "Data Warehousing": "database", "Vector Databases": "database",
    # DevOps
    "Docker & Containerization": "devops", "Kubernetes": "devops",
    "CI/CD Pipelines": "devops", "Cloud Infrastructure (AWS/GCP/Azure)": "devops",
    "Infrastructure as Code": "devops", "Monitoring & Observability": "devops",
    "Serverless Deployment": "devops", "Reverse Proxy & Web Servers (Nginx)": "devops",
    "Site Reliability Engineering": "devops", "Configuration Management": "devops",
    # ML/AI
    "Machine Learning": "ml", "Deep Learning": "ml", "Data Analysis": "ml",
    "Numerical Computing": "ml", "LLM Application Development": "ml",
    "Computer Vision": "ml", "Natural Language Processing": "ml",
    "MLOps": "ml", "Data Pipelines / ETL": "ml", "Statistical Modeling": "ml",
    # Mobile
    "iOS Development": "frontend", "Android Development": "frontend",
    "React Native": "frontend", "Flutter": "frontend",
    # Testing / QA
    "Automated Testing": "backend", "End-to-End Testing": "frontend",
    "Unit Testing": "backend", "API Testing": "backend",
    # Security / other
    "Application Security": "devops", "Blockchain Development": "backend",
    "Game Development": "frontend", "Embedded Systems": "backend",
}

# ---------------------------------------------------------------------------
# Technology (package/tool name as detected) -> [(skill name, weight), ...]
# ---------------------------------------------------------------------------

TECH_TO_SKILLS: dict[str, list[tuple[str, float]]] = {
    # React ecosystem
    "react": [("React", 1.0), ("JavaScript", 0.6)],
    "react-dom": [("React", 1.0)],
    "@vitejs/plugin-react-swc": [("React", 0.6), ("Frontend Build Tooling", 1.0)],
    "vite": [("Frontend Build Tooling", 1.0)],
    "react-router-dom": [("Client-Side Routing", 1.0), ("React", 0.4)],
    "@tanstack/react-query": [("State Management & Data Fetching", 1.0), ("React", 0.4)],
    "react-hook-form": [("Form Handling & Validation", 1.0), ("React", 0.4)],
    "@hookform/resolvers": [("Form Handling & Validation", 0.8)],
    "zod": [("Form Handling & Validation", 0.7), ("TypeScript", 0.3)],
    "framer-motion": [("Animation & Motion Design", 1.0)],
    "recharts": [("Data Visualization", 1.0), ("React", 0.3)],
    "react-day-picker": [("UI Component Libraries", 0.6)],
    "react-resizable-panels": [("UI Component Libraries", 0.6)],
    "embla-carousel-react": [("UI Component Libraries", 0.6)],
    "input-otp": [("UI Component Libraries", 0.5)],
    "vaul": [("UI Component Libraries", 0.5)],
    "cmdk": [("UI Component Libraries", 0.5)],
    "sonner": [("UI Component Libraries", 0.5)],
    "next-themes": [("UI Component Libraries", 0.4)],
    "lucide-react": [("UI Component Libraries", 0.3)],
    "class-variance-authority": [("UI Component Libraries", 0.4)],
    "clsx": [("UI Component Libraries", 0.3)],
    "tailwind-merge": [("CSS Frameworks", 0.4)],
    "tailwindcss": [("CSS Frameworks", 1.0)],
    "tailwindcss-animate": [("CSS Frameworks", 0.4), ("Animation & Motion Design", 0.3)],
    "@tailwindcss/typography": [("CSS Frameworks", 0.4)],
    "autoprefixer": [("CSS Frameworks", 0.3)],
    "postcss": [("CSS Frameworks", 0.4)],
    "typescript": [("TypeScript", 1.0)],
    "typescript-eslint": [("TypeScript", 0.4), ("Linting & Code Quality", 0.6)],
    "eslint": [("Linting & Code Quality", 1.0)],
    "eslint-plugin-react-hooks": [("Linting & Code Quality", 0.5), ("React", 0.3)],
    "eslint-plugin-react-refresh": [("Linting & Code Quality", 0.5)],
    "@eslint/js": [("Linting & Code Quality", 0.5)],
    "globals": [("Linting & Code Quality", 0.2)],
    "date-fns": [("JavaScript", 0.3)],
    "idb": [("Progressive Web App Development", 0.6)],
    "@capacitor/app": [("Mobile App Development (Hybrid)", 1.0)],
    "@maptiler/sdk": [("Data Visualization", 0.4)],
    "@types/react": [("TypeScript", 0.3), ("React", 0.2)],
    "@types/react-dom": [("TypeScript", 0.3)],
    "@types/node": [("TypeScript", 0.2)],
    "@types/node-fetch": [("TypeScript", 0.2)],
    # Radix UI primitives all roll up to one skill
    **{
        f"@radix-ui/react-{part}": [("UI Component Libraries", 0.5), ("React", 0.2)]
        for part in [
            "accordion", "alert-dialog", "aspect-ratio", "avatar", "checkbox",
            "collapsible", "context-menu", "dialog", "dropdown-menu", "hover-card",
            "label", "menubar", "navigation-menu", "popover", "progress",
            "radio-group", "scroll-area", "select", "separator", "slider",
            "slot", "switch", "tabs", "toast", "toggle", "toggle-group", "tooltip",
        ]
    },
    # Other frontend frameworks
    "vue": [("Vue.js", 1.0), ("JavaScript", 0.4)],
    "@angular/core": [("Angular", 1.0), ("TypeScript", 0.4)],
    "svelte": [("Svelte", 1.0)],
    "next": [("React", 0.8), ("Node.js Backend Development", 0.4)],
    # Backend
    "express": [("Express.js", 1.0), ("Node.js Backend Development", 0.6)],
    "fastify": [("Node.js Backend Development", 1.0)],
    "django": [("Django", 1.0), ("Python", 0.5)],
    "flask": [("Flask", 1.0), ("Python", 0.5)],
    "fastapi": [("FastAPI", 1.0), ("Python", 0.5), ("REST API Design", 0.5)],
    "spring-boot": [("Spring Boot", 1.0), ("Java", 0.5)],
    "rails": [("Ruby on Rails", 1.0), ("Ruby", 0.5)],
    "laravel/framework": [("Laravel", 1.0), ("PHP", 0.5)],
    "graphql": [("GraphQL", 1.0)],
    "apollo-server": [("GraphQL", 0.8)],
    "jsonwebtoken": [("Authentication & Authorization", 0.8)],
    "passport": [("Authentication & Authorization", 0.8)],
    # Databases / ORMs
    "pg": [("PostgreSQL", 0.8), ("Relational Databases", 0.5)],
    "psycopg2": [("PostgreSQL", 0.8), ("Relational Databases", 0.5)],
    "sqlalchemy": [("ORM/Query Building", 1.0), ("Relational Databases", 0.4)],
    "prisma": [("ORM/Query Building", 1.0), ("Database Schema Design", 0.5)],
    "@prisma/client": [("ORM/Query Building", 1.0)],
    "mongoose": [("MongoDB", 0.8), ("ORM/Query Building", 0.4)],
    "mongodb": [("MongoDB", 1.0)],
    "mysql": [("MySQL", 1.0), ("Relational Databases", 0.5)],
    "mysql2": [("MySQL", 1.0), ("Relational Databases", 0.5)],
    "redis": [("Redis", 1.0)],
    "ioredis": [("Redis", 1.0)],
    # DevOps
    "Docker": [("Docker & Containerization", 1.0)],
    "Docker Compose": [("Docker & Containerization", 0.8)],
    "Kubernetes": [("Kubernetes", 1.0), ("Docker & Containerization", 0.4)],
    "GitHub Actions": [("CI/CD Pipelines", 1.0)],
    "terraform": [("Infrastructure as Code", 1.0), ("Cloud Infrastructure (AWS/GCP/Azure)", 0.5)],
    "boto3": [("Cloud Infrastructure (AWS/GCP/Azure)", 0.8), ("Python", 0.3)],
    "@aws-sdk/client-s3": [("Cloud Infrastructure (AWS/GCP/Azure)", 0.8)],
    "prometheus-client": [("Monitoring & Observability", 0.8)],
    # ML / Data
    "numpy": [("Numerical Computing", 1.0), ("Python", 0.4)],
    "pandas": [("Data Analysis", 1.0), ("Python", 0.4)],
    "scikit-learn": [("Machine Learning", 1.0), ("Python", 0.3)],
    "torch": [("Deep Learning", 1.0), ("Python", 0.3)],
    "tensorflow": [("Deep Learning", 1.0), ("Python", 0.3)],
    "transformers": [("Deep Learning", 0.8), ("LLM Application Development", 0.6)],
    "langchain": [("LLM Application Development", 1.0), ("Python", 0.3)],
    "openai": [("LLM Application Development", 0.8)],
    # Testing
    "jest": [("Automated Testing", 1.0), ("Unit Testing", 0.7)],
    "pytest": [("Automated Testing", 1.0), ("Python", 0.3), ("Unit Testing", 0.7)],
    "cypress": [("End-to-End Testing", 1.0)],
    "playwright": [("End-to-End Testing", 1.0)],
    "@playwright/test": [("End-to-End Testing", 1.0)],
    "vitest": [("Automated Testing", 1.0), ("Unit Testing", 0.7)],
    "mocha": [("Unit Testing", 1.0)],
    "chai": [("Unit Testing", 0.7)],
    "junit": [("Unit Testing", 1.0), ("Java", 0.3)],
    "supertest": [("API Testing", 1.0)],
    "testing-library": [("Unit Testing", 0.7), ("React", 0.3)],
    "@testing-library/react": [("Unit Testing", 0.7), ("React", 0.4)],
    "rspec": [("Unit Testing", 1.0), ("Ruby", 0.3)],
    "phpunit": [("Unit Testing", 1.0), ("PHP", 0.3)],

    # State management / data
    "redux": [("State Management (Redux/Flux)", 1.0), ("React", 0.3)],
    "@reduxjs/toolkit": [("State Management (Redux/Flux)", 1.0), ("React", 0.3)],
    "zustand": [("State Management (Redux/Flux)", 0.8), ("React", 0.3)],
    "mobx": [("State Management (Redux/Flux)", 0.8)],
    "recoil": [("State Management (Redux/Flux)", 0.7), ("React", 0.3)],
    "pinia": [("State Management (Redux/Flux)", 0.8), ("Vue.js", 0.4)],
    "vuex": [("State Management (Redux/Flux)", 0.8), ("Vue.js", 0.4)],
    "swr": [("State Management & Data Fetching", 0.8), ("React", 0.3)],
    "styled-components": [("CSS-in-JS", 1.0), ("React", 0.3)],
    "@emotion/react": [("CSS-in-JS", 1.0), ("React", 0.3)],
    "@emotion/styled": [("CSS-in-JS", 0.9)],

    # Build tools / meta-frameworks
    "webpack": [("Frontend Build Tooling", 1.0)],
    "rollup": [("Frontend Build Tooling", 1.0)],
    "esbuild": [("Frontend Build Tooling", 1.0)],
    "parcel": [("Frontend Build Tooling", 0.8)],
    "turbo": [("Frontend Build Tooling", 0.6)],
    "gulp": [("Frontend Build Tooling", 0.6)],
    "nuxt": [("Vue.js", 0.7), ("Static Site Generation", 0.5)],
    "gatsby": [("React", 0.6), ("Static Site Generation", 1.0)],
    "astro": [("Static Site Generation", 1.0)],
    "remix": [("React", 0.7), ("Node.js Backend Development", 0.4)],
    "lit": [("Web Components", 1.0)],
    "@stencil/core": [("Web Components", 1.0)],

    # Backend frameworks / servers
    "koa": [("Node.js Backend Development", 1.0)],
    "@nestjs/core": [("NestJS", 1.0), ("Node.js Backend Development", 0.5), ("TypeScript", 0.3)],
    "hapi": [("Node.js Backend Development", 0.8)],
    "gin-gonic/gin": [("Go", 0.5), ("REST API Design", 0.8)],
    "gorilla/mux": [("Go", 0.5), ("REST API Design", 0.6)],
    "echo": [("Go", 0.5), ("REST API Design", 0.6)],
    "actix-web": [("Rust", 0.5), ("REST API Design", 0.8)],
    "rocket": [("Rust", 0.5), ("REST API Design", 0.7)],
    "asp.net": [(".NET / ASP.NET", 1.0), ("C#", 0.5)],
    "phoenix": [("Elixir", 0.5), ("REST API Design", 0.7)],
    "symfony/framework-bundle": [("PHP", 0.5), ("REST API Design", 0.6)],

    # gRPC / messaging / real-time
    "grpc": [("gRPC", 1.0)],
    "@grpc/grpc-js": [("gRPC", 1.0)],
    "kafka-python": [("Message Queues & Event Streaming", 1.0), ("Python", 0.3)],
    "kafkajs": [("Message Queues & Event Streaming", 1.0)],
    "amqplib": [("Message Queues & Event Streaming", 0.8)],
    "pika": [("Message Queues & Event Streaming", 0.8), ("Python", 0.3)],
    "celery": [("Message Queues & Event Streaming", 0.8), ("Python", 0.4)],
    "bullmq": [("Message Queues & Event Streaming", 0.8)],
    "socket.io": [("WebSockets & Real-Time Communication", 1.0)],
    "ws": [("WebSockets & Real-Time Communication", 0.8)],

    # Databases / ORMs (broader)
    "typeorm": [("ORM/Query Building", 1.0), ("TypeScript", 0.3)],
    "sequelize": [("ORM/Query Building", 1.0)],
    "drizzle-orm": [("ORM/Query Building", 1.0), ("TypeScript", 0.3)],
    "knex": [("ORM/Query Building", 0.8)],
    "hibernate": [("ORM/Query Building", 1.0), ("Java", 0.4)],
    "sqlite3": [("SQLite", 1.0)],
    "better-sqlite3": [("SQLite", 1.0)],
    "elasticsearch": [("Search & Indexing (Elasticsearch)", 1.0)],
    "@elastic/elasticsearch": [("Search & Indexing (Elasticsearch)", 1.0)],
    "algoliasearch": [("Search & Indexing (Elasticsearch)", 0.6)],
    "pinecone-client": [("Vector Databases", 1.0), ("LLM Application Development", 0.4)],
    "chromadb": [("Vector Databases", 1.0)],
    "weaviate-client": [("Vector Databases", 1.0)],
    "snowflake-connector-python": [("Data Warehousing", 1.0), ("Python", 0.3)],

    # Cloud / infra (broader)
    "nginx": [("Reverse Proxy & Web Servers (Nginx)", 1.0)],
    "ansible": [("Configuration Management", 1.0), ("Infrastructure as Code", 0.5)],
    "pulumi": [("Infrastructure as Code", 1.0)],
    "google-cloud-storage": [("Cloud Infrastructure (AWS/GCP/Azure)", 0.8), ("Python", 0.2)],
    "azure-storage-blob": [("Cloud Infrastructure (AWS/GCP/Azure)", 0.8)],
    "aws-cdk-lib": [("Infrastructure as Code", 0.9), ("Cloud Infrastructure (AWS/GCP/Azure)", 0.6)],
    "serverless": [("Serverless Deployment", 1.0), ("Serverless Functions", 0.6)],
    "vercel": [("Serverless Deployment", 0.6)],
    "sentry-sdk": [("Monitoring & Observability", 0.8)],
    "@sentry/node": [("Monitoring & Observability", 0.8)],
    "datadog": [("Monitoring & Observability", 0.8)],
    "grafana": [("Monitoring & Observability", 0.8)],

    # Mobile
    "react-native": [("React Native", 1.0), ("React", 0.4)],
    "expo": [("React Native", 0.8)],
    "flutter": [("Flutter", 1.0), ("Dart", 0.6)],
    "swiftui": [("iOS Development", 1.0), ("Swift", 0.6)],
    "androidx.core:core": [("Android Development", 1.0), ("Kotlin", 0.3)],
    "kotlinx-coroutines-core": [("Android Development", 0.5), ("Kotlin", 0.5)],
    "@ionic/angular": [("Mobile App Development (Hybrid)", 1.0), ("Angular", 0.3)],
    "@ionic/react": [("Mobile App Development (Hybrid)", 1.0), ("React", 0.3)],
    "@capacitor/core": [("Mobile App Development (Hybrid)", 1.0)],
    "@capacitor/ios": [("Mobile App Development (Hybrid)", 0.6), ("iOS Development", 0.3)],
    "@capacitor/android": [("Mobile App Development (Hybrid)", 0.6), ("Android Development", 0.3)],

    # ML / Data (broader)
    "opencv-python": [("Computer Vision", 1.0), ("Python", 0.3)],
    "pillow": [("Computer Vision", 0.5), ("Python", 0.3)],
    "spacy": [("Natural Language Processing", 1.0), ("Python", 0.3)],
    "nltk": [("Natural Language Processing", 1.0), ("Python", 0.3)],
    "huggingface-hub": [("Deep Learning", 0.6), ("LLM Application Development", 0.6)],
    "sentence-transformers": [("Natural Language Processing", 0.7), ("LLM Application Development", 0.6)],
    "llama-index": [("LLM Application Development", 1.0), ("Python", 0.3)],
    "anthropic": [("LLM Application Development", 0.9)],
    "@anthropic-ai/sdk": [("LLM Application Development", 0.9)],
    "@google/genai": [("LLM Application Development", 0.9)],
    "mlflow": [("MLOps", 1.0), ("Python", 0.3)],
    "airflow": [("Data Pipelines / ETL", 1.0), ("Python", 0.3)],
    "apache-airflow": [("Data Pipelines / ETL", 1.0), ("Python", 0.3)],
    "dbt-core": [("Data Pipelines / ETL", 0.9), ("Data Warehousing", 0.4)],
    "statsmodels": [("Statistical Modeling", 1.0), ("Python", 0.3)],
    "xgboost": [("Machine Learning", 0.9), ("Python", 0.3)],
    "lightgbm": [("Machine Learning", 0.9), ("Python", 0.3)],
    "keras": [("Deep Learning", 0.9), ("Python", 0.3)],
    "jupyter": [("Data Analysis", 0.5), ("Python", 0.3)],
    "matplotlib": [("Data Visualization", 0.7), ("Python", 0.3)],
    "seaborn": [("Data Visualization", 0.7), ("Python", 0.3)],
    "plotly": [("Data Visualization", 0.8)],

    # Security / blockchain / embedded / games
    "helmet": [("Application Security", 0.8)],
    "bcrypt": [("Application Security", 0.6), ("Authentication & Authorization", 0.5)],
    "casbin": [("Application Security", 0.7), ("Authentication & Authorization", 0.5)],
    "web3": [("Blockchain Development", 1.0)],
    "ethers": [("Blockchain Development", 1.0)],
    "solidity": [("Blockchain Development", 1.0)],
    "hardhat": [("Blockchain Development", 0.8)],
    "unity": [("Game Development", 1.0), ("C#", 0.3)],
    "godot": [("Game Development", 1.0)],
    "phaser": [("Game Development", 1.0), ("JavaScript", 0.3)],
    "arduino": [("Embedded Systems", 1.0)],
    "platformio": [("Embedded Systems", 1.0)],
    "micropython": [("Embedded Systems", 0.8), ("Python", 0.3)],

    # Misc tooling
    "lovable-tagger": [("Frontend Build Tooling", 0.5)],
    "pdf2pic": [("JavaScript", 0.2)],
    "pdf-poppler": [("JavaScript", 0.2)],
}

# ---------------------------------------------------------------------------
# Roles: name -> description
# ---------------------------------------------------------------------------

ROLES: dict[str, str] = {
    "Frontend Developer": "Builds user-facing web interfaces with modern JS/TS frameworks.",
    "Backend Developer": "Builds server-side APIs, business logic, and data layers.",
    "Full-Stack Developer": "Works across both frontend and backend of a web application.",
    "DevOps Engineer": "Builds and operates CI/CD, containerization, and cloud infrastructure.",
    "Mobile Developer": "Builds native or hybrid mobile applications.",
    "Data Scientist / ML Engineer": "Builds data pipelines and machine learning models.",
    "QA / Test Engineer": "Designs and automates test coverage across the stack.",
}

# skill name -> [(role name, importance 0-1), ...]
SKILL_TO_ROLES: dict[str, list[tuple[str, float]]] = {
    "React": [("Frontend Developer", 1.0), ("Full-Stack Developer", 0.7)],
    "Vue.js": [("Frontend Developer", 1.0), ("Full-Stack Developer", 0.6)],
    "Angular": [("Frontend Developer", 1.0), ("Full-Stack Developer", 0.6)],
    "Svelte": [("Frontend Developer", 0.9)],
    "TypeScript": [("Frontend Developer", 0.9), ("Backend Developer", 0.6), ("Full-Stack Developer", 0.9)],
    "JavaScript": [("Frontend Developer", 0.9), ("Backend Developer", 0.5), ("Full-Stack Developer", 0.8)],
    "CSS Frameworks": [("Frontend Developer", 0.7)],
    "Frontend Build Tooling": [("Frontend Developer", 0.6), ("Full-Stack Developer", 0.4)],
    "State Management & Data Fetching": [("Frontend Developer", 0.8), ("Full-Stack Developer", 0.5)],
    "Form Handling & Validation": [("Frontend Developer", 0.6)],
    "Client-Side Routing": [("Frontend Developer", 0.6)],
    "UI Component Libraries": [("Frontend Developer", 0.5)],
    "Animation & Motion Design": [("Frontend Developer", 0.4)],
    "Data Visualization": [("Frontend Developer", 0.5), ("Data Scientist / ML Engineer", 0.4)],
    "Progressive Web App Development": [("Frontend Developer", 0.5), ("Mobile Developer", 0.5)],
    "Mobile App Development (Hybrid)": [("Mobile Developer", 1.0)],
    "Linting & Code Quality": [("Frontend Developer", 0.4), ("Backend Developer", 0.4), ("QA / Test Engineer", 0.4)],
    "Node.js Backend Development": [("Backend Developer", 1.0), ("Full-Stack Developer", 0.8)],
    "Express.js": [("Backend Developer", 0.9), ("Full-Stack Developer", 0.6)],
    "Django": [("Backend Developer", 1.0), ("Full-Stack Developer", 0.7)],
    "Flask": [("Backend Developer", 0.9)],
    "FastAPI": [("Backend Developer", 0.9)],
    "Spring Boot": [("Backend Developer", 1.0)],
    "Ruby on Rails": [("Backend Developer", 1.0), ("Full-Stack Developer", 0.7)],
    "Laravel": [("Backend Developer", 0.9)],
    "REST API Design": [("Backend Developer", 0.9), ("Full-Stack Developer", 0.7)],
    "GraphQL": [("Backend Developer", 0.7), ("Full-Stack Developer", 0.6)],
    "Authentication & Authorization": [("Backend Developer", 0.8), ("DevOps Engineer", 0.4)],
    "Python": [("Backend Developer", 0.7), ("Data Scientist / ML Engineer", 0.9)],
    "Java": [("Backend Developer", 0.7)],
    "Go": [("Backend Developer", 0.6), ("DevOps Engineer", 0.5)],
    "Rust": [("Backend Developer", 0.5)],
    "C++": [("Backend Developer", 0.4)],
    "C#": [("Backend Developer", 0.6)],
    "PHP": [("Backend Developer", 0.6)],
    "Ruby": [("Backend Developer", 0.6)],
    "HTML": [("Frontend Developer", 0.6)],
    "CSS": [("Frontend Developer", 0.6)],
    "SQL": [("Backend Developer", 0.6), ("Data Scientist / ML Engineer", 0.5)],
    "Relational Databases": [("Backend Developer", 0.7)],
    "PostgreSQL": [("Backend Developer", 0.7)],
    "MySQL": [("Backend Developer", 0.6)],
    "MongoDB": [("Backend Developer", 0.6)],
    "Redis": [("Backend Developer", 0.5), ("DevOps Engineer", 0.4)],
    "ORM/Query Building": [("Backend Developer", 0.6), ("Full-Stack Developer", 0.4)],
    "Database Schema Design": [("Backend Developer", 0.6)],
    "Docker & Containerization": [("DevOps Engineer", 1.0), ("Backend Developer", 0.4)],
    "Kubernetes": [("DevOps Engineer", 1.0)],
    "CI/CD Pipelines": [("DevOps Engineer", 1.0)],
    "Cloud Infrastructure (AWS/GCP/Azure)": [("DevOps Engineer", 1.0)],
    "Infrastructure as Code": [("DevOps Engineer", 0.9)],
    "Monitoring & Observability": [("DevOps Engineer", 0.8)],
    "Machine Learning": [("Data Scientist / ML Engineer", 1.0)],
    "Deep Learning": [("Data Scientist / ML Engineer", 1.0)],
    "Data Analysis": [("Data Scientist / ML Engineer", 0.9)],
    "Numerical Computing": [("Data Scientist / ML Engineer", 0.8)],
    "LLM Application Development": [("Data Scientist / ML Engineer", 0.7), ("Backend Developer", 0.4)],
    "Automated Testing": [("QA / Test Engineer", 1.0), ("Backend Developer", 0.4), ("Frontend Developer", 0.3)],
    "End-to-End Testing": [("QA / Test Engineer", 1.0), ("Frontend Developer", 0.3)],
    "Unit Testing": [("QA / Test Engineer", 0.9), ("Backend Developer", 0.3), ("Frontend Developer", 0.3)],
    "API Testing": [("QA / Test Engineer", 0.9), ("Backend Developer", 0.3)],
    "Microservices Architecture": [("Backend Developer", 0.8), ("DevOps Engineer", 0.4)],
    "Message Queues & Event Streaming": [("Backend Developer", 0.7), ("DevOps Engineer", 0.4)],
    "WebSockets & Real-Time Communication": [("Backend Developer", 0.6), ("Full-Stack Developer", 0.5)],
    "API Gateway Design": [("Backend Developer", 0.6), ("DevOps Engineer", 0.4)],
    "Serverless Functions": [("Backend Developer", 0.5), ("DevOps Engineer", 0.6)],
    "Caching Strategies": [("Backend Developer", 0.5)],
    "NestJS": [("Backend Developer", 0.8), ("Full-Stack Developer", 0.5)],
    ".NET / ASP.NET": [("Backend Developer", 0.8)],
    "gRPC": [("Backend Developer", 0.5), ("DevOps Engineer", 0.3)],
    "Search & Indexing (Elasticsearch)": [("Backend Developer", 0.5), ("Data Scientist / ML Engineer", 0.3)],
    "SQLite": [("Backend Developer", 0.3), ("Mobile Developer", 0.3)],
    "Data Warehousing": [("Data Scientist / ML Engineer", 0.7), ("Backend Developer", 0.3)],
    "Vector Databases": [("Data Scientist / ML Engineer", 0.6), ("Backend Developer", 0.3)],
    "Serverless Deployment": [("DevOps Engineer", 0.9)],
    "Reverse Proxy & Web Servers (Nginx)": [("DevOps Engineer", 0.8)],
    "Site Reliability Engineering": [("DevOps Engineer", 0.9)],
    "Configuration Management": [("DevOps Engineer", 0.7)],
    "State Management (Redux/Flux)": [("Frontend Developer", 0.7)],
    "CSS-in-JS": [("Frontend Developer", 0.5)],
    "Static Site Generation": [("Frontend Developer", 0.5)],
    "Web Components": [("Frontend Developer", 0.4)],
    "iOS Development": [("Mobile Developer", 1.0)],
    "Android Development": [("Mobile Developer", 1.0)],
    "React Native": [("Mobile Developer", 1.0), ("Frontend Developer", 0.4)],
    "Flutter": [("Mobile Developer", 1.0)],
    "Computer Vision": [("Data Scientist / ML Engineer", 0.9)],
    "Natural Language Processing": [("Data Scientist / ML Engineer", 0.9)],
    "MLOps": [("Data Scientist / ML Engineer", 0.8), ("DevOps Engineer", 0.4)],
    "Data Pipelines / ETL": [("Data Scientist / ML Engineer", 0.8), ("Backend Developer", 0.3)],
    "Statistical Modeling": [("Data Scientist / ML Engineer", 0.8)],
    "Application Security": [("DevOps Engineer", 0.5), ("Backend Developer", 0.5)],
    "Blockchain Development": [("Backend Developer", 0.4)],
    "Game Development": [("Frontend Developer", 0.2)],
    "Embedded Systems": [("Backend Developer", 0.3)],
    "Kotlin": [("Mobile Developer", 0.6), ("Backend Developer", 0.4)],
    "Swift": [("Mobile Developer", 0.7)],
    "Dart": [("Mobile Developer", 0.5)],
    "Scala": [("Backend Developer", 0.5), ("Data Scientist / ML Engineer", 0.3)],
    "Elixir": [("Backend Developer", 0.5)],
    "Shell Scripting": [("DevOps Engineer", 0.5)],
}


async def seed_skills() -> dict[str, str]:
    ids: dict[str, str] = {}
    for name, category in SKILLS.items():
        skill = await db.skill.upsert(
            where={"name": name},
            data={"create": {"name": name, "category": category}, "update": {"category": category}},
        )
        ids[name] = skill.id
    return ids


async def seed_roles() -> dict[str, str]:
    ids: dict[str, str] = {}
    for name, description in ROLES.items():
        role = await db.role.upsert(
            where={"name": name},
            data={"create": {"name": name, "description": description}, "update": {"description": description}},
        )
        ids[name] = role.id
    return ids


async def seed_technology_maps_to_skill(skill_ids: dict[str, str]) -> int:
    count = 0
    for tech_name, mappings in TECH_TO_SKILLS.items():
        # Derive the technology's category from its highest-weight mapped
        # skill so the timeline (which colors/groups cells by category) is
        # meaningful instead of every technology showing as "uncategorized" —
        # ensure_technology_row (sync-time) never sets one, this seed is the
        # authoritative source for it.
        top_skill_name = max(mappings, key=lambda m: m[1])[0]
        category = SKILLS.get(top_skill_name)
        tech = await db.technology.upsert(
            where={"name": tech_name},
            data={
                "create": {"name": tech_name, "category": category},
                "update": {"category": category},
            },
        )
        for skill_name, weight in mappings:
            skill_id = skill_ids.get(skill_name)
            if not skill_id:
                continue
            await db.technologymapstoskill.upsert(
                where={"technologyId_skillId": {"technologyId": tech.id, "skillId": skill_id}},
                data={"create": {"technologyId": tech.id, "skillId": skill_id, "weight": weight}, "update": {"weight": weight}},
            )
            count += 1
    return count


async def seed_skill_required_by_role(skill_ids: dict[str, str], role_ids: dict[str, str]) -> int:
    count = 0
    for skill_name, mappings in SKILL_TO_ROLES.items():
        skill_id = skill_ids.get(skill_name)
        if not skill_id:
            continue
        for role_name, importance in mappings:
            role_id = role_ids.get(role_name)
            if not role_id:
                continue
            await db.skillrequiredbyrole.upsert(
                where={"skillId_roleId": {"skillId": skill_id, "roleId": role_id}},
                data={"create": {"skillId": skill_id, "roleId": role_id, "importance": importance}, "update": {"importance": importance}},
            )
            count += 1
    return count


async def main() -> None:
    await connect_db()
    try:
        skill_ids = await seed_skills()
        role_ids = await seed_roles()
        tms_count = await seed_technology_maps_to_skill(skill_ids)
        srb_count = await seed_skill_required_by_role(skill_ids, role_ids)
        print(f"Seeded {len(skill_ids)} skills, {len(role_ids)} roles, "
              f"{tms_count} technology_maps_to_skill edges, {srb_count} skill_required_by_role edges.")
    finally:
        await disconnect_db()


if __name__ == "__main__":
    asyncio.run(main())
