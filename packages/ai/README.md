# @ganger/ai - AI Workers Package

Healthcare-optimized AI capabilities for the Ganger Platform.

## Status

✅ **TypeScript Compilation**: Passing with no errors
⚠️  **Partial Implementation**: Core functionality exists but several files are missing

### Implemented Files:
- `src/index.ts` - Main package exports
- `src/client/index.ts` - Client-side exports
- `src/client/hooks.ts` - React hooks for AI integration
- `src/server/index.ts` - Server-side exports
- `src/server/client.ts` - Core GangerAI class
- `src/shared/index.ts` - Shared exports
- `src/shared/types.ts` - TypeScript type definitions
- `src/shared/constants.ts` - AI model configurations and constants

### Missing Files (Referenced but not implemented):
- `src/client/components.tsx` - React components
- `src/server/monitoring.ts` - Usage monitoring
- `src/server/safety.ts` - HIPAA safety filtering

## Installation

```bash
npm install @ganger/ai
```

## Usage

### Server-side

```typescript
import { createGangerAI } from '@ganger/ai/server';

const ai = createGangerAI(env, {
  app: 'ai-receptionist',
  hipaaCompliant: true
});

const response = await ai.chat({
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Client-side

```typescript
import { useAI } from '@ganger/ai/client';

function ChatComponent() {
  const { chat, loading, error } = useAI({ app: 'staff' });
  
  const handleChat = async () => {
    const response = await chat({
      messages: [{ role: 'user', content: 'Hello' }]
    });
  };
}
```

## Features

- Healthcare-optimized AI model selection
- HIPAA compliance and safety filtering
- Cost controls and rate limiting
- Usage monitoring and reporting
- React hooks for easy integration
- TypeScript support

## Models Supported

- llama-4-scout-17b-16e-instruct
- llama-3.3-70b-instruct-fp8-fast
- llama-guard-3-8b
- qwq-32b
- llama-3.2-11b-vision-instruct
- whisper-large-v3-turbo
- melotts
- bge-m3
- bge-reranker-base