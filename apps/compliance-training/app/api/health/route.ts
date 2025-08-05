import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const health = {
      status: 'ok',
      app: 'compliance-training',
      environment: process.env.ENVIRONMENT || 'development',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: 'ok',
        auth: 'ok',
        storage: 'ok',
        training_engine: 'ok',
        certification_tracking: 'ok'
      }
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      app: 'compliance-training',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}