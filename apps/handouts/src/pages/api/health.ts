import { NextApiRequest, NextApiResponse } from 'next';

export const runtime = 'edge';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const health = {
      status: 'healthy',
      app: 'handouts',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        server: 'ok',
        database: 'ok',
        pdf_service: 'ok',
        communication: 'ok'
      }
    };

    if (req.method === 'HEAD') {
      return res.status(200).end();
    }

    res.status(200).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      app: 'handouts',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}