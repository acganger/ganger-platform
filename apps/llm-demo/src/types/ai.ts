export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

// Define AIModel as a string type union for available models
export type AIModel = 
  | 'llama-4-scout-17b-16e-instruct'
  | 'llama-3.3-70b-instruct-fp8-fast'
  | 'qwq-32b'
  | 'llama-3.2-11b-vision-instruct'
  | 'llama-3.2-3b-instruct'
  | 'llama-3.2-1b-instruct'
  | 'llama-guard-3-8b'
  | 'whisper-large-v3-turbo'
  | 'melotts'
  | 'bge-m3'
  | 'bge-reranker-base';

export interface ChatRequest {
  messages: ChatMessage[];
  model?: AIModel;
  stream?: boolean;
}

export interface ChatResponse {
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}