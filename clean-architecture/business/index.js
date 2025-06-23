/**
 * Business Apps Worker - Handles all business operations applications
 * Apps: L10, Compliance Training, Clinical Staffing, Social Reviews
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route to appropriate handler
      if (path.startsWith('/l10')) return await handleL10(path, request, env);
      if (path.startsWith('/compliance')) return await handleCompliance(path, request, env);
      if (path.startsWith('/staffing')) return await handleStaffing(path, request, env);
      if (path.startsWith('/socials')) return await handleSocials(path, request, env);
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Business Worker Error:', error);
      return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
  }
};

async function handleL10(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/l10', '') || '/';
  
  // Handle redirects
  if (subpath === '/' || subpath === '') {
    return Response.redirect('https://staff.gangerdermatology.com/l10/compass', 302);
  }
  
  // Handle subroutes
  if (subpath === '/compass' || subpath === '/compass/') {
    const scorecard = Math.floor(Math.random() * 20) + 80;
    return generateHTML(`
      <h1>🧭 EOS L10 - Compass</h1>
      <div class="content">
        <h2>Company Vision</h2>
        <div class="vision-card">
          <h3>Core Values</h3>
          <ul>
            <li>Excellence in Patient Care</li>
            <li>Innovation in Dermatology</li>
            <li>Team Collaboration</li>
            <li>Continuous Improvement</li>
          </ul>
        </div>
        <div class="vision-card">
          <h3>10-Year Target</h3>
          <p>Become the leading dermatology practice in Michigan</p>
        </div>
        <div class="vision-card">
          <h3>Current Scorecard</h3>
          <p class="score">${scorecard}%</p>
        </div>
        <p>Last updated: ${timestamp}</p>
      </div>
    `, 'EOS Compass');
  }
  
  if (subpath === '/rocks' || subpath === '/rocks/') {
    const rocksComplete = Math.floor(Math.random() * 5) + 3;
    return generateHTML(`
      <h1>🪨 EOS L10 - Rocks</h1>
      <div class="content">
        <h2>Q1 2025 Rocks</h2>
        <div class="rocks-list">
          <div class="rock-item ${rocksComplete > 0 ? 'complete' : 'in-progress'}">
            <h3>Implement New EMR System</h3>
            <p>Owner: Dr. Smith</p>
            <p>Status: ${rocksComplete > 0 ? 'Complete' : 'In Progress'}</p>
          </div>
          <div class="rock-item ${rocksComplete > 1 ? 'complete' : 'in-progress'}">
            <h3>Launch Patient Portal 2.0</h3>
            <p>Owner: IT Team</p>
            <p>Status: ${rocksComplete > 1 ? 'Complete' : 'In Progress'}</p>
          </div>
          <div class="rock-item ${rocksComplete > 2 ? 'complete' : 'in-progress'}">
            <h3>Staff Training Program</h3>
            <p>Owner: HR Manager</p>
            <p>Status: ${rocksComplete > 2 ? 'Complete' : 'In Progress'}</p>
          </div>
        </div>
        <p>Progress: ${rocksComplete}/8 Rocks Complete</p>
        <p>Updated: ${timestamp}</p>
      </div>
    `, 'EOS Rocks');
  }
  
  if (subpath === '/scorecard' || subpath === '/scorecard/') {
    return generateHTML(`
      <h1>📊 EOS L10 - Scorecard</h1>
      <div class="content">
        <h2>Weekly Scorecard</h2>
        <table class="scorecard-table">
          <thead>
            <tr>
              <th>Measurable</th>
              <th>Goal</th>
              <th>Week 1</th>
              <th>Week 2</th>
              <th>Week 3</th>
              <th>Week 4</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Patient Visits</td>
              <td>500</td>
              <td class="green">520</td>
              <td class="green">515</td>
              <td class="yellow">495</td>
              <td class="green">510</td>
            </tr>
            <tr>
              <td>New Patients</td>
              <td>50</td>
              <td class="green">55</td>
              <td class="yellow">48</td>
              <td class="green">52</td>
              <td class="green">60</td>
            </tr>
            <tr>
              <td>Patient Satisfaction</td>
              <td>95%</td>
              <td class="green">97%</td>
              <td class="green">96%</td>
              <td class="green">98%</td>
              <td class="green">97%</td>
            </tr>
          </tbody>
        </table>
        <p>Generated: ${timestamp}</p>
      </div>
    `, 'EOS Scorecard');
  }
  
  if (subpath === '/issues' || subpath === '/issues/') {
    const issueCount = Math.floor(Math.random() * 10) + 5;
    return generateHTML(`
      <h1>⚠️ EOS L10 - Issues</h1>
      <div class="content">
        <h2>Issues List (${issueCount} Total)</h2>
        <div class="issues-list">
          <div class="issue-item">
            <h3>Phone System Delays</h3>
            <p>Reported by: Reception Team</p>
            <p>Priority: High</p>
            <button>IDS (Identify, Discuss, Solve)</button>
          </div>
          <div class="issue-item">
            <h3>Parking Lot Capacity</h3>
            <p>Reported by: Patients</p>
            <p>Priority: Medium</p>
            <button>IDS (Identify, Discuss, Solve)</button>
          </div>
          <div class="issue-item">
            <h3>Supply Chain Delays</h3>
            <p>Reported by: Medical Staff</p>
            <p>Priority: High</p>
            <button>IDS (Identify, Discuss, Solve)</button>
          </div>
        </div>
        <p>Last updated: ${timestamp}</p>
      </div>
    `, 'EOS Issues');
  }
  
  // Main L10 page
  return generateHTML(`
    <h1>🎯 EOS L10 Meeting Platform</h1>
    <div class="nav">
      <a href="/l10/compass" class="nav-link">🧭 Compass</a>
      <a href="/l10/rocks" class="nav-link">🪨 Rocks</a>
      <a href="/l10/scorecard" class="nav-link">📊 Scorecard</a>
      <a href="/l10/issues" class="nav-link">⚠️ Issues</a>
    </div>
    <div class="content">
      <p>Entrepreneurial Operating System - Level 10 Meetings</p>
      <p>Next meeting: Tuesday 10:00 AM</p>
      <p>System time: ${timestamp}</p>
    </div>
  `, 'EOS L10');
}

async function handleCompliance(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/compliance', '') || '/';
  
  if (subpath === '/dashboard' || subpath === '/dashboard/') {
    const complianceRate = Math.floor(Math.random() * 10) + 90;
    return generateHTML(`
      <h1>📋 Compliance Dashboard</h1>
      <div class="content">
        <h2>Overall Compliance Rate: ${complianceRate}%</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>HIPAA Training</h3>
            <p class="stat-value">98%</p>
            <p>Complete</p>
          </div>
          <div class="stat-card">
            <h3>OSHA Compliance</h3>
            <p class="stat-value">95%</p>
            <p>Complete</p>
          </div>
          <div class="stat-card">
            <h3>Annual Reviews</h3>
            <p class="stat-value">92%</p>
            <p>Complete</p>
          </div>
        </div>
        <p>Updated: ${timestamp}</p>
      </div>
    `, 'Compliance Dashboard');
  }
  
  if (subpath === '/courses' || subpath === '/courses/') {
    return generateHTML(`
      <h1>📚 Training Courses</h1>
      <div class="content">
        <h2>Required Courses</h2>
        <div class="course-grid">
          <div class="course-card">
            <h3>HIPAA Privacy & Security</h3>
            <p>Duration: 45 minutes</p>
            <p>Due: March 1, 2025</p>
            <button>Start Course</button>
          </div>
          <div class="course-card">
            <h3>Infection Control</h3>
            <p>Duration: 30 minutes</p>
            <p>Due: February 15, 2025</p>
            <button>Start Course</button>
          </div>
          <div class="course-card">
            <h3>Emergency Procedures</h3>
            <p>Duration: 20 minutes</p>
            <p>Due: March 15, 2025</p>
            <button>Start Course</button>
          </div>
        </div>
        <p>Last accessed: ${timestamp}</p>
      </div>
    `, 'Training Courses');
  }
  
  if (subpath === '/reports' || subpath === '/reports/') {
    return generateHTML(`
      <h1>📊 Compliance Reports</h1>
      <div class="content">
        <h2>Generate Reports</h2>
        <div class="report-options">
          <button class="report-btn">Department Compliance Report</button>
          <button class="report-btn">Individual Training History</button>
          <button class="report-btn">Upcoming Expirations</button>
          <button class="report-btn">Annual Compliance Summary</button>
        </div>
        <h3>Recent Reports</h3>
        <ul class="report-list">
          <li>Q4 2024 Compliance Summary - Generated ${new Date(Date.now() - 86400000).toLocaleDateString()}</li>
          <li>HIPAA Training Report - Generated ${new Date(Date.now() - 172800000).toLocaleDateString()}</li>
        </ul>
        <p>Generated: ${timestamp}</p>
      </div>
    `, 'Compliance Reports');
  }
  
  return generateHTML(`
    <h1>📋 Compliance Training</h1>
    <div class="nav">
      <a href="/compliance/dashboard" class="nav-link">📊 Dashboard</a>
      <a href="/compliance/courses" class="nav-link">📚 Courses</a>
      <a href="/compliance/reports" class="nav-link">📈 Reports</a>
    </div>
    <div class="content">
      <p>Manage staff compliance training and certifications</p>
      <p>System time: ${timestamp}</p>
      <div class="alert">
        <h3>⚠️ Upcoming Deadlines</h3>
        <p>${Math.floor(Math.random() * 5) + 3} staff members have training due this month</p>
      </div>
    </div>
  `, 'Compliance Training');
}

async function handleStaffing(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/staffing', '') || '/';
  
  if (subpath === '/schedule-builder' || subpath === '/schedule-builder/') {
    return generateHTML(`
      <h1>📅 Schedule Builder</h1>
      <div class="content">
        <h2>Build Schedule for Week of ${new Date(Date.now() + 604800000).toLocaleDateString()}</h2>
        <div class="schedule-builder">
          <div class="shift-template">
            <h3>Templates</h3>
            <button>Standard Week</button>
            <button>Holiday Week</button>
            <button>Summer Schedule</button>
          </div>
          <div class="staff-list">
            <h3>Available Staff</h3>
            <div class="staff-item">Dr. Smith - 40 hrs available</div>
            <div class="staff-item">Nurse Johnson - 36 hrs available</div>
            <div class="staff-item">MA Williams - 40 hrs available</div>
          </div>
        </div>
        <p>Auto-save enabled: ${timestamp}</p>
      </div>
    `, 'Schedule Builder');
  }
  
  if (subpath === '/requests' || subpath === '/requests/') {
    const requestCount = Math.floor(Math.random() * 10) + 5;
    return generateHTML(`
      <h1>📋 Time-Off Requests</h1>
      <div class="content">
        <h2>Pending Requests (${requestCount})</h2>
        <div class="request-list">
          <div class="request-item">
            <div>
              <h4>Sarah Johnson - Nurse</h4>
              <p>March 15-17, 2025 (3 days)</p>
              <p>Reason: Family vacation</p>
            </div>
            <div class="request-actions">
              <button class="approve">Approve</button>
              <button class="deny">Deny</button>
            </div>
          </div>
          <div class="request-item">
            <div>
              <h4>Mike Chen - Medical Assistant</h4>
              <p>March 22, 2025 (1 day)</p>
              <p>Reason: Medical appointment</p>
            </div>
            <div class="request-actions">
              <button class="approve">Approve</button>
              <button class="deny">Deny</button>
            </div>
          </div>
        </div>
        <p>Last reviewed: ${timestamp}</p>
      </div>
    `, 'Time-Off Requests');
  }
  
  if (subpath === '/analytics' || subpath === '/analytics/') {
    const utilization = Math.floor(Math.random() * 10) + 85;
    return generateHTML(`
      <h1>📊 Staffing Analytics</h1>
      <div class="content">
        <h2>Staffing Metrics</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>Staff Utilization</h3>
            <p class="stat-value">${utilization}%</p>
          </div>
          <div class="stat-card">
            <h3>Overtime Hours</h3>
            <p class="stat-value">${Math.floor(Math.random() * 50) + 20}</p>
            <p>This week</p>
          </div>
          <div class="stat-card">
            <h3>Coverage Rate</h3>
            <p class="stat-value">98.5%</p>
          </div>
          <div class="stat-card">
            <h3>Avg Shift Length</h3>
            <p class="stat-value">8.5 hrs</p>
          </div>
        </div>
        <p>Generated: ${timestamp}</p>
      </div>
    `, 'Staffing Analytics');
  }
  
  return generateHTML(`
    <h1>👥 Clinical Staffing</h1>
    <div class="nav">
      <a href="/staffing/schedule-builder" class="nav-link">📅 Schedule Builder</a>
      <a href="/staffing/requests" class="nav-link">📋 Requests</a>
      <a href="/staffing/analytics" class="nav-link">📊 Analytics</a>
    </div>
    <div class="content">
      <p>Manage clinical staff schedules and assignments</p>
      <p>System time: ${timestamp}</p>
      <div class="quick-stats">
        <h3>Today's Staffing</h3>
        <p>Providers: ${Math.floor(Math.random() * 3) + 5}</p>
        <p>Nurses: ${Math.floor(Math.random() * 5) + 8}</p>
        <p>Medical Assistants: ${Math.floor(Math.random() * 4) + 6}</p>
      </div>
    </div>
  `, 'Clinical Staffing');
}

async function handleSocials(path, request, env) {
  const timestamp = new Date().toISOString();
  const subpath = path.replace('/socials', '') || '/';
  
  if (subpath === '/dashboard' || subpath === '/dashboard/') {
    const reviews = Math.floor(Math.random() * 50) + 150;
    const rating = (Math.random() * 0.5 + 4.3).toFixed(1);
    return generateHTML(`
      <h1>📱 Social Media Dashboard</h1>
      <div class="content">
        <h2>Overview</h2>
        <div class="stats">
          <div class="stat-card">
            <h3>Total Reviews</h3>
            <p class="stat-value">${reviews}</p>
          </div>
          <div class="stat-card">
            <h3>Average Rating</h3>
            <p class="stat-value">⭐ ${rating}</p>
          </div>
          <div class="stat-card">
            <h3>Response Rate</h3>
            <p class="stat-value">95%</p>
          </div>
          <div class="stat-card">
            <h3>New This Week</h3>
            <p class="stat-value">${Math.floor(Math.random() * 10) + 5}</p>
          </div>
        </div>
        <h3>Recent Activity</h3>
        <div class="activity-feed">
          <div class="activity-item">
            <p><strong>Google Review</strong> - 5 stars - 2 hours ago</p>
            <p>"Excellent care and friendly staff!"</p>
          </div>
          <div class="activity-item">
            <p><strong>Facebook Comment</strong> - 4 hours ago</p>
            <p>"When are you open on weekends?"</p>
          </div>
        </div>
        <p>Updated: ${timestamp}</p>
      </div>
    `, 'Social Media Dashboard');
  }
  
  if (subpath === '/respond' || subpath === '/respond/') {
    const pending = Math.floor(Math.random() * 5) + 3;
    return generateHTML(`
      <h1>💬 Respond to Reviews</h1>
      <div class="content">
        <h2>Pending Responses (${pending})</h2>
        <div class="review-list">
          <div class="review-item">
            <div class="review-header">
              <strong>Google Review</strong> - ⭐⭐⭐⭐⭐
              <span>2 hours ago</span>
            </div>
            <p class="review-text">"Dr. Ganger and his team are amazing! They really care about their patients."</p>
            <textarea placeholder="Type your response..."></textarea>
            <button>Send Response</button>
          </div>
          <div class="review-item">
            <div class="review-header">
              <strong>Yelp Review</strong> - ⭐⭐⭐⭐
              <span>5 hours ago</span>
            </div>
            <p class="review-text">"Great experience but wait time was a bit long."</p>
            <textarea placeholder="Type your response..."></textarea>
            <button>Send Response</button>
          </div>
        </div>
        <p>Last checked: ${timestamp}</p>
      </div>
    `, 'Respond to Reviews');
  }
  
  if (subpath === '/analytics' || subpath === '/analytics/') {
    return generateHTML(`
      <h1>📈 Social Analytics</h1>
      <div class="content">
        <h2>Performance Metrics</h2>
        <div class="analytics-grid">
          <div class="metric-card">
            <h3>Review Growth</h3>
            <p>+${Math.floor(Math.random() * 20) + 10}% this month</p>
          </div>
          <div class="metric-card">
            <h3>Engagement Rate</h3>
            <p>${(Math.random() * 5 + 3).toFixed(1)}%</p>
          </div>
          <div class="metric-card">
            <h3>Sentiment Score</h3>
            <p>92% Positive</p>
          </div>
        </div>
        <h3>Platform Breakdown</h3>
        <table class="platform-table">
          <tr>
            <th>Platform</th>
            <th>Reviews</th>
            <th>Avg Rating</th>
            <th>Response Rate</th>
          </tr>
          <tr>
            <td>Google</td>
            <td>${Math.floor(Math.random() * 100) + 200}</td>
            <td>4.8</td>
            <td>98%</td>
          </tr>
          <tr>
            <td>Facebook</td>
            <td>${Math.floor(Math.random() * 50) + 100}</td>
            <td>4.7</td>
            <td>95%</td>
          </tr>
          <tr>
            <td>Yelp</td>
            <td>${Math.floor(Math.random() * 30) + 50}</td>
            <td>4.5</td>
            <td>90%</td>
          </tr>
        </table>
        <p>Report generated: ${timestamp}</p>
      </div>
    `, 'Social Analytics');
  }
  
  return generateHTML(`
    <h1>📱 Social Media & Reviews</h1>
    <div class="nav">
      <a href="/socials/dashboard" class="nav-link">📊 Dashboard</a>
      <a href="/socials/respond" class="nav-link">💬 Respond</a>
      <a href="/socials/analytics" class="nav-link">📈 Analytics</a>
    </div>
    <div class="content">
      <p>Manage online reputation and social media presence</p>
      <p>System time: ${timestamp}</p>
      <div class="alert">
        <h3>🔔 Action Required</h3>
        <p>${Math.floor(Math.random() * 5) + 2} reviews need responses</p>
      </div>
    </div>
  `, 'Social Media & Reviews');
}

function generateHTML(content, title) {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Ganger Business</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        h1 { 
          background: #2e7d32;
          color: white;
          padding: 1.5rem;
          font-size: 1.75rem;
        }
        h2 {
          color: #1b5e20;
          margin-bottom: 1rem;
        }
        .nav {
          background: #fff;
          padding: 1rem;
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid #e0e0e0;
        }
        .nav-link {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          text-decoration: none;
          color: #333;
          border-radius: 4px;
          transition: all 0.3s;
        }
        .nav-link:hover {
          background: #2e7d32;
          color: white;
        }
        .content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }
        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          text-align: center;
        }
        .stat-card h3 {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #2e7d32;
        }
        .vision-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        .vision-card h3 {
          color: #1b5e20;
          margin-bottom: 0.5rem;
        }
        .vision-card ul {
          list-style: none;
          padding-left: 0;
        }
        .vision-card li {
          padding: 0.25rem 0;
          border-bottom: 1px solid #eee;
        }
        .score {
          font-size: 3rem;
          font-weight: bold;
          color: #2e7d32;
          text-align: center;
        }
        .rocks-list {
          display: grid;
          gap: 1rem;
        }
        .rock-item {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #ddd;
        }
        .rock-item.complete {
          border-left-color: #4caf50;
        }
        .rock-item.in-progress {
          border-left-color: #ff9800;
        }
        .scorecard-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .scorecard-table th, .scorecard-table td {
          padding: 0.75rem;
          text-align: center;
          border-bottom: 1px solid #eee;
        }
        .scorecard-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .scorecard-table .green {
          color: #4caf50;
          font-weight: bold;
        }
        .scorecard-table .yellow {
          color: #ff9800;
          font-weight: bold;
        }
        .scorecard-table .red {
          color: #f44336;
          font-weight: bold;
        }
        .issues-list, .course-grid {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }
        .issue-item, .course-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .issue-item button, .course-card button {
          background: #2e7d32;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .alert {
          background: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }
        .alert h3 {
          color: #856404;
          margin-bottom: 0.5rem;
        }
        .report-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .report-btn {
          background: white;
          border: 2px solid #2e7d32;
          color: #2e7d32;
          padding: 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }
        .report-btn:hover {
          background: #2e7d32;
          color: white;
        }
        .report-list {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          list-style: none;
        }
        .report-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
        }
        .schedule-builder {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          margin-top: 1rem;
        }
        .shift-template button {
          display: block;
          width: 100%;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          background: #f0f0f0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .staff-list {
          background: white;
          padding: 1rem;
          border-radius: 8px;
        }
        .staff-item {
          padding: 0.5rem;
          border-bottom: 1px solid #eee;
        }
        .request-list {
          display: grid;
          gap: 1rem;
        }
        .request-item {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .request-actions {
          display: flex;
          gap: 0.5rem;
        }
        .request-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        .approve {
          background: #4caf50;
          color: white;
        }
        .deny {
          background: #f44336;
          color: white;
        }
        .activity-feed, .review-list {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }
        .activity-item, .review-item {
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .review-text {
          font-style: italic;
          margin: 0.5rem 0;
        }
        .review-item textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          min-height: 80px;
          margin: 0.5rem 0;
        }
        .review-item button {
          background: #2e7d32;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
        }
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .metric-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .platform-table {
          width: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .platform-table th, .platform-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        .platform-table th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .quick-stats {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
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