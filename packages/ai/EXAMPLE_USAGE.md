# AI Workers Package - Example Usage

## How the AI Integration Works Now

### 1. Basic Chat Example

```typescript
import { createGangerAI } from '@ganger/ai/server';

// In your API route or server function
export async function POST(request: Request) {
  // Create AI instance with your environment
  const ai = createGangerAI(process.env, {
    app: 'staff',
    hipaaCompliant: true
  });

  // Make an AI request
  const response = await ai.chat({
    messages: [
      { role: 'user', content: 'What are the common symptoms of eczema?' }
    ]
  });

  return Response.json({
    success: response.success,
    answer: response.data
  });
}
```

### 2. What Happens Behind the Scenes

1. **Request Validation**: The AI package validates your request format
2. **Model Selection**: Based on the use case, it selects the best model
3. **Safety Check**: For patient-facing content, it runs safety filtering
4. **API Call**: Makes actual HTTP request to Cloudflare Workers AI:
   ```
   POST https://api.cloudflare.com/client/v4/accounts/68d0160c9915efebbbecfddfd48cddab/ai/run/@cf/meta/llama-3.1-8b-instruct
   ```
5. **Response Handling**: Parses Cloudflare's response format
6. **Usage Tracking**: Logs the usage for cost monitoring
7. **Return**: Sends formatted response back to your app

### 3. Available Models and Their Uses

```typescript
// Medical conversation (using llama-3.1-8b as substitute)
const medical = await ai.chat({
  messages: [{ role: 'user', content: 'Patient question here' }],
  config: { model: 'llama-4-scout-17b-16e-instruct' }
});

// Fast chat responses
const quick = await ai.chat({
  messages: [{ role: 'user', content: 'Quick question' }],
  config: { model: 'llama-3.3-70b-instruct-fp8-fast' }
});

// Complex reasoning (using qwen as substitute)
const analysis = await ai.chat({
  messages: [{ role: 'user', content: 'Analyze this data...' }],
  config: { model: 'qwq-32b' }
});
```

### 4. Error Handling

```typescript
try {
  const response = await ai.chat({ messages });
  console.log('Success:', response.data);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limiting
  } else if (error.code === 'BUDGET_EXCEEDED') {
    // Handle budget limits
  } else if (error.code === 'MODEL_API_ERROR') {
    // Cloudflare API error
  }
}
```

### 5. Environment Setup

Add these to your `.env.local`:
```bash
# Cloudflare AI credentials
CLOUDFLARE_ACCOUNT_ID=68d0160c9915efebbbecfddfd48cddab
CLOUDFLARE_API_TOKEN=TjWbCx-K7trqYmJrU8lYNlJnzD2sIVAVjvvDD8Yf

# Supabase (for usage tracking - optional)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key
```

### 6. Testing the Integration

To test if the AI is working:

```typescript
// Simple test endpoint
export async function GET() {
  const ai = createGangerAI(process.env, { app: 'test' });
  
  try {
    const response = await ai.chat({
      messages: [{ role: 'user', content: 'Hello, are you working?' }]
    });
    
    return Response.json({
      status: 'AI is working!',
      response: response.data
    });
  } catch (error) {
    return Response.json({
      status: 'AI error',
      error: error.message
    }, { status: 500 });
  }
}
```

## Important Notes

1. **Model Substitutions**: Some models from the PRD don't exist in Cloudflare's catalog, so we use similar alternatives
2. **Rate Limits**: Cloudflare has rate limits on AI calls - the package handles these
3. **Costs**: Each AI call costs money - monitor your usage!
4. **HIPAA**: Safety filtering is automatic for patient-facing content
5. **Response Times**: Expect 100-500ms per request depending on model and complexity