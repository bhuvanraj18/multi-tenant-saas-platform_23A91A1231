# Technical Specification

## 1. Project Structure

The project will follow a monorepo-style structure within a single repository, separating Backend and Frontend.

```
/
├── backend/                # Node.js Express API
│   ├── src/
│   │   ├── config/         # DB config, Envs
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, Error, Validation
│   │   ├── models/         # DB Models / Types needed
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   └── index.js        # Entry point
│   ├── migrations/         # SQL migration files
│   ├── seeds/              # Seed data scripts
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React Vite App
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # Auth Context
│   │   ├── pages/          # Route pages
│   │   ├── services/       # API client
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docs/                   # Documentation
├── docker-compose.yml      # Orchestration
├── README.md
└── submission.json
```

## 2. Development Setup Guide

### Prerequisites
-   Node.js (v18+)
-   Docker & Docker Compose
-   PostgreSQL (Client tools recommended)

### Environment Variables
See `.env.example` in `backend/`. Key variables:
-   `DB_HOST`: database
-   `JWT_SECRET`: <secure_string>
-   `FRONTEND_URL`: http://localhost:3000

### Installation Steps
1.  Clone repository.
2.  Install dependencies:
    ```bash
    cd backend && npm install
    cd ../frontend && npm install
    ```

### Running Locally (Docker - Recommended)
The entire stack can be brought up with one command:
```bash
docker-compose up -d --build
```
This will start:
-   PostgreSQL on port 5432
-   Backend API on port 5000
-   Frontend on port 3000

Migrations and Seeds will run automatically.

### Running Tests
Currently, manual testing via Postman is the primary verification method.
Health check:
```bash
curl http://localhost:5000/api/health
```
