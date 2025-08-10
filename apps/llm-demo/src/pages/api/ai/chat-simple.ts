import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { trackUsage } from '@/lib/usage-tracking';

// Share rate limiter with main chat endpoint
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  maxRequests: 20, // Max requests per window
  windowMs: 60 * 1000, // 1 minute window
  message: 'Too many requests. Please wait a moment before trying again.'
};

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

async function chatSimpleHandler(
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
    const { messages, model } = req.body;
    
    // Map our model names to Cloudflare's
    const modelMapping: Record<string, string> = {
      'llama-4-scout-17b-16e-instruct': '@cf/meta/llama-3.1-8b-instruct',
      'llama-3.3-70b-instruct-fp8-fast': '@cf/meta/llama-3.1-8b-instruct-fast',
      'llama-3.2-3b-instruct': '@cf/meta/llama-3.2-3b-instruct',
      'llama-3.2-1b-instruct': '@cf/meta/llama-3.2-1b-instruct',
      'qwq-32b': '@cf/qwen/qwen1.5-14b-chat-awq',
      'llama-3.2-11b-vision-instruct': '@cf/meta/llama-3.2-11b-vision-instruct'
    };

    const cfModel = modelMapping[model] || '@cf/meta/llama-3.2-1b-instruct';
    
    // Direct call to Cloudflare AI
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
      const error = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // Track usage
    const totalTokens = data.result.usage?.total_tokens || 0;
    const cost = totalTokens * 0.0001;
    
    await trackUsage({
      user_id: req.user.id,
      user_email: req.user.email,
      endpoint: '/api/ai/chat-simple',
      model: model,
      tokens_used: totalTokens,
      cost: cost,
      timestamp: new Date()
    });
    
    // Return in our expected format
    res.status(200).json({
      success: true,
      data: data.result.response,
      meta: {
        requestId: `demo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        model: model,
        tokensUsed: data.result.usage?.total_tokens,
        cost: (data.result.usage?.total_tokens || 0) * 0.0001,
        responseTime: 0
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
export default withAuth(chatSimpleHandler);