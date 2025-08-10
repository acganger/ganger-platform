import type { NextApiRequest, NextApiResponse } from 'next';
import type { AIModel } from '@/types/ai';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { trackUsage } from '@/lib/usage-tracking';

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  maxRequests: 20, // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
  message: 'Too many requests. Please wait a moment before trying again.'
};

// Get client identifier from request (kept for backwards compatibility)
function getClientId(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown';
  
  return ip;
}

// Check rate limit
function checkRateLimit(clientId: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);
  
  // Clean up old entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [id, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(id);
      }
    }
  }
  
  if (!clientData || clientData.resetTime < now) {
    // New window
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs
    });
    return { allowed: true };
  }
  
  if (clientData.count >= RATE_LIMIT.maxRequests) {
    const waitTime = Math.ceil((clientData.resetTime - now) / 1000);
    return { 
      allowed: false, 
      message: `${RATE_LIMIT.message} (${waitTime}s remaining)`
    };
  }
  
  // Increment count
  clientData.count++;
  return { allowed: true };
}

// Model mapping
const modelMapping: Record<AIModel, string> = {
  'llama-4-scout-17b-16e-instruct': '@cf/meta/llama-3.1-8b-instruct',
  'llama-3.3-70b-instruct-fp8-fast': '@cf/meta/llama-3.1-8b-instruct-fast',
  'llama-3.2-3b-instruct': '@cf/meta/llama-3.2-3b-instruct',
  'llama-3.2-1b-instruct': '@cf/meta/llama-3.2-1b-instruct',
  'qwq-32b': '@cf/qwen/qwen1.5-14b-chat-awq',
  'llama-3.2-11b-vision-instruct': '@cf/meta/llama-3.2-11b-vision-instruct',
  'llama-guard-3-8b': '@cf/meta/llama-guard-3-11b-vision-preview',
  'whisper-large-v3-turbo': '@cf/openai/whisper',
  'melotts': '@cf/bytedance/stable-diffusion-xl-lightning',
  'bge-m3': '@cf/baai/bge-base-en-v1.5',
  'bge-reranker-base': '@cf/baai/bge-reranker-base'
};

// Cost per token (simplified)
const costPerToken: Record<AIModel, number> = {
  'llama-4-scout-17b-16e-instruct': 0.0001,
  'llama-3.3-70b-instruct-fp8-fast': 0.00008,
  'qwq-32b': 0.00012,
  'llama-3.2-11b-vision-instruct': 0.00015,
  'llama-3.2-1b-instruct': 0.00005,
  'llama-3.2-3b-instruct': 0.00006,
  'llama-guard-3-8b': 0.00007,
  'whisper-large-v3-turbo': 0.00006,
  'melotts': 0.00005,
  'bge-m3': 0.00002,
  'bge-reranker-base': 0.00003
};

async function chatHandler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check rate limit - use authenticated user email instead of IP
  const clientId = req.user.email;
  const rateLimitResult = checkRateLimit(clientId);
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: rateLimitResult.message || RATE_LIMIT.message
      }
    });
  }

  try {
    const { messages, config } = req.body;
    const model = config?.model || 'llama-3.2-1b-instruct';
    const cfModel = modelMapping[model as AIModel] || '@cf/meta/llama-3.2-1b-instruct';
    
    const startTime = Date.now();
    
    // Retry logic for handling capacity issues
    let lastError;
    let data;
    let responseTime;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
      
      try {
        // Direct Cloudflare AI call
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${cfModel}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Cloudflare API error: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.errors?.[0]?.message) {
              errorMessage = errorData.errors[0].message;
              
              // Handle specific error cases
              if (errorMessage.includes('Capacity temporarily exceeded')) {
                errorMessage = 'AI model is currently at capacity. Please try again in a few moments.';
              } else if (errorMessage.includes('rate limit')) {
                errorMessage = 'Too many requests. Please slow down and try again.';
              }
            }
          } catch (e) {
            errorMessage = `${errorMessage} - ${errorText}`;
          }
          
          // Check if it's a temporary capacity issue
          if (response.status === 429 || errorMessage.includes('Capacity temporarily exceeded')) {
            lastError = new Error(errorMessage);
            continue; // Try again
          }
          
          throw new Error(errorMessage);
        }

        data = await response.json();
        responseTime = Date.now() - startTime;
        
        // Success - break out of retry loop
        break;
        
      } catch (error) {
        lastError = error;
        
        // If it's not a retryable error, throw immediately
        if (error instanceof Error && !error.message.includes('capacity') && !error.message.includes('429')) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === 2) {
          throw error;
        }
      }
    }
    
    // If we got here without data, throw the last error
    if (!data) {
      throw lastError || new Error('Failed to get response from AI');
    }
    
    // Calculate cost
    const totalTokens = data.result.usage?.total_tokens || 0;
    const cost = totalTokens * (costPerToken[model as AIModel] || 0.0001);
    
    // Track usage for billing and monitoring
    await trackUsage({
      user_id: req.user.id,
      user_email: req.user.email,
      endpoint: '/api/ai/chat',
      model: model,
      tokens_used: totalTokens,
      cost: cost,
      timestamp: new Date()
    });
    
    // Return in GangerAI expected format
    res.status(200).json({
      success: true,
      data: data.result.response,
      meta: {
        requestId: `demo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: model as AIModel,
        tokensUsed: totalTokens,
        cost: cost,
        responseTime: responseTime,
        safetyScore: 1.0, // Demo always safe
        cached: false
      }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error instanceof Error ? error.message : 'An error occurred'
      }
    });
  }
}

// Export the handler wrapped with authentication
export default withAuth(chatHandler);