# Multi-Tenant SaaS Platform

A production-ready, multi-tenant SaaS application for project and task management.

## Features

- **Multi-Tenancy**: Data isolation via `tenant_id`.
- **Authentication**: JWT-based auth with secure password hashing.
- **RBAC**: Role-Based Access Control (Super Admin, Tenant Admin, User).
- **Project & Task Management**: Full CRUD capabilities.
- **Dockerized**: specific `Dockerfile`s and `docker-compose.yml`.

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Vite
- **Database**: PostgreSQL
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

- Docker Desktop installed and running.
- Node.js (optional, for local dev without Docker).

## Getting Started

1.  **Clone the repository** (if applicable).
2.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```
3.  **Access Application**:
    - Frontend: `http://localhost:3000`
    - Backend API: `http://localhost:5000`
    - Database: localhost:5432

## Initial Setup

- The application automatically runs migrations and seeds the database on startup.
- **Demo Credentials** (from `seed_data.sql`):
    - **Super Admin**: `admin@platform.com` / `password123`
    - **Tenant Admin**: `admin@acme.com` / `password123` (Subdomain: `acme`)
    - **User**: `alice@acme.com` / `password123` (Subdomain: `acme`)

## Development

- **Backend**: `backend/src`
- **Frontend**: `frontend/src`
- **Docs**: `docs/` folder contains detailed documentation.
