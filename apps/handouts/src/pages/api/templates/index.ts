import { createApiHandler, ApiErrors, successResponse } from '@ganger/utils/server';
import { createSupabaseServerClient } from '@ganger/auth/server';

export default createApiHandler(
  async (req, res) => {
    const supabase = createSupabaseServerClient();
    
    if (req.method === 'GET') {
      const { category, search, active } = req.query;
      
      // Build query
      let query = supabase
        .from('handout_templates')
        .select(`
          id,
          name,
          description,
          template_type,
          category,
          tags,
          is_active,
          version,
          created_at,
          updated_at,
          template_usage_analytics!inner (
            generation_count,
            usage_date
          )
        `)
        .order('name', { ascending: true });
      
      // Apply filters
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      
      if (active !== undefined) {
        query = query.eq('is_active', active === 'true');
      }
      
      const { data: templates, error } = await query;
      
      if (error) {
        throw ApiErrors.internal(error.message);
      }
      
      // Calculate usage stats for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const templatesWithStats = (templates || []).map(template => {
        const recentUsage = template.template_usage_analytics?.filter((stat: any) => 
          new Date(stat.usage_date) >= thirtyDaysAgo
        ) || [];
        
        const usageCount = recentUsage.reduce((sum: number, stat: any) => 
          sum + (stat.generation_count || 0), 0
        );
        
        // Map to frontend format
        return {
          id: template.id,
          name: template.name,
          category: template.category,
          complexity: determineComplexity(template),
          digitalDeliveryEnabled: true, // All templates support digital delivery
          isActive: template.is_active,
          lastModified: template.updated_at,
          usageCount
        };
      });
      
      return successResponse(res, templatesWithStats);
    }
    
    throw ApiErrors.methodNotAllowed(req.method || 'UNKNOWN');
  },
  {
    requireAuth: true,
    allowedMethods: ['GET']
  }
);

function determineComplexity(template: any): 'simple' | 'moderate' | 'complex' {
  // Determine complexity based on template characteristics
  const tags = template.tags || [];
  const hasMultipleVariables = (template.variables?.length || 0) > 5;
  
  if (tags.includes('complex') || hasMultipleVariables) {
    return 'complex';
  } else if (tags.includes('moderate') || (template.variables?.length || 0) > 2) {
    return 'moderate';
  }
  return 'simple';
}