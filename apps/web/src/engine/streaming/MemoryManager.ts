import { STREAMING } from '@/constants/viewer';

export class MemoryManager {
  public maxChunks = STREAMING.MAX_CHUNKS; // Maximum number of chunks allowed in GPU memory
  private chunkUsage: Map<string, number> = new Map();

  public markUsed(chunkId: string) {
    this.chunkUsage.set(chunkId, Date.now());
  }

  public getEvictionCandidates(activeChunkIds: string[]): string[] {
    const loaded = Array.from(this.chunkUsage.keys());
    if (loaded.length <= this.maxChunks) return [];

    // Sort chunks by oldest use (Least Recently Used)
    const sorted = loaded.sort((a, b) => this.chunkUsage.get(a)! - this.chunkUsage.get(b)!);
    
    const toEvict: string[] = [];
    for (const id of sorted) {
      if (!activeChunkIds.includes(id)) {
        toEvict.push(id);
        if (loaded.length - toEvict.length <= this.maxChunks) break;
      }
    }
    return toEvict;
  }

  public remove(chunkId: string) {
    this.chunkUsage.delete(chunkId);
  }
}
