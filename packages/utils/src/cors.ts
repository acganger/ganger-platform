import { NextApiRequest, NextApiResponse } from 'next';

/**
 * CORS configuration for API routes in distributed Vercel deployment
 */

const ALLOWED_ORIGINS = [
  'https://staff.gangerdermatology.com',
  'https://gangerdermatology.com',
  // Add Vercel preview URLs dynamically
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  // Development
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : '',
].filter(Boolean);

export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // More permissive in development
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Middleware to handle CORS preflight requests
 */
export function handleCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(req, res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}

/**
 * Wrapper for API routes to automatically handle CORS
 */
export function withCors(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set CORS headers
    setCorsHeaders(req, res);
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Run the actual handler
    return handler(req, res);
  };
}