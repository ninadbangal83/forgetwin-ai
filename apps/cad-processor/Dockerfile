# ==========================================
# STAGE 1: Builder Stage
# ==========================================
FROM condaforge/miniforge3:latest AS builder

WORKDIR /app

# Install system dependencies needed for OCC
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglx0 && \
    rm -rf /var/lib/apt/lists/*

# Use mamba to create the environment. Mamba uses C++ libsolv engine
# which resolves dependencies in seconds rather than hours.
RUN mamba create -n cadenv -c conda-forge \
    python=3.10 pythonocc-core fastapi uvicorn pydantic minio requests trimesh numpy -y && \
    mamba clean -afy


# ==========================================
# STAGE 2: Final Runtime Stage
# ==========================================
FROM condaforge/miniforge3:latest AS runner

WORKDIR /app

# Install only the runtime OS dependencies needed for PythonOCC (OpenGL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglx0 && \
    rm -rf /var/lib/apt/lists/*

# Copy the exact installed environment from the builder stage
COPY --from=builder /opt/conda/envs/cadenv /opt/conda/envs/cadenv

# Copy our source files
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Set entrypoint using the conda environment copied over
ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "cadenv", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
