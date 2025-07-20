import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { migrationAdapter } from '@ganger/db';
import { cacheManager } from '@ganger/cache';
import { 
  ApiErrors, 
  sendError, 
  sendSuccess, 
  withErrorHandler 
} from '@/lib/api/errors';

// Configure migration adapter
migrationAdapter.updateConfig({
  enableMigrationMode: true,
  useNewSchema: process.env.MIGRATION_USE_NEW_SCHEMA === 'true',
  logMigrationQueries: process.env.NODE_ENV === 'development'
});

export default withErrorHandler(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    throw ApiErrors.validation(`Method ${req.method} not allowed`);
  }

  // Use @ganger/auth for authentication
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user?.email) {
    throw ApiErrors.unauthorized('Authentication required');
  }

  const { search = '', therapeutic_class, requires_pa } = req.query;
  const searchTerm = String(search).toLowerCase();

  try {
    // Check cache first
    const cacheKey = `medications:search:${searchTerm}:${therapeutic_class || 'all'}:${requires_pa || 'all'}`;
    const cachedData = await cacheManager.get(cacheKey);
    
    if (cachedData) {
      return sendSuccess(res, { medications: cachedData });
    }

    // Build query using migration adapter
    let filters: any = {};
    
    // Add search filter
    if (searchTerm) {
      filters.or = [
        { name: { ilike: `%${searchTerm}%` } },
        { generic_name: { ilike: `%${searchTerm}%` } },
        { ndc_number: { ilike: `%${searchTerm}%` } }
      ];
    }
    
    // Add therapeutic class filter
    if (therapeutic_class && therapeutic_class !== 'all') {
      filters.therapeutic_class = therapeutic_class;
    }
    
    // Add PA requirement filter
    if (requires_pa === 'true') {
      filters.requires_pa = true;
    } else if (requires_pa === 'false') {
      filters.requires_pa = false;
    }

    // Fetch medications from database
    const medications = await migrationAdapter.select(
      'medications',
      '*',
      filters,
      {
        orderBy: 'name',
        limit: 50
      }
    );

    // Transform data to match frontend interface
    const transformedMedications = medications.map((med: any) => ({
      id: med.id,
      name: med.name,
      genericName: med.generic_name,
      strength: med.strength,
      dosageForm: med.dosage_form,
      manufacturer: med.manufacturer,
      ndcNumber: med.ndc_number,
      therapeuticClass: med.therapeutic_class,
      indication: med.indication,
      isFormulary: med.is_formulary || false,
      requiresPA: med.requires_pa || false
    }));

    // Cache for 1 hour since medication data doesn't change frequently
    await cacheManager.set(cacheKey, transformedMedications, 3600);

    sendSuccess(res, {
      medications: transformedMedications,
      total: transformedMedications.length
    });
  } catch (error) {
    throw error; // Re-throw to be handled by withErrorHandler
  }
});