/**
 * Providers API Route
 * Clinical Staffing App - Migration-Aware Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrationAdapter, MigrationHelpers } from '@ganger/db';
import { withStandardErrorHandling, respondWithSuccess, respondWithError } from '@ganger/utils';
import { withAuth } from '@ganger/auth/middleware';

// Configure migration adapter
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

/**
 * GET /api/providers
 * Retrieve providers with their schedules
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const date = searchParams.get('date');
    const specialtyId = searchParams.get('specialtyId');

    // Build filters for migration-aware query
    const filters: Record<string, any> = {
      is_active: true
    };

    if (locationId) filters.location_id = locationId;
    if (specialtyId) filters.specialty_id = specialtyId;

    // Query providers using migration adapter
    const providers = await migrationAdapter.select(
      'providers',
      `
        *,
        location:locations!inner(
          id, name, address, timezone
        ),
        specialty:provider_specialties!inner(
          id, name, description
        )
      `,
      filters,
      {
        orderBy: 'last_name',
        limit: 100
      }
    );

    // If date is provided, get schedules for that date
    let providerSchedules = [];
    if (date) {
      providerSchedules = await migrationAdapter.rawQuery(`
        SELECT * FROM provider_schedules_cache 
        WHERE schedule_date = $1
        ${locationId ? 'AND location_id = $2' : ''}
      `, locationId ? [date, locationId] : [date]);
    }

    // Transform data for consistent API response
    const transformedProviders = providers.map(provider => {
      const schedules = providerSchedules.filter(s => s.physician_id === provider.id);
      
      return {
        id: provider.id,
        name: `${provider.first_name} ${provider.last_name}`,
        email: provider.email,
        phone: provider.phone,
        specialty: provider.specialty?.name,
        location: provider.location?.name,
        location_id: provider.location_id,
        is_active: provider.is_active,
        schedules: schedules.map(schedule => ({
          id: schedule.id,
          schedule_date: schedule.schedule_date,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          appointment_type: schedule.appointment_type,
          patient_capacity: schedule.patient_capacity,
          is_available: schedule.is_available
        })),
        created_at: provider.created_at,
        updated_at: provider.updated_at
      };
    });

    return respondWithSuccess(transformedProviders);
  });
}

/**
 * POST /api/providers
 * Create new provider
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const body = await request.json();
    
    // Validate required fields
    const required = ['first_name', 'last_name', 'email', 'location_id', 'specialty_id'];
    for (const field of required) {
      if (!body[field]) {
        return respondWithError(`${field} is required`, 400);
      }
    }

    // Check for duplicate email
    const existingProviders = await migrationAdapter.select(
      'providers',
      '*',
      { email: body.email }
    );

    if (existingProviders.length > 0) {
      return respondWithError('Provider with this email already exists', 409);
    }

    // Create provider data
    const providerData = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      location_id: body.location_id,
      specialty_id: body.specialty_id,
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create provider using migration adapter
    const [newProvider] = await migrationAdapter.insert('providers', providerData);

    return respondWithSuccess(newProvider, 201);
  });
}

/**
 * PUT /api/providers/[id]
 * Update existing provider
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const providerId = pathname.split('/').pop();
    
    if (!providerId) {
      return respondWithError('Provider ID is required', 400);
    }

    const body = await request.json();
    
    // Check if provider exists
    const existingProviders = await migrationAdapter.select(
      'providers',
      '*',
      { id: providerId }
    );

    if (existingProviders.length === 0) {
      return respondWithError('Provider not found', 404);
    }

    // Update provider data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Update provider using migration adapter
    const updatedProviders = await migrationAdapter.update(
      'providers',
      updateData,
      { id: providerId }
    );

    if (updatedProviders.length === 0) {
      return respondWithError('Failed to update provider', 500);
    }

    return respondWithSuccess(updatedProviders[0]);
  });
}

/**
 * DELETE /api/providers/[id]
 * Deactivate provider (soft delete)
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const providerId = pathname.split('/').pop();
    
    if (!providerId) {
      return respondWithError('Provider ID is required', 400);
    }

    // Check if provider exists
    const existingProviders = await migrationAdapter.select(
      'providers',
      '*',
      { id: providerId }
    );

    if (existingProviders.length === 0) {
      return respondWithError('Provider not found', 404);
    }

    // Soft delete by updating status to inactive
    await migrationAdapter.update(
      'providers',
      { 
        is_active: false,
        updated_at: new Date().toISOString()
      },
      { id: providerId }
    );

    return respondWithSuccess({ message: 'Provider deactivated successfully' });
  });
}