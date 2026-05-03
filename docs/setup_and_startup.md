# Forgetwin-AI Setup & Startup Guide

This guide outlines the complete setup and startup sequence for the `forgetwin-ai` application in your local development environment.

---

## 1. Prerequisites & Infrastructure Setup

Ensure all backend infrastructure services (PostgreSQL, Redis, MinIO, and Qdrant) are running via Docker Compose.

```bash
cd infrastructure/docker
docker compose up -d
```

---

## 2. Database Initialization

Synchronize your PostgreSQL database using the Prisma schema inside the database package:

```bash
cd packages/database
pnpm install
npx prisma db push
```

---

## 3. Launching Services

### A. Node.js Applications (Frontend & API Gateway)
Since this project uses Turborepo, you can start both the Next.js Web client and the NestJS API Gateway simultaneously from the root directory of the repository:

```bash
pnpm install
pnpm run dev
```

* **Next.js Web Client**: [http://localhost:3000](http://localhost:3000)
* **NestJS API Gateway**: [http://localhost:3001](http://localhost:3001)

---

### B. CAD Processing Worker (Port 8000)
The Python worker is responsible for converting STEP files into Progressive GLB chunks.

#### Option 1: Native Execution (Fallback Mock Mode)
*Use this option to quickly test backend/frontend integrations without waiting for Docker to compile the heavy `pythonocc-core` library.*

```bash
cd apps/cad-processor
# Activate your venv and install dependencies from requirements.txt
python -m venv venv
.\venv\Scripts\activate   # (On Windows)
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

#### Option 2: Dockerized Execution (Full STEP Support)
*Highly recommended to get full logical assembly tree parsing and high-fidelity STEP parsing via `pythonocc-core`.*

```bash
cd apps/cad-processor
docker build -t forge-cad-processor .
docker run -p 8000:8000 -e PYTHONUNBUFFERED=1 -e API_GATEWAY_URL="http://host.docker.internal:3001" -e MINIO_ENDPOINT="host.docker.internal:9000" --env-file ../api-gateway/.env forge-cad-processor
```
