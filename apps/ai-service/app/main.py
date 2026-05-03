from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import datetime

app = FastAPI(title="ForgeTwin AI Copilot Service", version="1.0.0")

class AIChatRequest(BaseModel):
    modelId: str
    message: str
    history: Optional[List[Dict[str, str]]] = None

class ContextQueryRequest(BaseModel):
    query: str

# In-memory context extraction strategy for CAD copilot
def get_mock_cad_context(model_id: str) -> List[Dict[str, Any]]:
    # Mocking semantic extraction since direct db access is isolated
    return [
        {
            "id": "node_1",
            "name": "Cooling System Valve",
            "type": "COMPONENT",
            "text": "Cooling System main valve part ID node_1. Prevents temperature runaway."
        },
        {
            "id": "node_2",
            "name": "Beam Support",
            "type": "COMPONENT",
            "text": "Primary mechanical beam support node_2. Load bearing component."
        },
        {
            "id": "v_1",
            "name": "Version 1 Snapshot",
            "type": "VERSION",
            "text": "Revision version 1 of CAD model. Marked as Approved."
        }
    ]

@app.post("/chat")
async def chat_with_copilot(req: AIChatRequest):
    context = get_mock_cad_context(req.modelId)
    keywords = req.message.lower().split()
    matched = []
    
    for chunk in context:
        score = 0
        for kw in keywords:
            if kw in chunk["text"].lower():
                score += 1.5
            if kw in chunk["name"].lower():
                score += 2.0
        if score > 0:
            matched.append({**chunk, "score": score})
            
    matched.sort(key=lambda x: x["score"], reverse=True)
    top_context = matched[:5]

    tool_calls = []
    lower = req.message.lower()

    if "isolate" in lower or "show only" in lower or "focus" in lower:
        components = [c for c in top_context if c["type"] == "COMPONENT"]
        if components:
            tool_calls.append({
                "tool": "isolate_components",
                "args": {"nodeIds": [c["id"] for c in components]},
                "result": f"Isolated components: {', '.join([c['name'] for c in components])}"
            })

    if "hide" in lower or "remove" in lower:
        components = [c for c in top_context if c["type"] == "COMPONENT"]
        if components:
            tool_calls.append({
                "tool": "hide_components",
                "args": {"nodeIds": [c["id"] for c in components]},
                "result": f"Hidden components: {', '.join([c['name'] for c in components])}"
            })

    # Synthesize the response
    synthesis = ""
    if not top_context and not tool_calls:
        if "model" in lower or "name" in lower:
            synthesis = "The current CAD model loaded is **Engine Assembly**."
        else:
            synthesis = "Based on the assembly context, no specific matches were retrieved. Let's try searching by component name or assembly metadata."
    else:
        synthesis = f"I've analyzed the CAD model context regarding \"{req.message}\":\n\n"
        if top_context:
            synthesis += "**Semantic CAD Context Grounding:**\n"
            for c in top_context:
                synthesis += f"- **{c['name']}** [Type: {c['type']}]: Relevance match {c['score']}\n"
            synthesis += "\n"
        if tool_calls:
            synthesis += "**Deterministic Visual Tools Applied:**\n"
            for t in tool_calls:
                synthesis += f"- Executed `{t['tool']}`: {t['result']}\n"

    return {
        "status": "success",
        "data": {
            "message": synthesis,
            "toolCalls": tool_calls,
            "contextRetrieved": top_context
        }
    }

@app.get("/summarize/{modelId}")
async def summarize_model(modelId: str):
    context = get_mock_cad_context(modelId)
    components = [c for c in context if c["type"] == "COMPONENT"]
    versions = [c for c in context if c["type"] == "VERSION"]

    summary = "**AI Python Service CAD Analysis:**\n\n"
    summary += f"Identified components within geometry: {len(components)}\n"
    summary += f"Identified saved revision snapshots: {len(versions)}\n\n"
    
    if components:
        summary += "### Component Index:\n"
        for c in components:
            summary += f"- **{c['name']}** (Search ID: `{c['id']}`)\n"

    return {
        "status": "success",
        "summary": summary
    }

@app.post("/search/{modelId}")
async def search_model_context(modelId: str, req: ContextQueryRequest):
    context = get_mock_cad_context(modelId)
    keywords = req.query.lower().split()
    matched = []
    
    for chunk in context:
        score = 0
        for kw in keywords:
            if kw in chunk["text"].lower():
                score += 1.5
            if kw in chunk["name"].lower():
                score += 2.0
        if score > 0:
            matched.append({**chunk, "score": score})
            
    matched.sort(key=lambda x: x["score"], reverse=True)
    return {
        "status": "success",
        "data": matched
    }
