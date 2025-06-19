/**
 * API Gateway Worker - Handles all API endpoints
 * Provides centralized API access for all platform services
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json'
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // API Version routing
      if (path.startsWith('/api/v1') || path.startsWith('/v1')) {
        return await handleV1API(path.replace(/^\/(api\/)?v1/, ''), request, env, corsHeaders);
      }
      
      // Legacy API support
      if (path.startsWith('/api')) {
        return await handleV1API(path.replace('/api', ''), request, env, corsHeaders);
      }
      
      // Default to v1
      return await handleV1API(path, request, env, corsHeaders);
      
    } catch (error) {
      console.error('API Worker Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

async function handleV1API(path, request, env, headers) {
  const method = request.method;
  
  // Health check
  if (path === '/health' || path === '/') {
    return jsonResponse({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        auth: 'operational',
        storage: 'operational',
        email: 'operational'
      }
    }, headers);
  }
  
  // Authentication endpoints
  if (path.startsWith('/auth')) {
    return handleAuth(path, method, request, env, headers);
  }
  
  // Patient endpoints
  if (path.startsWith('/patients')) {
    return handlePatients(path, method, request, env, headers);
  }
  
  // Appointments endpoints
  if (path.startsWith('/appointments')) {
    return handleAppointments(path, method, request, env, headers);
  }
  
  // Inventory endpoints
  if (path.startsWith('/inventory')) {
    return handleInventory(path, method, request, env, headers);
  }
  
  // Handouts endpoints
  if (path.startsWith('/handouts')) {
    return handleHandouts(path, method, request, env, headers);
  }
  
  // Medications endpoints
  if (path.startsWith('/medications')) {
    return handleMedications(path, method, request, env, headers);
  }
  
  // Staff endpoints
  if (path.startsWith('/staff')) {
    return handleStaff(path, method, request, env, headers);
  }
  
  // Analytics endpoints
  if (path.startsWith('/analytics')) {
    return handleAnalytics(path, method, request, env, headers);
  }
  
  // Webhooks
  if (path.startsWith('/webhooks')) {
    return handleWebhooks(path, method, request, env, headers);
  }
  
  return jsonResponse({
    error: 'Not Found',
    message: `Endpoint ${path} not found`,
    available_endpoints: [
      '/health',
      '/auth/*',
      '/patients/*',
      '/appointments/*',
      '/inventory/*',
      '/handouts/*',
      '/medications/*',
      '/staff/*',
      '/analytics/*',
      '/webhooks/*'
    ]
  }, headers, 404);
}

// Auth handlers
async function handleAuth(path, method, request, env, headers) {
  const subpath = path.replace('/auth', '');
  
  if (subpath === '/login' && method === 'POST') {
    const body = await request.json();
    // TODO: Implement actual authentication
    return jsonResponse({
      success: true,
      token: 'mock-jwt-token',
      user: {
        id: '123',
        email: body.email,
        role: 'staff'
      },
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }, headers);
  }
  
  if (subpath === '/logout' && method === 'POST') {
    return jsonResponse({
      success: true,
      message: 'Logged out successfully'
    }, headers);
  }
  
  if (subpath === '/refresh' && method === 'POST') {
    return jsonResponse({
      success: true,
      token: 'new-mock-jwt-token',
      expires_at: new Date(Date.now() + 86400000).toISOString()
    }, headers);
  }
  
  return jsonResponse({
    error: 'Method not allowed',
    allowed_methods: ['POST']
  }, headers, 405);
}

// Patient handlers
async function handlePatients(path, method, request, env, headers) {
  const subpath = path.replace('/patients', '');
  
  if (subpath === '' && method === 'GET') {
    // List patients
    return jsonResponse({
      patients: [
        {
          id: '1',
          name: 'John Doe',
          dob: '1980-01-15',
          last_visit: '2025-01-10',
          next_appointment: '2025-02-15'
        },
        {
          id: '2',
          name: 'Jane Smith',
          dob: '1975-05-20',
          last_visit: '2025-01-05',
          next_appointment: '2025-01-25'
        }
      ],
      total: 2,
      page: 1,
      per_page: 20
    }, headers);
  }
  
  if (subpath.match(/^\/\d+$/) && method === 'GET') {
    // Get specific patient
    const patientId = subpath.substring(1);
    return jsonResponse({
      id: patientId,
      name: 'John Doe',
      dob: '1980-01-15',
      email: 'john.doe@email.com',
      phone: '(248) 555-0123',
      address: '123 Main St, Plymouth, MI 48170',
      insurance: {
        provider: 'Blue Cross',
        policy_number: 'BC123456'
      },
      medical_history: ['Acne', 'Eczema'],
      last_visit: '2025-01-10',
      next_appointment: '2025-02-15'
    }, headers);
  }
  
  if (subpath === '' && method === 'POST') {
    // Create new patient
    const body = await request.json();
    return jsonResponse({
      success: true,
      patient: {
        id: '3',
        ...body,
        created_at: new Date().toISOString()
      }
    }, headers, 201);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Appointment handlers
async function handleAppointments(path, method, request, env, headers) {
  const subpath = path.replace('/appointments', '');
  
  if (subpath === '' && method === 'GET') {
    const today = new Date().toISOString().split('T')[0];
    return jsonResponse({
      appointments: [
        {
          id: '101',
          patient_id: '1',
          patient_name: 'John Doe',
          provider: 'Dr. Ganger',
          date: today,
          time: '10:00 AM',
          type: 'Follow-up',
          status: 'confirmed'
        },
        {
          id: '102',
          patient_id: '2',
          patient_name: 'Jane Smith',
          provider: 'Dr. Smith',
          date: today,
          time: '2:00 PM',
          type: 'Consultation',
          status: 'confirmed'
        }
      ],
      total: 2,
      date: today
    }, headers);
  }
  
  if (subpath === '/available' && method === 'GET') {
    const slots = [];
    const baseTime = new Date();
    baseTime.setHours(9, 0, 0, 0);
    
    for (let i = 0; i < 8; i++) {
      const slotTime = new Date(baseTime.getTime() + i * 3600000);
      slots.push({
        date: slotTime.toISOString().split('T')[0],
        time: slotTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        provider: 'Dr. Ganger',
        available: Math.random() > 0.3
      });
    }
    
    return jsonResponse({ slots }, headers);
  }
  
  if (subpath === '' && method === 'POST') {
    const body = await request.json();
    return jsonResponse({
      success: true,
      appointment: {
        id: '103',
        ...body,
        status: 'confirmed',
        confirmation_code: 'APT' + Math.floor(Math.random() * 10000),
        created_at: new Date().toISOString()
      }
    }, headers, 201);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Inventory handlers
async function handleInventory(path, method, request, env, headers) {
  const subpath = path.replace('/inventory', '');
  
  if (subpath === '/items' && method === 'GET') {
    return jsonResponse({
      items: [
        {
          id: '1001',
          name: 'Nitrile Gloves - Medium',
          category: 'PPE',
          quantity: 5000,
          unit: 'pieces',
          reorder_level: 1000,
          status: 'in_stock'
        },
        {
          id: '1002',
          name: 'Surgical Masks',
          category: 'PPE',
          quantity: 500,
          unit: 'pieces',
          reorder_level: 200,
          status: 'low_stock'
        },
        {
          id: '1003',
          name: 'Hand Sanitizer',
          category: 'Hygiene',
          quantity: 50,
          unit: 'bottles',
          reorder_level: 20,
          status: 'in_stock'
        }
      ],
      total: 3,
      low_stock_count: 1
    }, headers);
  }
  
  if (subpath === '/scan' && method === 'POST') {
    const body = await request.json();
    return jsonResponse({
      success: true,
      item: {
        barcode: body.barcode,
        name: 'Bandages - 2x2',
        quantity: 100,
        location: 'Storage Room A',
        expiry: '2026-12-31'
      }
    }, headers);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Handout handlers
async function handleHandouts(path, method, request, env, headers) {
  const subpath = path.replace('/handouts', '');
  
  if (subpath === '/generate' && method === 'POST') {
    const body = await request.json();
    return jsonResponse({
      success: true,
      handout: {
        id: 'H' + Math.floor(Math.random() * 100000),
        type: body.type || 'Acne Treatment',
        patient_id: body.patient_id,
        access_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        qr_code: `https://handouts.gangerdermatology.com/qr/${Date.now()}`,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString()
      }
    }, headers, 201);
  }
  
  if (subpath.match(/^\/verify\/\w+$/) && method === 'GET') {
    const code = subpath.split('/')[2];
    return jsonResponse({
      valid: true,
      handout: {
        type: 'Post-Procedure Care',
        patient_name: 'John Doe',
        created_date: new Date(Date.now() - 86400000).toISOString(),
        content_url: '/content/post-procedure-care.pdf'
      }
    }, headers);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Medication handlers
async function handleMedications(path, method, request, env, headers) {
  const subpath = path.replace('/medications', '');
  
  if (subpath === '/authorizations' && method === 'GET') {
    return jsonResponse({
      authorizations: [
        {
          id: 'AUTH001',
          patient_name: 'John Doe',
          medication: 'Tretinoin 0.025%',
          status: 'pending',
          requested_date: new Date(Date.now() - 86400000).toISOString(),
          provider: 'Dr. Ganger'
        },
        {
          id: 'AUTH002',
          patient_name: 'Jane Smith',
          medication: 'Doxycycline 100mg',
          status: 'approved',
          requested_date: new Date(Date.now() - 172800000).toISOString(),
          approved_date: new Date(Date.now() - 86400000).toISOString(),
          provider: 'Dr. Smith'
        }
      ],
      pending_count: 1,
      total: 2
    }, headers);
  }
  
  if (subpath === '/authorize' && method === 'POST') {
    const body = await request.json();
    return jsonResponse({
      success: true,
      authorization: {
        id: 'AUTH003',
        ...body,
        status: 'approved',
        approved_by: 'Dr. Ganger',
        approved_at: new Date().toISOString(),
        pharmacy_notified: true
      }
    }, headers);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Staff handlers
async function handleStaff(path, method, request, env, headers) {
  const subpath = path.replace('/staff', '');
  
  if (subpath === '/schedule' && method === 'GET') {
    const schedule = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() + i * 86400000);
      schedule.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        staff: [
          { name: 'Dr. Ganger', shift: '8:00 AM - 5:00 PM', role: 'Provider' },
          { name: 'Sarah Johnson', shift: '7:30 AM - 4:30 PM', role: 'Nurse' },
          { name: 'Mike Chen', shift: '9:00 AM - 6:00 PM', role: 'Medical Assistant' }
        ]
      });
    }
    
    return jsonResponse({ schedule }, headers);
  }
  
  if (subpath === '/timeoff' && method === 'POST') {
    const body = await request.json();
    return jsonResponse({
      success: true,
      request: {
        id: 'REQ' + Math.floor(Math.random() * 10000),
        ...body,
        status: 'pending',
        submitted_at: new Date().toISOString()
      }
    }, headers, 201);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Analytics handlers
async function handleAnalytics(path, method, request, env, headers) {
  const subpath = path.replace('/analytics', '');
  
  if (subpath === '/dashboard' && method === 'GET') {
    return jsonResponse({
      metrics: {
        daily_patients: Math.floor(Math.random() * 50) + 30,
        weekly_revenue: Math.floor(Math.random() * 50000) + 100000,
        patient_satisfaction: (Math.random() * 0.5 + 4.5).toFixed(1),
        appointment_completion_rate: '96%',
        avg_wait_time: Math.floor(Math.random() * 10) + 10 + ' minutes',
        inventory_alerts: Math.floor(Math.random() * 5),
        pending_authorizations: Math.floor(Math.random() * 10) + 5
      },
      trends: {
        patient_volume: '+12%',
        revenue: '+8%',
        satisfaction: '+0.2'
      },
      generated_at: new Date().toISOString()
    }, headers);
  }
  
  if (subpath === '/reports' && method === 'POST') {
    const body = await request.json();
    return jsonResponse({
      success: true,
      report: {
        id: 'RPT' + Date.now(),
        type: body.type,
        date_range: body.date_range,
        status: 'generating',
        estimated_time: '2 minutes',
        created_at: new Date().toISOString()
      }
    }, headers, 202);
  }
  
  return jsonResponse({
    error: 'Invalid endpoint or method'
  }, headers, 400);
}

// Webhook handlers
async function handleWebhooks(path, method, request, env, headers) {
  const subpath = path.replace('/webhooks', '');
  
  if (subpath === '/stripe' && method === 'POST') {
    // Handle Stripe webhooks
    const body = await request.json();
    console.log('Stripe webhook received:', body.type);
    return jsonResponse({ received: true }, headers);
  }
  
  if (subpath === '/twilio' && method === 'POST') {
    // Handle Twilio webhooks
    const body = await request.text();
    console.log('Twilio webhook received');
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
  
  if (subpath === '/supabase' && method === 'POST') {
    // Handle Supabase webhooks
    const body = await request.json();
    console.log('Supabase webhook received:', body.type);
    return jsonResponse({ received: true }, headers);
  }
  
  return jsonResponse({
    error: 'Unknown webhook endpoint'
  }, headers, 404);
}

// Utility functions
function jsonResponse(data, headers, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}