export type ChunkState = 'UNLOADED' | 'REQUESTING' | 'STREAMING' | 'RENDERING' | 'EVICTING' | 'OPTIMIZING';

export class StreamingStateMachine {
  private states: Map<string, ChunkState> = new Map();

  public setState(chunkId: string, state: ChunkState) {
    this.states.set(chunkId, state);
  }

  public getState(chunkId: string): ChunkState {
    return this.states.get(chunkId) || 'UNLOADED';
  }

  public canTransition(chunkId: string, toState: ChunkState): boolean {
    const fromState = this.getState(chunkId);
    
    switch (toState) {
      case 'REQUESTING':
        return fromState === 'UNLOADED' || fromState === 'EVICTING';
      case 'STREAMING':
        return fromState === 'REQUESTING';
      case 'RENDERING':
        return fromState === 'STREAMING';
      case 'EVICTING':
        return fromState === 'RENDERING' || fromState === 'OPTIMIZING';
      case 'OPTIMIZING':
        return fromState === 'RENDERING';
      default:
        return false;
    }
  }

  public clear() {
    this.states.clear();
  }
}
