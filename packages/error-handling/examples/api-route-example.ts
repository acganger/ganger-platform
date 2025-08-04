import { NextRequest } from 'next/server';
import { withErrorHandler, AuthError, ValidationError } from '@ganger/error-handling';
import { createSupabaseServerClient } from '@ganger/db/server';

/**
 * Example API route with error handling
 * Shows proper HIPAA-compliant error handling for medical data
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Get authenticated user
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new AuthError('Authentication required', 'UNAUTHORIZED');
  }

  // Example: Fetch patient appointments
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_type,
      status,
      provider:providers(name)
    `)
    .eq('patient_id', user.id)
    .order('appointment_date', { ascending: true });

  if (error) {
    // Database errors are automatically sanitized
    throw error;
  }

  return Response.json({ appointments });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  
  // Validate request body
  if (!body.appointment_date || !body.provider_id) {
    throw new ValidationError(
      'Missing required fields: appointment_date and provider_id'
    );
  }

  // Validate appointment date is in the future
  const appointmentDate = new Date(body.appointment_date);
  if (appointmentDate <= new Date()) {
    throw new ValidationError(
      'Appointment date must be in the future',
      'appointment_date'
    );
  }

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new AuthError('Authentication required', 'UNAUTHORIZED');
  }

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: user.id,
      provider_id: body.provider_id,
      appointment_date: body.appointment_date,
      appointment_type: body.appointment_type || 'general',
      status: 'scheduled'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return Response.json({ appointment }, { status: 201 });
});