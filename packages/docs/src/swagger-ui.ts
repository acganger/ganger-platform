export function generateSwaggerHTML(specUrl?: string): string {
  const swaggerUIUrl = specUrl || '/api/docs/openapi.json';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ganger Platform API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    
    *, *:before, *:after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    }

    .swagger-ui .topbar {
      background-color: #2c5aa0;
      padding: 8px 0;
    }

    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }

    .header {
      background: linear-gradient(135deg, #2c5aa0 0%, #1e3a6f 100%);
      color: white;
      padding: 20px;
      text-align: center;
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

    .api-info {
      background: white;
      border-left: 4px solid #2c5aa0;
      margin: 20px;
      padding: 20px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .api-info h3 {
      margin-top: 0;
      color: #2c5aa0;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px;
    }

    .feature-card {
      background: white;
      padding: 15px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 3px solid #2c5aa0;
    }

    .feature-card h4 {
      margin: 0 0 10px 0;
      color: #2c5aa0;
      font-size: 1rem;
    }

    .feature-card p {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
      line-height: 1.4;
    }

    #swagger-ui {
      margin: 20px;
    }

    .swagger-ui .info {
      margin: 20px 0;
    }

    .swagger-ui .info .title {
      font-size: 2rem;
      color: #2c5aa0;
    }

    .swagger-ui .scheme-container {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 10px;
      margin: 20px 0;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.5rem;
      }
      
      .header p {
        font-size: 1rem;
      }
      
      .feature-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏥 Ganger Platform API</h1>
    <p>Comprehensive Medical Practice Management System</p>
  </div>

  <div class="api-info">
    <h3>🚀 Welcome to the Ganger Platform API Documentation</h3>
    <p>
      This API provides comprehensive medical practice management capabilities including patient care, 
      medication authorization, inventory management, and staff coordination. All endpoints are secured 
      with JWT authentication and designed to be HIPAA compliant.
    </p>
  </div>

  <div class="feature-grid">
    <div class="feature-card">
      <h4>🔐 Secure Authentication</h4>
      <p>JWT-based authentication with role-based access control and session management.</p>
    </div>
    <div class="feature-card">
      <h4>🏥 Patient Management</h4>
      <p>Complete patient records, medical history, and care coordination.</p>
    </div>
    <div class="feature-card">
      <h4>💊 Medication Authorization</h4>
      <p>AI-powered medication approval workflows with insurance integration.</p>
    </div>
    <div class="feature-card">
      <h4>📦 Inventory Management</h4>
      <p>Medical supply tracking with barcode scanning and automated reordering.</p>
    </div>
    <div class="feature-card">
      <h4>📊 Real-time Monitoring</h4>
      <p>System health monitoring, performance metrics, and automated alerting.</p>
    </div>
    <div class="feature-card">
      <h4>⚡ High Performance</h4>
      <p>Redis caching, rate limiting, and optimized database queries for speed.</p>
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${swaggerUIUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        filter: true,
        requestInterceptor: (request) => {
          // Add any request interceptors here
          return request;
        },
        responseInterceptor: (response) => {
          // Add any response interceptors here
          return response;
        },
        onComplete: () => {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: (err) => {
          console.error('Failed to load Swagger UI:', err);
        },
        docExpansion: "list",
        defaultModelExpandDepth: 2,
        defaultModelsExpandDepth: 1,
        displayOperationId: false,
        displayRequestDuration: true,
        showExtensions: true,
        showCommonExtensions: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        validatorUrl: null, // Disable validator
        persistAuthorization: true,
        // Custom theme
        syntaxHighlight: {
          activate: true,
          theme: "agate"
        }
      });

      // Add custom authorization header
      ui.preauthorizeApiKey('bearerAuth', 'Bearer your-jwt-token-here');
    };
  </script>
</body>
</html>
  `.trim();
}