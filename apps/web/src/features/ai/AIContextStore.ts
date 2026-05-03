// AI Context Synchronization Store
export interface AIChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: { tool: string; args: any; result: string }[];
}

export interface AIContextState {
  chatHistory: AIChatTurn[];
  activeModelId: string | null;
}
