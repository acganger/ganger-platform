/**
 * Patient Portal Worker - Handles all external patient-facing domains
 * Domains: handouts.*, kiosk.*, meds.*, reps.*
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const path = url.pathname;
    
    try {
      // Route based on domain
      if (hostname === 'handouts.gangerdermatology.com') {
        return await handlePatientHandouts(path, request, env);
      }
      if (hostname === 'kiosk.gangerdermatology.com') {
        return await handlePatientKiosk(path, request, env);
      }
      if (hostname === 'meds.gangerdermatology.com') {
        return await handlePatientMeds(path, request, env);
      }
      if (hostname === 'reps.gangerdermatology.com') {
        return await handleRepsPortal(path, request, env);
      }
      
      return new Response('Domain not configured', { status: 404 });
    } catch (error) {
      console.error('Portal Worker Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }
};

async function handlePatientHandouts(path, request, env) {
  const timestamp = new Date().toISOString();
  
  // Handle QR code redirect
  if (path.startsWith('/qr/')) {
    const handoutId = path.split('/')[2];
    return generateHTML(`
      <h1>📄 Your Medical Handout</h1>
      <div class="content">
        <div class="handout-viewer">
          <h2>Loading your personalized handout...</h2>
          <p>Handout ID: ${handoutId}</p>
          <p>Generated for you on: ${new Date().toLocaleDateString()}</p>
          <div class="loading-spinner">⏳</div>
          <p class="info">This handout was prepared specifically for you by your healthcare provider.</p>
        </div>
        <div class="actions">
          <button class="btn primary">Download PDF</button>
          <button class="btn">Email to Me</button>
          <button class="btn">Print</button>
        </div>
      </div>
    `, 'Patient Handout', 'patient');
  }
  
  // Main handouts page
  return generateHTML(`
    <h1>📋 Ganger Dermatology - Patient Handouts</h1>
    <div class="content">
      <div class="welcome-box">
        <h2>Access Your Medical Information</h2>
        <p>Your healthcare provider has prepared educational materials specifically for you.</p>
      </div>
      
      <div class="access-methods">
        <div class="method-card">
          <span class="icon">📱</span>
          <h3>Scan QR Code</h3>
          <p>Use the QR code provided by your doctor to access your personalized handout</p>
          <button class="btn">Open Camera</button>
        </div>
        
        <div class="method-card">
          <span class="icon">🔑</span>
          <h3>Enter Access Code</h3>
          <p>Type the access code from your visit summary</p>
          <input type="text" placeholder="Enter code (e.g., ABC123)" />
          <button class="btn">Access Handout</button>
        </div>
        
        <div class="method-card">
          <span class="icon">📧</span>
          <h3>Check Your Email</h3>
          <p>We may have sent your handout link via email</p>
          <button class="btn">Resend Email</button>
        </div>
      </div>
      
      <div class="info-section">
        <h3>Popular Educational Resources</h3>
        <div class="resource-list">
          <a href="#" class="resource-link">Acne Treatment Guide</a>
          <a href="#" class="resource-link">Sun Protection Tips</a>
          <a href="#" class="resource-link">Eczema Management</a>
          <a href="#" class="resource-link">Skin Cancer Prevention</a>
          <a href="#" class="resource-link">Post-Procedure Care</a>
        </div>
      </div>
      
      <p class="timestamp">System updated: ${timestamp}</p>
    </div>
  `, 'Patient Handouts Portal', 'patient');
}

async function handlePatientKiosk(path, request, env) {
  const timestamp = new Date().toISOString();
  const waitTime = Math.floor(Math.random() * 15) + 5;
  
  // Check-in flow
  if (path === '/checkin' || path === '/checkin/') {
    return generateHTML(`
      <h1>✅ Check In for Your Appointment</h1>
      <div class="content kiosk-content">
        <div class="checkin-flow">
          <div class="progress-bar">
            <div class="progress-step active">1. Verify</div>
            <div class="progress-step">2. Update</div>
            <div class="progress-step">3. Payment</div>
            <div class="progress-step">4. Complete</div>
          </div>
          
          <div class="checkin-form">
            <h2>Please verify your information:</h2>
            <div class="form-group">
              <label>Date of Birth:</label>
              <input type="date" />
            </div>
            <div class="form-group">
              <label>Last Name:</label>
              <input type="text" />
            </div>
            <button class="btn primary large">Continue →</button>
          </div>
        </div>
      </div>
    `, 'Patient Check-In', 'kiosk');
  }
  
  // Main kiosk page
  return generateHTML(`
    <h1>👋 Welcome to Ganger Dermatology</h1>
    <div class="content kiosk-content">
      <div class="kiosk-welcome">
        <h2>Self-Service Check-In</h2>
        <p class="wait-time">Current wait time: Approximately ${waitTime} minutes</p>
      </div>
      
      <div class="kiosk-options">
        <button class="kiosk-btn primary">
          <span class="btn-icon">📋</span>
          <span class="btn-text">Check In for Appointment</span>
        </button>
        
        <button class="kiosk-btn">
          <span class="btn-icon">💳</span>
          <span class="btn-text">Make a Payment</span>
        </button>
        
        <button class="kiosk-btn">
          <span class="btn-icon">📄</span>
          <span class="btn-text">Update Information</span>
        </button>
        
        <button class="kiosk-btn">
          <span class="btn-icon">❓</span>
          <span class="btn-text">Need Help</span>
        </button>
      </div>
      
      <div class="kiosk-footer">
        <p>For assistance, please see our front desk staff</p>
        <p class="timestamp">${timestamp}</p>
      </div>
    </div>
  `, 'Check-In Kiosk', 'kiosk');
}

async function handlePatientMeds(path, request, env) {
  const timestamp = new Date().toISOString();
  
  // Authorization request form
  if (path === '/request' || path === '/request/') {
    return generateHTML(`
      <h1>💊 Request Medication Authorization</h1>
      <div class="content">
        <div class="auth-form">
          <h2>Submit Authorization Request</h2>
          <p>Please fill out this form to request medication authorization from your provider.</p>
          
          <form class="medication-form">
            <div class="form-group">
              <label>Patient Information</label>
              <input type="text" placeholder="First Name" required />
              <input type="text" placeholder="Last Name" required />
              <input type="date" placeholder="Date of Birth" required />
            </div>
            
            <div class="form-group">
              <label>Contact Information</label>
              <input type="tel" placeholder="Phone Number" required />
              <input type="email" placeholder="Email Address" required />
            </div>
            
            <div class="form-group">
              <label>Medication Details</label>
              <input type="text" placeholder="Medication Name" required />
              <input type="text" placeholder="Dosage" />
              <select>
                <option>Select Pharmacy</option>
                <option>CVS Pharmacy - Main St</option>
                <option>Walgreens - Downtown</option>
                <option>Rite Aid - North Ave</option>
                <option>Other (specify below)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Additional Information</label>
              <textarea placeholder="Any allergies, previous reactions, or special instructions"></textarea>
            </div>
            
            <button type="submit" class="btn primary">Submit Request</button>
          </form>
        </div>
      </div>
    `, 'Medication Request', 'patient');
  }
  
  // Main medication portal
  return generateHTML(`
    <h1>💊 Medication Authorization Portal</h1>
    <div class="content">
      <div class="welcome-box">
        <h2>Request Medication Authorizations</h2>
        <p>Submit medication authorization requests directly to your dermatology provider.</p>
      </div>
      
      <div class="portal-options">
        <div class="option-card">
          <h3>New Authorization Request</h3>
          <p>Submit a new medication authorization request</p>
          <a href="/request" class="btn primary">Start Request</a>
        </div>
        
        <div class="option-card">
          <h3>Check Request Status</h3>
          <p>View the status of your pending requests</p>
          <button class="btn">Check Status</button>
        </div>
        
        <div class="option-card">
          <h3>Refill Request</h3>
          <p>Request a refill for existing medications</p>
          <button class="btn">Request Refill</button>
        </div>
      </div>
      
      <div class="info-box">
        <h3>Important Information</h3>
        <ul>
          <li>Authorization requests are typically processed within 24-48 hours</li>
          <li>Urgent requests should be called in to our office</li>
          <li>Please have your pharmacy information ready</li>
          <li>Insurance information may be required for certain medications</li>
        </ul>
      </div>
      
      <div class="contact-info">
        <h3>Need Help?</h3>
        <p>Office Hours: Monday-Friday, 8:00 AM - 5:00 PM</p>
        <p>Phone: (248) 555-0123</p>
        <p>For emergencies, please call 911</p>
      </div>
      
      <p class="timestamp">Portal updated: ${timestamp}</p>
    </div>
  `, 'Medication Portal', 'patient');
}

async function handleRepsPortal(path, request, env) {
  const timestamp = new Date().toISOString();
  
  // Rep scheduling
  if (path === '/schedule' || path === '/schedule/') {
    return generateHTML(`
      <h1>📅 Schedule a Visit</h1>
      <div class="content">
        <div class="scheduling-form">
          <h2>Request Provider Meeting</h2>
          <p>Please submit your visit request. Appointments are subject to provider availability.</p>
          
          <form class="rep-form">
            <div class="form-group">
              <label>Company Information</label>
              <input type="text" placeholder="Company Name" required />
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Email Address" required />
              <input type="tel" placeholder="Phone Number" required />
            </div>
            
            <div class="form-group">
              <label>Visit Details</label>
              <select required>
                <option>Select Visit Type</option>
                <option>Product Presentation</option>
                <option>New Product Launch</option>
                <option>Educational Session</option>
                <option>Sample Drop-off</option>
              </select>
              <select required>
                <option>Preferred Provider</option>
                <option>Any Available Provider</option>
                <option>Dr. Ganger</option>
                <option>Dr. Smith</option>
                <option>Nursing Staff</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Preferred Dates (select up to 3)</label>
              <input type="date" min="${new Date().toISOString().split('T')[0]}" />
              <input type="date" min="${new Date().toISOString().split('T')[0]}" />
              <input type="date" min="${new Date().toISOString().split('T')[0]}" />
            </div>
            
            <div class="form-group">
              <label>Additional Information</label>
              <textarea placeholder="Products to discuss, special requirements, etc."></textarea>
            </div>
            
            <button type="submit" class="btn primary">Submit Request</button>
          </form>
        </div>
      </div>
    `, 'Schedule Visit', 'rep');
  }
  
  // Main rep portal
  return generateHTML(`
    <h1>💼 Pharmaceutical Representative Portal</h1>
    <div class="content">
      <div class="welcome-box">
        <h2>Welcome to Ganger Dermatology</h2>
        <p>Schedule visits with our providers and access important information.</p>
      </div>
      
      <div class="rep-options">
        <div class="option-card">
          <h3>📅 Schedule a Visit</h3>
          <p>Request an appointment with our providers</p>
          <a href="/schedule" class="btn primary">Schedule Now</a>
        </div>
        
        <div class="option-card">
          <h3>📋 Visit Guidelines</h3>
          <p>Review our policies for pharmaceutical visits</p>
          <button class="btn">View Guidelines</button>
        </div>
        
        <div class="option-card">
          <h3>📞 Contact Information</h3>
          <p>Get in touch with our office</p>
          <button class="btn">Contact Us</button>
        </div>
      </div>
      
      <div class="guidelines-preview">
        <h3>Visit Guidelines Summary</h3>
        <ul>
          <li>All visits must be scheduled in advance - no walk-ins</li>
          <li>Maximum visit duration: 30 minutes</li>
          <li>Lunch presentations: Tuesdays only, 12:00-1:00 PM</li>
          <li>Sample drop-offs: Please coordinate with nursing staff</li>
          <li>Educational materials must be approved prior to distribution</li>
          <li>Visits may be rescheduled based on patient care needs</li>
        </ul>
      </div>
      
      <div class="office-info">
        <h3>Office Locations</h3>
        <div class="location-cards">
          <div class="location">
            <h4>Ann Arbor Office</h4>
            <p>123 Medical Center Dr<br>Ann Arbor, MI 48109</p>
          </div>
          <div class="location">
            <h4>Plymouth Office</h4>
            <p>456 Healthcare Blvd<br>Plymouth, MI 48170</p>
          </div>
          <div class="location">
            <h4>Wixom Office</h4>
            <p>789 Dermatology Way<br>Wixom, MI 48393</p>
          </div>
        </div>
      </div>
      
      <p class="timestamp">Portal updated: ${timestamp}</p>
    </div>
  `, 'Pharma Rep Portal', 'rep');
}

function generateHTML(content, title, theme = 'default') {
  const themeColors = {
    default: { primary: '#5e35b1', secondary: '#4527a0' },
    patient: { primary: '#1e88e5', secondary: '#1565c0' },
    kiosk: { primary: '#00acc1', secondary: '#00838f' },
    rep: { primary: '#43a047', secondary: '#2e7d32' }
  };
  
  const colors = themeColors[theme] || themeColors.default;
  
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Ganger Dermatology</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        h1 { 
          background: ${colors.primary};
          color: white;
          padding: 1.5rem;
          font-size: 1.75rem;
          text-align: center;
        }
        h2 {
          color: ${colors.secondary};
          margin-bottom: 1rem;
        }
        h3 {
          color: #333;
          margin: 1.5rem 0 0.5rem;
        }
        .content {
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .content.kiosk-content {
          max-width: 800px;
          text-align: center;
        }
        .welcome-box {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
          text-align: center;
        }
        .access-methods, .portal-options, .rep-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .method-card, .option-card {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .method-card .icon, .btn-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 1rem;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          margin-top: 1rem;
          background: #f0f0f0;
          color: #333;
          transition: all 0.3s;
        }
        .btn:hover {
          background: #e0e0e0;
        }
        .btn.primary {
          background: ${colors.primary};
          color: white;
        }
        .btn.primary:hover {
          background: ${colors.secondary};
        }
        .btn.large {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }
        input[type="text"], input[type="email"], input[type="tel"], 
        input[type="date"], select, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          margin-top: 0.5rem;
        }
        textarea {
          min-height: 100px;
          resize: vertical;
        }
        .info-section {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          margin-top: 2rem;
        }
        .resource-list {
          display: grid;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .resource-link {
          padding: 0.75rem;
          background: #f8f8f8;
          border-radius: 4px;
          text-decoration: none;
          color: ${colors.primary};
          transition: all 0.3s;
        }
        .resource-link:hover {
          background: ${colors.primary};
          color: white;
        }
        .timestamp {
          text-align: center;
          color: #666;
          font-size: 0.875rem;
          margin-top: 2rem;
        }
        .handout-viewer {
          background: white;
          padding: 3rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
          margin-bottom: 2rem;
        }
        .loading-spinner {
          font-size: 3rem;
          margin: 2rem 0;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .info {
          color: #666;
          font-style: italic;
          margin-top: 1rem;
        }
        .kiosk-welcome {
          margin-bottom: 3rem;
        }
        .wait-time {
          font-size: 1.25rem;
          color: ${colors.primary};
          margin-top: 0.5rem;
        }
        .kiosk-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .kiosk-btn {
          background: white;
          border: 3px solid ${colors.primary};
          padding: 2rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 1rem;
        }
        .kiosk-btn:hover {
          background: ${colors.primary};
          color: white;
        }
        .kiosk-btn.primary {
          background: ${colors.primary};
          color: white;
        }
        .kiosk-btn.primary:hover {
          background: ${colors.secondary};
        }
        .btn-text {
          display: block;
          margin-top: 0.5rem;
          font-weight: 500;
        }
        .kiosk-footer {
          text-align: center;
          color: #666;
          margin-top: 3rem;
        }
        .progress-bar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          padding: 0 2rem;
        }
        .progress-step {
          flex: 1;
          text-align: center;
          padding: 1rem 0.5rem;
          border-bottom: 3px solid #ddd;
          color: #999;
        }
        .progress-step.active {
          border-bottom-color: ${colors.primary};
          color: ${colors.primary};
          font-weight: 500;
        }
        .checkin-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-width: 500px;
          margin: 0 auto;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #555;
        }
        .auth-form, .medication-form, .scheduling-form, .rep-form {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-width: 600px;
          margin: 0 auto;
        }
        .info-box {
          background: #f8f9fa;
          border-left: 4px solid ${colors.primary};
          padding: 1.5rem;
          border-radius: 4px;
          margin: 2rem 0;
        }
        .info-box ul {
          list-style-position: inside;
          color: #666;
          margin-top: 0.5rem;
        }
        .contact-info {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          text-align: center;
          margin-top: 2rem;
        }
        .guidelines-preview {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin: 2rem 0;
        }
        .guidelines-preview ul {
          list-style-position: inside;
          color: #666;
          margin-top: 1rem;
        }
        .office-info {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 8px;
          margin-top: 2rem;
        }
        .location-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }
        .location {
          background: white;
          padding: 1.5rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .location h4 {
          color: ${colors.primary};
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}