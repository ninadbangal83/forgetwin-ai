FROM condaforge/miniforge3:latest

# Set working directory
WORKDIR /app

# Install system dependencies (mesa required for OpenGL operations in OCC)
RUN apt-get update && apt-get install -y libgl1 libglx0 && rm -rf /var/lib/apt/lists/*

# Create conda environment with pythonocc-core and web dependencies.
# Using conda-forge channel is highly recommended for pythonocc to prevent C++ compilation nightmares.
RUN conda create -n cadenv -c conda-forge python=3.10 pythonocc-core fastapi uvicorn pydantic minio requests trimesh numpy -y

# Force RUN commands to use the new environment
SHELL ["conda", "run", "-n", "cadenv", "/bin/bash", "-c"]

# Copy Python processing application
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Set Entrypoint to automatically activate conda environment
ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "cadenv", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
