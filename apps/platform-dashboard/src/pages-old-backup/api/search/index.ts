// Platform Entrypoint Dashboard - Global Search API
// Provides full-text search across applications, help content, and documents

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Types for search responses
interface SearchApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    performance?: {
      queryTime: number;
    };
  };
}

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  icon_url?: string;
  type: string;
  relevance_score?: number;
}

interface CategorizedSearchResults {
  applications: SearchResult[];
  help: SearchResult[];
  users: SearchResult[];
  documents: SearchResult[];
}

// Request validation schema
const SearchRequestSchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
  limit: z.number().int().min(1).max(50).optional().default(10),
  category: z.enum(['applications', 'help', 'users', 'documents', 'all']).optional().default('all'),
  include_content: z.boolean().optional().default(false)
});

// Utility functions
function successResponse<T>(data: T, meta?: any): SearchApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      ...meta
    }
  };
}

function errorResponse(code: string, message: string, details?: any): SearchApiResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }
  };
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// GET /api/search - Perform global search
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const query = SearchRequestSchema.parse(req.query);
    const startTime = Date.now();

    if (!query.q || query.q.trim().length < 2) {
      return res.status(200).json(successResponse({
        results: { applications: [], help: [], users: [], documents: [] },
        totalResults: 0
      }));
    }

    // Prepare search terms for PostgreSQL full-text search
    const searchTerms = query.q
      .trim()
      .split(/\s+/)
      .map(term => term.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(term => term.length > 0)
      .join(' & ');

    // Perform full-text search with role-based filtering
    const searchResults = await db.query(`
      SELECT 
        content_id,
        content_type,
        title,
        excerpt,
        url,
        icon_url,
        ts_rank(search_vector, plainto_tsquery('english', $1)) as relevance_score
      FROM search_index
      WHERE search_vector @@ plainto_tsquery('english', $1)
        AND (
          required_roles = ARRAY[]::TEXT[] 
          OR $2 = ANY(required_roles)
        )
        ${query.category !== 'all' ? 'AND content_type = $4' : ''}
      ORDER BY relevance_score DESC, last_modified DESC
      LIMIT $3
    `, query.category !== 'all' 
      ? [searchTerms, user.role, query.limit * 4, getCategoryMapping(query.category)]
      : [searchTerms, user.role, query.limit * 4]);

    // Categorize results
    const categorizedResults: CategorizedSearchResults = {
      applications: [],
      help: [],
      users: [],
      documents: []
    };

    searchResults.forEach((result: any) => {
      const searchResult: SearchResult = {
        id: result.content_id,
        title: result.title,
        excerpt: result.excerpt || '',
        url: result.url || '',
        icon_url: result.icon_url,
        type: result.content_type,
        relevance_score: parseFloat(result.relevance_score)
      };

      const category = getCategoryFromContentType(result.content_type);
      if (categorizedResults[category] && categorizedResults[category].length < query.limit) {
        categorizedResults[category].push(searchResult);
      }
    });

    // If searching for applications specifically, also search platform_applications table
    if (query.category === 'all' || query.category === 'applications') {
      const appResults = await searchApplicationsDirectly(query.q, user.role, query.limit);
      
      // Merge with existing application results, avoiding duplicates
      const existingAppIds = new Set(categorizedResults.applications.map(app => app.id));
      const newAppResults = appResults.filter((app: SearchResult) => !existingAppIds.has(app.id));
      
      categorizedResults.applications = [
        ...categorizedResults.applications,
        ...newAppResults
      ].slice(0, query.limit);
    }

    // Log search activity
    await logUserActivity({
      user_id: user.id,
      activity_type: 'search',
      target_action: 'global_search',
      metadata: { 
        query: query.q, 
        category: query.category,
        results_count: searchResults.length 
      }
    });

    const queryTime = Date.now() - startTime;

    res.status(200).json(successResponse({
      results: categorizedResults,
      totalResults: searchResults.length,
      query: query.q,
      category: query.category
    }, {
      performance: {
        queryTime
      }
    }));

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid search request', error.errors));
    } else {
      res.status(500).json(errorResponse('SEARCH_FAILED', 'Search operation failed'));
    }
  }
}

