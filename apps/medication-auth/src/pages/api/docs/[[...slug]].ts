import { NextApiRequest, NextApiResponse } from 'next';
import { generateOpenAPISpec, generateSwaggerHTML } from '@ganger/docs';

export default function apiDocsHandler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const route = Array.isArray(slug) ? slug.join('/') : slug || '';

  try {
    switch (route) {
      case '':
      case 'index':
        // Serve Swagger UI HTML
        return serveSwaggerUI(req, res);
      
      case 'openapi.json':
        // Serve OpenAPI JSON specification
        return serveOpenAPISpec(req, res);
      
      case 'redoc':
        // Serve ReDoc HTML (alternative documentation UI)
        return serveReDocUI(req, res);
      
      default:
        return res.status(404).json({
          error: 'Documentation route not found',
          available_routes: [
            '/api/docs - Swagger UI documentation',
            '/api/docs/openapi.json - OpenAPI 3.0 specification',
            '/api/docs/redoc - ReDoc documentation UI'
          ]
        });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate API documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function serveSwaggerUI(req: NextApiRequest, res: NextApiResponse) {
  const specUrl = `${getBaseUrl(req)}/api/docs/openapi.json`;
  const html = generateSwaggerHTML(specUrl);
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  return res.status(200).send(html);
}

function serveOpenAPISpec(req: NextApiRequest, res: NextApiResponse) {
  const spec = generateOpenAPISpec();
  
  // Update server URLs based on current request
  const baseUrl = getBaseUrl(req);
  spec.servers = [
    {
      url: baseUrl,
      description: 'Current API Server'
    },
    ...(spec.servers || [])
  ];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS for spec
  return res.status(200).json(spec);
}

function serveReDocUI(req: NextApiRequest, res: NextApiResponse) {
  const specUrl = `${getBaseUrl(req)}/api/docs/openapi.json`;
  const html = generateReDocHTML(specUrl);
  
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  return res.status(200).send(html);
}

function getBaseUrl(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}

function generateReDocHTML(specUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Ganger Platform API - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Roboto, sans-serif;
    }
    
    .header {
      background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 0;
    }
    
    .header h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 300;
    }
    
    .header p {
      margin: 10px 0 0;
      font-size: 1.1rem;
      opacity: 0.9;
    }
    
    redoc {
      display: block;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 Ganger Platform API</h1>
    <p>Alternative documentation view with ReDoc</p>
  </div>
  
  <redoc spec-url='${specUrl}'></redoc>
  
  <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js"></script>
</body>
</html>
  `.trim();
}

// Helper endpoint to validate OpenAPI specification
export async function validateSpec(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const spec = generateOpenAPISpec();
    
    // Basic validation checks
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[],
      info: {
        title: spec.info.title,
        version: spec.info.version,
        paths_count: Object.keys(spec.paths).length,
        schemas_count: Object.keys(spec.components?.schemas || {}).length,
        servers_count: spec.servers?.length || 0
      }
    };

    // Check for required fields
    if (!spec.info.title) {
      validation.errors.push('Missing required field: info.title');
      validation.valid = false;
    }

    if (!spec.info.version) {
      validation.errors.push('Missing required field: info.version');
      validation.valid = false;
    }

    if (Object.keys(spec.paths).length === 0) {
      validation.warnings.push('No API paths defined');
    }

    // Check for security definitions
    if (!spec.components?.securitySchemes) {
      validation.warnings.push('No security schemes defined');
    }

    return res.status(200).json(validation);
    
  } catch (error) {
    return res.status(500).json({
      valid: false,
      errors: [`Specification generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      info: {}
    });
  }
}
// Cloudflare Workers Edge Runtime
export const runtime = 'edge';
