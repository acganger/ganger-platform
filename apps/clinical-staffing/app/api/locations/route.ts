/**
 * Locations API Route
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
 * GET /api/locations
 * Retrieve locations with staffing information
 */
export async function GET(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const includeStaffing = searchParams.get('includeStaffing');

    // Build filters for migration-aware query
    const filters: Record<string, any> = {};

    if (isActive !== null) {
      filters.is_active = isActive === 'true';
    }

    // Query locations using migration adapter
    const locations = await migrationAdapter.select(
      'locations',
      '*',
      filters,
      {
        orderBy: 'name',
        limit: 100
      }
    );

    // Transform data for consistent API response
    const transformedLocations = await Promise.all(locations.map(async (location) => {
      const result = {
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zip_code: location.zip_code,
        phone: location.phone,
        timezone: location.timezone,
        is_active: location.is_active,
        operating_hours: location.operating_hours,
        created_at: location.created_at,
        updated_at: location.updated_at
      };

      // Include staffing information if requested
      if (includeStaffing === 'true') {
        // Get staff members for this location
        const staffMembers = await migrationAdapter.select(
          'staff_members',
          'id, first_name, last_name, role, employee_status',
          {
            base_location_id: location.id,
            employee_status: MigrationHelpers.convertEmployeeStatus('active')
          }
        );

        // Get providers for this location
        const providers = await migrationAdapter.select(
          'providers',
          'id, first_name, last_name, specialty_id',
          {
            location_id: location.id,
            is_active: true
          }
        );

        result.staffing = {
          staff_count: staffMembers.length,
          provider_count: providers.length,
          staff_members: staffMembers,
          providers: providers
        };
      }

      return result;
    }));

    return respondWithSuccess(transformedLocations);
  });
}

/**
 * POST /api/locations
 * Create new location
 */
export async function POST(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const body = await request.json();
    
    // Validate required fields
    const required = ['name', 'address', 'city', 'state', 'zip_code'];
    for (const field of required) {
      if (!body[field]) {
        return respondWithError(`${field} is required`, 400);
      }
    }

    // Check for duplicate name
    const existingLocations = await migrationAdapter.select(
      'locations',
      '*',
      { name: body.name }
    );

    if (existingLocations.length > 0) {
      return respondWithError('Location with this name already exists', 409);
    }

    // Create location data
    const locationData = {
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zip_code: body.zip_code,
      phone: body.phone,
      timezone: body.timezone || 'America/New_York',
      is_active: body.is_active !== false,
      operating_hours: body.operating_hours || {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: { start: null, end: null }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create location using migration adapter
    const [newLocation] = await migrationAdapter.insert('locations', locationData);

    return respondWithSuccess(newLocation, 201);
  });
}

/**
 * PUT /api/locations/[id]
 * Update existing location
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const locationId = pathname.split('/').pop();
    
    if (!locationId) {
      return respondWithError('Location ID is required', 400);
    }

    const body = await request.json();
      
    // Check if location exists
    const existingLocations = await migrationAdapter.select(
      'locations',
      '*',
      { id: locationId }
    );

    if (existingLocations.length === 0) {
      return respondWithError('Location not found', 404);
    }

    // Update location data
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Update location using migration adapter
    const updatedLocations = await migrationAdapter.update(
      'locations',
      updateData,
      { id: locationId }
    );

    if (updatedLocations.length === 0) {
      return respondWithError('Failed to update location', 500);
    }

    return respondWithSuccess(updatedLocations[0]);
  });
}

/**
 * DELETE /api/locations/[id]
 * Deactivate location (soft delete)
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (request, { user }) => {
    const { pathname } = new URL(request.url);
    const locationId = pathname.split('/').pop();
    
    if (!locationId) {
      return respondWithError('Location ID is required', 400);
    }

    // Check if location exists
    const existingLocations = await migrationAdapter.select(
      'locations',
      '*',
      { id: locationId }
    );

    if (existingLocations.length === 0) {
      return respondWithError('Location not found', 404);
    }

    // Soft delete by updating status to inactive
    await migrationAdapter.update(
      'locations',
      { 
        is_active: false,
        updated_at: new Date().toISOString()
      },
      { id: locationId }
    );

    return respondWithSuccess({ message: 'Location deactivated successfully' });
  });
}