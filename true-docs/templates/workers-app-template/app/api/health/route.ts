export async function GET() {
  return Response.json({ 
    status: 'ok', 
    app: '[APP_NAME]',
    timestamp: new Date().toISOString() 
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}