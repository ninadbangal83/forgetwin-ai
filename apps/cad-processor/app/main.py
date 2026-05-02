from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from app.pipeline import run_cad_processing

app = FastAPI(title="ForgeTwin CAD Processor (Streaming Chunk Generator)")


class ProcessRequest(BaseModel):
    modelId: str
    storageKey: str
    correlationId: str
    quality: str = "MEDIUM"


@app.post("/process")
def process_endpoint(request: ProcessRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        run_cad_processing,
        request.modelId,
        request.storageKey,
        request.correlationId
    )
    return {"status": "processing"}
