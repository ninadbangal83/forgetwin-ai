import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

export interface AIChatRequest {
  modelId: string;
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AIChatResponse {
  message: string;
  toolCalls: { tool: string; args: any; result: string }[];
  contextRetrieved: { id: string; name: string; type: string; score: number }[];
}

@Injectable()
export class AiService {
  constructor(private readonly _prisma: PrismaService) { }

  // Context chunking / document generation strategy
  async getModelAiContext(modelId: string): Promise<any[]> {
    const model = await (this._prisma as any).cadModel.findUnique({
      where: { id: modelId },
    });

    if (!model) throw new NotFoundException('CAD Model not found');

    const assemblyTree = model.assemblyTree || {};
    const nodes = (assemblyTree as any).nodes || [];

    const versions = await (this._prisma as any).cadModelVersion.findMany({
      where: { modelId },
      include: { annotations: true },
    });

    // Create discrete contextual chunks for hybrid / semantic retrieval
    const chunks: any[] = [];

    // Chunks for nodes/components
    nodes.forEach((node: any) => {
      chunks.push({
        id: node.id || node.nodeId,
        name: node.name || 'Unnamed Part',
        type: 'COMPONENT',
        text: `CAD Component Part ID: ${node.id || node.nodeId}. Name: ${node.name || 'Unnamed Part'}. Metadata: ${JSON.stringify(node.metadata || {})}.`,
      });
    });

    // Chunks for review versions
    versions.forEach((v: any) => {
      chunks.push({
        id: v.versionId,
        name: `Version ${v.versionNumber}`,
        type: 'VERSION',
        text: `Review Session Version ${v.versionNumber} has status ${v.reviewStatus}. Created at: ${v.createdAt.toISOString()}`,
      });

      // Chunks for annotation notes
      v.annotations?.forEach((ann: any) => {
        chunks.push({
          id: ann.annotationId,
          name: `Note on Part ${ann.partId || 'all'}`,
          type: 'ANNOTATION',
          text: `User Annotation note: "${ann.note}" recorded on CAD part/assembly node ${ann.partId || 'all'}.`,
        });
      });
    });

    return chunks;
  }

  // Cost-Optimized Context Retrieval First (RAG matching + Scoring)
  async queryModelContext(modelId: string, query: string): Promise<any[]> {
    const chunks = await this.getModelAiContext(modelId);
    const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);

    return chunks
      .map((chunk) => {
        let score = 0;
        keywords.forEach((kw) => {
          if (chunk.text.toLowerCase().includes(kw)) score += 1.5;
          if (chunk.name.toLowerCase().includes(kw)) score += 2.0;
        });
        return { ...chunk, score };
      })
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return the most relevant chunks only for token efficiency
  }

  // AI Tool Registry Evaluation
  async evaluateTools(query: string, modelId: string): Promise<any[]> {
    const toolCalls: any[] = [];
    const lower = query.toLowerCase();

    // 1. Isolate/Focus components
    if (lower.includes('isolate') || lower.includes('show only') || lower.includes('focus')) {
      const chunks = await this.queryModelContext(modelId, query);
      const components = chunks.filter((c) => c.type === 'COMPONENT');
      if (components.length > 0) {
        toolCalls.push({
          tool: 'isolate_components',
          args: { nodeIds: components.map((c) => c.id) },
          result: `Isolated part(s): ${components.map((c) => c.name).join(', ')}`,
        });
      }
    }

    // 2. Hide components
    if (lower.includes('hide') || lower.includes('remove')) {
      const chunks = await this.queryModelContext(modelId, query);
      const components = chunks.filter((c) => c.type === 'COMPONENT');
      if (components.length > 0) {
        toolCalls.push({
          tool: 'hide_components',
          args: { nodeIds: components.map((c) => c.id) },
          result: `Hidden part(s): ${components.map((c) => c.name).join(', ')}`,
        });
      }
    }

    // 3. Find metadata
    if (lower.includes('metadata') || lower.includes('find properties') || lower.includes('find component')) {
      const chunks = await this.queryModelContext(modelId, query);
      if (chunks.length > 0) {
        toolCalls.push({
          tool: 'find_components_by_metadata',
          args: { search: query },
          result: `Found components matches: ${chunks.map((c) => c.name).join(', ')}`,
        });
      }
    }

    // 4. Component Stats
    if (lower.includes('statistics') || lower.includes('count') || lower.includes('parts')) {
      const chunks = await this.getModelAiContext(modelId);
      const count = chunks.filter((c) => c.type === 'COMPONENT').length;
      toolCalls.push({
        tool: 'get_component_statistics',
        args: {},
        result: `Total parts in CAD model assembly: ${count}`,
      });
    }

    return toolCalls;
  }

  // RAG-based AI synthesis execution
  async processChat(req: AIChatRequest): Promise<AIChatResponse> {
    try {
      // Direct call to Python AI Service if available
      const pythonRes = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      if (pythonRes.ok) {
        const pyData = await pythonRes.json();
        return pyData.data;
      }
    } catch (err) {
      console.log('Local fallback: Python AI service is not currently running or reachable.');
    }

    const context = await this.queryModelContext(req.modelId, req.message);
    const toolCalls = await this.evaluateTools(req.message, req.modelId);

    // Dynamic responses using grounded technical information
    let synthesis = '';
    if (context.length === 0 && toolCalls.length === 0) {
      synthesis = "Based on the assembly tree and CAD metadata, no matching components or annotations were found for your query. Let's explore other parts of the CAD assembly or review comments.";
    } else {
      synthesis = `I've analyzed the CAD model context regarding "${req.message}":\n\n`;

      if (context.length > 0) {
        synthesis += `**Grounded Context Information:**\n`;
        context.forEach((chunk) => {
          synthesis += `- **${chunk.name}** [Type: ${chunk.type}]: Matches with relevance score ${chunk.score}.\n`;
        });
        synthesis += `\n`;
      }

      if (toolCalls.length > 0) {
        synthesis += `**Automated Visual Operations Executed:**\n`;
        toolCalls.forEach((t) => {
          synthesis += `- Executed \`${t.tool}\`: ${t.result}\n`;
        });
      } else {
        synthesis += `I'm grounded exclusively on retrieval data, assembly properties, and active engineering review notes to maintain strict accuracy.`;
      }
    }

    return {
      message: synthesis,
      toolCalls,
      contextRetrieved: context,
    };
  }

  async summarizeRevision(modelId: string): Promise<string> {
    const context = await this.getModelAiContext(modelId);
    const versions = context.filter((c) => c.type === 'VERSION');
    const annotations = context.filter((c) => c.type === 'ANNOTATION');

    if (versions.length === 0 && annotations.length === 0) {
      return 'No reviews or annotations were found to summarize for this CAD model.';
    }

    let summary = `**AI Revision Summary & Engineering Report:**\n\n`;
    summary += `Total saved revision reviews: ${versions.length}\n`;
    summary += `Total associated review comments / notes: ${annotations.length}\n\n`;

    if (versions.length > 0) {
      summary += `### Revision History List:\n`;
      versions.forEach((v) => {
        summary += `- **${v.name}**\n`;
      });
      summary += `\n`;
    }

    if (annotations.length > 0) {
      summary += `### Annotation Notes Checklist:\n`;
      annotations.forEach((ann) => {
        summary += `- ${ann.text}\n`;
      });
    }

    return summary;
  }
}
