# Docker Optimization Report: Forgetwin-AI

This report provides a detailed evaluation of your current Docker setup for `forgetwin-ai`, identifies why your laptop might be hanging during development, and outlines actionable strategies for optimizing Docker resource consumption.

---

## 1. Do We Require All These Images / Services?

The `docker-compose.yml` file lists the following services:
1. **PostgreSQL** (`postgres:15-alpine`)
2. **MongoDB** (`mongo:6-jammy`)
3. **Redis** (`redis:7-alpine`)
4. **MinIO** (`minio/minio:latest`)
5. **MinIO Initializer** (`minio/mc:latest`)
6. **Qdrant** (`qdrant/qdrant:latest`)

### Unused Services & Redundant Images
- **Qdrant (Vector Database)**: **NOT CURRENTLY REQUIRED IN DEVELOPMENT.** A complete codebase search reveals that while Qdrant is mentioned in the documentation (`cad_metadata_extraction_notes.md`), it is not referenced anywhere in the source code or modules of `apps/api-gateway` or `apps/cad-processor`. 
- **MongoDB**: It is used to store rich flexible engineering metadata (BOM variations, CAD features, topology), while PostgreSQL is used via Prisma for relational user management and CAD models. Both are active, but if you're not actively working on metadata features, you don't necessarily need to keep MongoDB running continuously.

---

## 2. Why is Your Laptop Hanging?

There are 3 main factors leading to heavy resource consumption and your laptop hanging during local development:

### A. High RAM & CPU Usage by WSL2
When Docker runs on Windows, it typically utilizes the Windows Subsystem for Linux (WSL2). By default, WSL2 can consume up to 80% of your total system RAM. Running 5 active, long-lived data services (Postgres, Mongo, Redis, MinIO, Qdrant) alongside a heavy Python CAD processing service quickly exhausts physical memory, causing WSL2 to use memory swap, which results in the entire laptop hanging.

### B. Missing `.dockerignore` in the CAD Processor
The `apps/cad-processor/Dockerfile` performs a `COPY . .` without a `.dockerignore` file. This means that large folders like your local `venv/` directory and Python caches (`__pycache__`) are included in the build context. 
- It bloats the Docker build context size.
- It causes much longer image build times.
- It can overwrite files inside the container with Windows-compiled dependencies from the local virtual environment.

### C. Large Base Image for Python CAD Processor
The `cad-processor` image builds from `condaforge/miniforge3:latest` and installs extensive CAD and web dependencies (`pythonocc-core`, `trimesh`, `numpy`). Conda environments have a huge footprint (easily exceeding 1.5 GB), which uses up container disk space and takes time to initialize.

---

## 3. Can We Optimize It? (How to Proceed)

Yes, you can significantly optimize this setup to make development light and prevent hangs. Here are recommended improvements:

### Recommended Optimization Action Plan

#### 1. Disable Unused Services
Comment out or remove the **Qdrant** service from `docker-compose.yml`. This immediately frees up memory.

#### 2. Restrict WSL2 Resource Consumption
Limit the maximum amount of RAM and CPU Docker can consume by creating or editing a `.wslconfig` file in your Windows user profile folder (`C:\Users\<YourUsername>\.wslconfig`).

```ini
[wsl2]
# Restrict WSL2 memory to 4GB or 6GB, and limit it to 2-4 CPU cores
memory=4GB
processors=4
```

#### 3. Start Only Necessary Services
Instead of starting everything at once with `docker compose up`, only start the services you need for your current task. For example:
```powershell
# To run just Postgres, Redis, and MinIO:
docker compose up postgres redis minio
```

#### 4. Add a `.dockerignore` to the Python App
Add a `.dockerignore` file in `apps/cad-processor` to exclude heavy and irrelevant files from being copied:

```text
__pycache__/
*.pyc
venv/
.turbo/
package.json
node_modules/
```

#### 5. Pin Images & Use Alpine Base Images
Where possible, use ultra-lightweight Alpine or specific stable tags to keep images lean:
- Use `postgres:15-alpine` (Already in place - Good!)
- Change MongoDB from `mongo:6-jammy` to `mongo:6-alpine` or `mongo:7-alpine`.
- Use pinned versions instead of `latest` for images like MinIO and Qdrant to improve caching stability.

---

## 4. Summary

- **Optimized?** Partially, but there are clear areas for improvement (e.g., Qdrant is unused, `.dockerignore` is missing).
- **Require all images?** No. `qdrant` is not currently used in the codebase.
- **Can it be optimized to prevent hanging?** Yes! By restricting WSL2 resources, pruning the `.dockerignore`, and turning off unused containers.
