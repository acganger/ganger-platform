/**
 * AI Receptionist - Modern Cloudflare Worker with Static Assets
 * Uses current best practices: TypeScript, ES modules, static assets binding
 */

interface Env {
  ASSETS: any; // Simplified type for now
  ENVIRONMENT?: string;
}

const handler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Validate request method
    if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405 });
    }

    // Health check endpoint with proper headers
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ai-receptionist',
        deployment: 'workers-static-assets',
        environment: env.ENVIRONMENT || 'production',
        version: '2.0.0'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });
    }

    // API routes for AI receptionist functionality
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRoutes(url, request, env);
    }

    // Serve static assets using Workers Static Assets
    return env.ASSETS.fetch(request);
  }
};

export default handler;

async function handleAPIRoutes(url: URL, request: Request, _env: Env): Promise<Response> {
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Type': 'application/json'
  };

  try {
    // Validate content type for POST requests
    if (request.method === 'POST') {
      const contentType = request.headers.get('Content-Type');
      if (!contentType?.includes('application/json')) {
        return new Response(JSON.stringify({ error: 'Invalid content type' }), { 
          status: 400, 
          headers: securityHeaders 
        });
      }
    }

    switch (url.pathname) {
      case '/api/calls/status':
        return handleCallStatus(request, _env);
      
      case '/api/ai/conversation':
        return handleAIConversation(request, _env);
      
      case '/api/employee/recognition':
        return handleEmployeeRecognition(request, _env);
      
      default:
        return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
          status: 404,
          headers: securityHeaders
        });
    }
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: securityHeaders
    });
  }
}

async function handleCallStatus(_request: Request, _env: Env): Promise<Response> {
  // Mock call status for demo
  const callStatus = {
    active_calls: 3,
    queue_length: 2,
    average_wait_time: '1.5 minutes',
    ai_confidence: 0.94,
    last_updated: new Date().toISOString()
  };

  return new Response(JSON.stringify(callStatus), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

async function handleAIConversation(request: Request, _env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Parse body for validation but don't use in demo
  await request.json() as { message: string; call_id?: string };
  
  // Mock AI response for demo
  const aiResponse = {
    response: "Thank you for calling Ganger Dermatology. How can I help you today?",
    intent: "greeting",
    confidence: 0.98,
    suggested_actions: ["schedule_appointment", "check_insurance", "billing_inquiry"],
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(aiResponse), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleEmployeeRecognition(request: Request, _env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Parse body for validation but don't use in demo
  await request.json() as { phone_number: string };
  
  // Mock employee recognition for demo
  const employeeData = {
    recognized: true,
    employee: {
      name: "Dr. Sarah Johnson",
      department: "Dermatology",
      role: "Physician Assistant",
      location: "Ann Arbor"
    },
    greeting: "Welcome back, Dr. Johnson! How can I assist you today?",
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(employeeData), {
    headers: { 'Content-Type': 'application/json' }
  });
}