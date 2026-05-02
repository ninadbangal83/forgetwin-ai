# ForgeTwin AI - Enterprise CAD Visualizer & Progressive Streaming

ForgeTwin AI is a high-fidelity monorepo system designed for out-of-core Progressive CAD Streaming and assembly structure extraction. It processes complex engineering CAD assemblies (e.g., `.step`, `.stp`) into multi-LOD spatial chunks, enabling fast visual streaming of multi-gigabyte models directly into a Three.js canvas.

---

## Repository Structure

```
├── apps/
│   ├── web/               # Next.js 15+ frontend (Three.js WebGL canvas, Engineering tools)
│   ├── api-gateway/       # NestJS backend orchestrating uploads, callbacks, and telemetry
│   └── cad-processor/     # Python CAD Worker converting STEP to Progressive GLB chunks
└── packages/
    └── database/          # Prisma centralized data layer and PostgreSQL schema
```

---

## Getting Started

### 1. Prerequisites & Infrastructure Setup
Ensure that the supporting infrastructure (Postgres, Redis, MinIO) is up and running via Docker:

```bash
cd infrastructure/docker
docker compose up -d
```

#### Direct Connect URLs & Credentials:
* **MinIO Console**: `http://localhost:9001` (`forge_admin` / `forge_secret`)
* **MinIO S3 Endpoint**: `http://localhost:9000`
* **PostgreSQL**: `postgresql://forge_admin:forge_secret@localhost:5432/forgetwin_dev?schema=public`
* **Redis**: `redis://:forge_secret@localhost:6379`

### 2. Database Initialization
Synchronize the PostgreSQL tables using the Prisma schema inside the database package:

```bash
cd packages/database
npx prisma db push
```

> [!TIP]
> To completely clear all entries and reset your local database, run:
> ```bash
> npx prisma db push --force-reset
> ```

---

## 3. Launching Services

### Node.js Services (Frontend & API Gateway)
Because this is a Turborepo, you can easily start both the Next.js Web Client and the NestJS API Gateway simultaneously from the root directory:

```bash
pnpm install
pnpm run dev
```
*(This starts the Web app on `http://localhost:3000` and API on `http://localhost:3001`)*

### CAD Processing Worker (Port 8000)
The Python worker is used to generate progressive streaming chunks for CAD models. Since it requires the massive `pythonocc-core` C++ library to read `.step` files, **Docker is highly recommended**.

#### Native Execution (Fallback Mock Mode):
*(Note: If you run natively without pythonocc-core, it will fall back to generating dummy cube geometry instead of reading the real STEP file).*
```bash
cd apps/cad-processor
# Activate your venv and install dependencies
uvicorn main:app --host 127.0.0.1 --port 8000
```

#### Dockerized Execution (Full STEP Support):
```bash
cd apps/cad-processor
docker build -t forge-cad-processor .
docker run -p 8000:8000 -e API_GATEWAY_URL="http://host.docker.internal:3001" -e MINIO_ENDPOINT="host.docker.internal:9000" --env-file ../api-gateway/.env forge-cad-processor
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test and visualize your CAD assemblies!
