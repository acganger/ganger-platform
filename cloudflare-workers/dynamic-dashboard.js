// Dynamic Platform Dashboard
export function getDynamicPlatformDashboard() {
  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).substring(7);
  
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎉 Platform Dashboard - Dynamic Worker</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem;
            color: white;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 3rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(to right, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .status-box {
            background: rgba(16, 185, 129, 0.2);
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 2rem;
            margin: 2rem 0;
        }
        .proof-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .proof-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .proof-item h3 {
            color: #a5b4fc;
            margin-bottom: 0.5rem;
        }
        .proof-item p {
            font-family: monospace;
            font-size: 0.9rem;
            word-break: break-all;
        }
        .app-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        .app-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
            transition: transform 0.2s, background 0.2s;
            cursor: pointer;
            text-decoration: none;
            color: white;
            display: block;
        }
        .app-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.2);
        }
        .timestamp {
            background: rgba(0, 0, 0, 0.3);
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Platform Dashboard</h1>
            <p style="font-size: 1.2rem; opacity: 0.9;">Ganger Dermatology - Dynamic Worker Platform</p>
        </div>

        <div class="status-box">
            <h2 style="margin-bottom: 1rem;">✅ Dynamic Content Confirmed!</h2>
            <p>This dashboard is served by a Cloudflare Worker with fresh data on every request.</p>
            <p style="margin-top: 0.5rem;">No static HTML files are involved - this is 100% dynamic!</p>
        </div>

        <div class="proof-grid">
            <div class="proof-item">
                <h3>🕐 Server Time</h3>
                <p class="timestamp">${timestamp}</p>
            </div>
            <div class="proof-item">
                <h3>🎲 Request ID</h3>
                <p class="timestamp">${randomId}</p>
            </div>
            <div class="proof-item">
                <h3>🔢 Random Number</h3>
                <p class="timestamp">${Math.random().toFixed(8)}</p>
            </div>
            <div class="proof-item">
                <h3>⏰ Unix Timestamp</h3>
                <p class="timestamp">${Date.now()}</p>
            </div>
        </div>

        <h2 style="margin-top: 3rem; margin-bottom: 1rem;">🚀 Available Applications</h2>
        
        <div class="app-grid">
            <a href="/inventory" class="app-card">
                <h3>📦 Inventory</h3>
                <p>Manage supplies</p>
            </a>
            <a href="/handouts" class="app-card">
                <h3>📄 Handouts</h3>
                <p>Patient materials</p>
            </a>
            <a href="/l10" class="app-card">
                <h3>🎯 EOS L10</h3>
                <p>Meeting tools</p>
            </a>
            <a href="/status" class="app-card">
                <h3>📊 Status</h3>
                <p>Integration health</p>
            </a>
            <a href="/meds" class="app-card">
                <h3>💊 Medications</h3>
                <p>Auth portal</p>
            </a>
            <a href="/batch" class="app-card">
                <h3>📋 Batch</h3>
                <p>Closeout system</p>
            </a>
            <a href="/staffing" class="app-card">
                <h3>👥 Staffing</h3>
                <p>Clinical schedules</p>
            </a>
            <a href="/compliance" class="app-card">
                <h3>✅ Compliance</h3>
                <p>Training tracking</p>
            </a>
            <a href="/config" class="app-card">
                <h3>⚙️ Config</h3>
                <p>System settings</p>
            </a>
            <a href="/ai-receptionist" class="app-card">
                <h3>🤖 AI Assistant</h3>
                <p>Virtual receptionist</p>
            </a>
            <a href="/call-center" class="app-card">
                <h3>📞 Call Center</h3>
                <p>Operations hub</p>
            </a>
            <a href="/socials" class="app-card">
                <h3>💬 Socials</h3>
                <p>Reviews & media</p>
            </a>
        </div>

        <div style="margin-top: 3rem; text-align: center; opacity: 0.8;">
            <p>Refresh the page to see new timestamps and random values!</p>
            <p style="margin-top: 0.5rem;">
                <button onclick="location.reload()" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid white;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">🔄 Refresh Page</button>
            </p>
        </div>
    </div>

    <script>
        // Update timestamp every second to prove it's dynamic
        setInterval(() => {
            const timestamps = document.querySelectorAll('.timestamp');
            if (timestamps[0]) {
                timestamps[0].textContent = new Date().toISOString();
            }
        }, 1000);
    </script>
</body>
</html>`, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Powered-By': 'Cloudflare Workers',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}