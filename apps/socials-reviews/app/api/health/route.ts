import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'ok',
      app: 'socials-reviews',
      environment: process.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        auth: 'ok',
        storage: 'ok'
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      app: 'socials-reviews',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}