// POST /api/search/index - Update search index (admin only)
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    // Only superadmins can trigger search index updates
    if (user.role !== 'superadmin') {
      return res.status(403).json(errorResponse('ACCESS_DENIED', 'Insufficient permissions'));
    }

    const { force_rebuild } = req.body;
    
    await updateSearchIndex(force_rebuild);

    res.status(200).json(successResponse({
      message: 'Search index updated successfully',
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    res.status(500).json(errorResponse('INDEX_UPDATE_FAILED', 'Failed to update search index'));
  }
}

// Helper functions

function getCategoryMapping(category: string): string {
  const mappings: Record<string, string> = {
    applications: 'application',
    help: 'help_article',
    users: 'user',
    documents: 'document'
  };
  return mappings[category] || category;
}

function getCategoryFromContentType(contentType: string): keyof CategorizedSearchResults {
  const mappings: Record<string, keyof CategorizedSearchResults> = {
    application: 'applications',
    help_article: 'help',
    user: 'users',
    document: 'documents'
  };
  return mappings[contentType] || 'documents';
}

async function searchApplicationsDirectly(searchQuery: string, userRole: string, limit: number): Promise<SearchResult[]> {
  const apps = await db.query(`
    SELECT 
      app_name,
      display_name,
      description,
      app_url,
      icon_url
    FROM platform_applications
    WHERE is_active = true
      AND (
        required_roles = ARRAY[]::TEXT[] 
        OR $2 = ANY(required_roles)
      )
      AND (
        display_name ILIKE $1 
        OR description ILIKE $1 
        OR app_name ILIKE $1
      )
    ORDER BY 
      CASE 
        WHEN display_name ILIKE $1 THEN 1
        WHEN app_name ILIKE $1 THEN 2
        ELSE 3
      END,
      display_name ASC
    LIMIT $3
  `, [`%${searchQuery}%`, userRole, limit]);

  return apps.map((app: any) => ({
    id: app.app_name,
    title: app.display_name,
    excerpt: app.description || '',
    url: app.app_url || `/${app.app_name}`,
    icon_url: app.icon_url,
    type: 'application'
  }));
}

async function updateSearchIndex(forceRebuild: boolean = false): Promise<void> {
  try {

    // Clear existing index if force rebuild
    if (forceRebuild) {
      await db.query('DELETE FROM search_index');
    }

    // Index platform applications
    await indexPlatformApplications();

    // Index help articles (placeholder for future help system)
    await indexHelpArticles();

    // Index users (if user search is enabled)
    await indexUsers();

  } catch (error) {
    throw error;
  }
}

async function indexPlatformApplications(): Promise<void> {
  const applications = await db.query(`
    SELECT * FROM platform_applications 
    WHERE is_active = true
  `);

  for (const app of applications) {
    // Type assertion for database result
    const typedApp = app as unknown as { 
      app_name: string; 
      display_name: string; 
      description?: string; 
      app_url: string; 
      icon_url?: string; 
      category?: string; 
      required_roles?: string[]; 
    };
    await db.query(`
      INSERT INTO search_index (
        content_type, content_id, title, content, excerpt,
        url, icon_url, keywords, categories, required_roles
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (content_type, content_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        url = EXCLUDED.url,
        icon_url = EXCLUDED.icon_url,
        keywords = EXCLUDED.keywords,
        categories = EXCLUDED.categories,
        required_roles = EXCLUDED.required_roles,
        last_modified = NOW()
    `, [
      'application',
      typedApp.app_name,
      typedApp.display_name,
      `${typedApp.display_name} ${typedApp.description || ''}`,
      typedApp.description,
      typedApp.app_url,
      typedApp.icon_url,
      [typedApp.app_name, typedApp.display_name],
      [typedApp.category || 'application'],
      typedApp.required_roles || []
    ]);
  }
}

async function indexHelpArticles(): Promise<void> {
  // Placeholder for help articles indexing
  // This would integrate with a help/documentation system
  const helpArticles = [
    {
      id: 'getting-started',
      title: 'Getting Started with Ganger Platform',
      content: 'Learn how to navigate and use the Ganger Platform effectively',
      excerpt: 'Complete guide to getting started',
      url: '/help/getting-started'
    },
    {
      id: 'user-guide',
      title: 'User Guide',
      content: 'Comprehensive user guide for all platform features',
      excerpt: 'Step-by-step instructions for using platform features',
      url: '/help/user-guide'
    }
  ];

  for (const article of helpArticles) {
    await db.query(`
      INSERT INTO search_index (
        content_type, content_id, title, content, excerpt, url
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (content_type, content_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        url = EXCLUDED.url,
        last_modified = NOW()
    `, [
      'help_article',
      article.id,
      article.title,
      article.content,
      article.excerpt,
      article.url
    ]);
  }
}

async function indexUsers(): Promise<void> {
  // Index users for directory search (if enabled)
  const users = await db.query(`
    SELECT id, name, email, role, primary_location, avatar_url
    FROM users 
    WHERE is_active = true
  `);

  for (const user of users) {
    // Type assertion for database result
    const typedUser = user as unknown as { 
      id: string; 
      name?: string; 
      email: string; 
      role: string; 
      primary_location?: string; 
      avatar_url?: string; 
    };
    await db.query(`
      INSERT INTO search_index (
        content_type, content_id, title, content, excerpt,
        keywords, required_roles
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (content_type, content_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        excerpt = EXCLUDED.excerpt,
        keywords = EXCLUDED.keywords,
        last_modified = NOW()
    `, [
      'user',
      typedUser.id,
      typedUser.name || typedUser.email.split('@')[0],
      `${typedUser.name || ''} ${typedUser.email} ${typedUser.role} ${typedUser.primary_location || ''}`,
      `${typedUser.role} at ${typedUser.primary_location || 'Unknown location'}`,
      [typedUser.name, typedUser.email, typedUser.role],
      ['staff', 'manager', 'superadmin'] // All roles can search users
    ]);
  }
}

async function logUserActivity(activity: {
  user_id: string;
  activity_type: string;
  target_action?: string;
  metadata?: any;
}) {
  try {
    await db.query(`
      INSERT INTO user_activity_log (
        user_id, activity_type, target_action, metadata
      ) VALUES ($1, $2, $3, $4)
    `, [
      activity.user_id,
      activity.activity_type,
      activity.target_action,
      activity.metadata ? JSON.stringify(activity.metadata) : null
    ]);
  } catch (error) {
  }
}

// Main handler with authentication
const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const user = req.user; // Added by withAuth middleware
  
  try {
    switch (req.method) {
      case 'GET':
        await handleGet(req, res, user);
        break;
      case 'POST':
        await handlePost(req, res, user);
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error'));
  }
};

export default withAuth(handler, {
  roles: ['staff', 'manager', 'superadmin']
});