// 🚀 Ganger Platform - Working Applications Worker
// Serves working applications and coming soon pages for others

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;

    // 📊 Analytics tracking
    if (env.GANGER_ANALYTICS) {
      ctx.waitUntil(
        env.GANGER_ANALYTICS.writeDataPoint({
          blobs: [hostname, pathname, request.method],
          doubles: [Date.now()],
          indexes: [hostname]
        })
      );
    }

    // 🌐 Route based on hostname and path
    const appConfig = getAppConfig(hostname, pathname);
    
    if (!appConfig) {
      return new Response('Application not found', { status: 404 });
    }

    try {
      // 🎯 Check if this is a working deployed app
      if (appConfig.url) {
        // Proxy to the actual deployed application
        const targetUrl = appConfig.url + pathname + url.search;
        
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });

        // 📝 Add security headers
        const headers = new Headers(response.headers);
        headers.set('X-Frame-Options', 'DENY');
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        headers.set('X-Powered-By', 'Ganger Platform v1.0');

        // 🔒 HIPAA compliance headers
        if (appConfig.medical) {
          headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
          headers.set('Content-Security-Policy', "default-src 'self' *.supabase.co *.gangerdermatology.com");
        }

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } else {
        // 🚧 Show coming soon page for apps in development
        return getComingSoonPage(appConfig);
      }

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`Service temporarily unavailable: ${error.message}`, { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};

// 🎯 Application routing configuration
function getAppConfig(hostname, pathname) {
  const routes = {
    // 🏥 Main staff portal with path-based routing
    'staff.gangerdermatology.com': {
      '/': { 
        name: 'Platform Dashboard',
        medical: true, 
        app: 'platform-dashboard',
        url: 'https://ganger-platform-dashboard.vercel.app', // Replace with actual URL when deployed
        status: 'deployed'
      },
      '/inventory': { 
        name: 'Inventory Management',
        medical: true, 
        app: 'inventory',
        status: 'development'
      },
      '/handouts': { 
        name: 'Patient Handouts',
        medical: true, 
        app: 'handouts',
        status: 'development'
      },
      '/staffing': { 
        name: 'Clinical Staffing',
        medical: true, 
        app: 'clinical-staffing',
        status: 'development'
      },
      '/l10': { 
        name: 'EOS L10 Management',
        medical: false, 
        app: 'eos-l10',
        status: 'development'
      },
      '/meds': { 
        name: 'Medication Authorization',
        medical: true, 
        app: 'medication-auth',
        status: 'building'
      },
      '/training': { 
        name: 'Compliance Training',
        medical: true, 
        app: 'compliance-training',
        status: 'development'
      },
      '/ai': { 
        name: 'AI Receptionist',
        medical: true, 
        app: 'ai-receptionist',
        url: 'https://ganger-ai-receptionist.vercel.app', // Replace with actual URL when deployed
        status: 'deployed'
      }
    },
    
    // 💊 Pharmaceutical representatives portal
    'reps.gangerdermatology.com': {
      '/': { 
        name: 'Pharmaceutical Scheduling',
        medical: false, 
        app: 'pharma-scheduling',
        status: 'development'
      }
    },
    
    // 🖥️ Patient check-in kiosk
    'kiosk.gangerdermatology.com': {
      '/': { 
        name: 'Patient Check-in Kiosk',
        medical: true, 
        app: 'checkin-kiosk',
        status: 'development'
      }
    }
  };

  // Find matching route
  const hostRoutes = routes[hostname];
  if (!hostRoutes) return null;

  // Check for exact path match first
  if (hostRoutes[pathname]) {
    return hostRoutes[pathname];
  }

  // Check for path prefix matches (for SPA routing)
  for (const [routePath, config] of Object.entries(hostRoutes)) {
    if (routePath !== '/' && pathname.startsWith(routePath)) {
      return config;
    }
  }

  // Default to root route
  return hostRoutes['/'] || null;
}

// 🚧 Generate coming soon page
function getComingSoonPage(appConfig) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appConfig.name} - Ganger Platform</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 60px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: bold;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 32px;
            font-weight: 600;
        }
        
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 18px;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 30px;
        }
        
        .status.development {
            background: #fef3cd;
            color: #856404;
        }
        
        .status.building {
            background: #d1ecf1;
            color: #0c5460;
        }
        
        .status.testing {
            background: #d4edda;
            color: #155724;
        }
        
        .description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .contact {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            color: #495057;
            font-size: 14px;
        }
        
        .medical-badge {
            background: #e3f2fd;
            color: #1565c0;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">G</div>
        <h1>${appConfig.name}</h1>
        <div class="subtitle">
            Ganger Platform Application
            ${appConfig.medical ? '<span class="medical-badge">HIPAA Compliant</span>' : ''}
        </div>
        <div class="status ${appConfig.status}">${getStatusText(appConfig.status)}</div>
        <div class="description">
            ${getAppDescription(appConfig.app)}
        </div>
        <div class="contact">
            <strong>Coming Soon!</strong><br>
            This application is currently in ${appConfig.status}.<br>
            Contact: <a href="mailto:anand@gangerdermatology.com">anand@gangerdermatology.com</a>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function getStatusText(status) {
  const statusMap = {
    'development': '🚧 In Development',
    'building': '🔨 Building',
    'testing': '🧪 Testing',
    'deployed': '✅ Live'
  };
  return statusMap[status] || '🚧 In Development';
}

function getAppDescription(app) {
  const descriptions = {
    'platform-dashboard': 'Central hub for accessing all Ganger Platform applications and services.',
    'inventory': 'Medical supply tracking with barcode scanning and real-time stock management.',
    'handouts': 'Custom patient education materials with QR scanning and digital delivery.',
    'clinical-staffing': 'Employee scheduling, shift management, and staffing coordination.',
    'eos-l10': 'Team management and productivity tracking using the EOS methodology.',
    'medication-auth': 'Prior authorization management for medications and treatments.',
    'compliance-training': 'HIPAA and medical compliance training platform for staff.',
    'ai-receptionist': 'AI-powered phone system for appointment scheduling and patient communication.',
    'pharma-scheduling': 'Scheduling portal for pharmaceutical representatives.',
    'checkin-kiosk': 'Patient self-service check-in terminal with payment processing.'
  };
  return descriptions[app] || 'Professional medical application for Ganger Dermatology.';
}