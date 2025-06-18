import { NextRequest, NextResponse } from 'next/server';
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
  limit: z.number().int().min(1).max(50).optional(),
  category: z.enum(['applications', 'help', 'users', 'documents', 'all']).optional(),
  include_content: z.boolean().optional()
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || 'all';
    const include_content = searchParams.get('include_content') === 'true';

    const query = SearchRequestSchema.parse({ 
      q, 
      limit: limit || 10, 
      category: category as any || 'all', 
      include_content 
    });

    const startTime = Date.now();

    // Mock user data
    const user = {
      id: '1',
      role: 'superadmin'
    };

    // Mock search results
    const mockApplications: SearchResult[] = [
      {
        id: 'socials',
        title: 'Socials & Reviews',
        excerpt: 'Manage social media monitoring and online reviews for the practice',
        url: '/socials',
        icon_url: '/icons/socials.svg',
        type: 'application',
        relevance_score: 0.95
      },
      {
        id: 'staffing',
        title: 'Clinical Staffing',
        excerpt: 'Optimize provider scheduling and clinical support staffing',
        url: '/staffing',
        icon_url: '/icons/staffing.svg',
        type: 'application',
        relevance_score: 0.85
      },
      {
        id: 'compliance',
        title: 'Compliance Training',
        excerpt: 'Track training progress, certifications, and compliance requirements',
        url: '/compliance',
        icon_url: '/icons/compliance.svg',
        type: 'application',
        relevance_score: 0.80
      },
      {
        id: 'dashboard',
        title: 'Platform Dashboard',
        excerpt: 'Monitor platform-wide metrics, performance, and system health',
        url: '/dashboard',
        icon_url: '/icons/dashboard.svg',
        type: 'application',
        relevance_score: 0.75
      }
    ];

    const mockHelp: SearchResult[] = [
      {
        id: 'help-getting-started',
        title: 'Getting Started Guide',
        excerpt: 'Learn how to navigate and use the Ganger Platform effectively',
        url: '/help/getting-started',
        icon_url: '/icons/help.svg',
        type: 'help',
        relevance_score: 0.70
      },
      {
        id: 'help-troubleshooting',
        title: 'Troubleshooting Common Issues',
        excerpt: 'Solutions to frequently encountered problems and error messages',
        url: '/help/troubleshooting',
        icon_url: '/icons/help.svg',
        type: 'help',
        relevance_score: 0.65
      }
    ];

    const mockUsers: SearchResult[] = [
      {
        id: 'user-ganger',
        title: 'Dr. Ganger',
        excerpt: 'Lead Dermatologist and Platform Administrator',
        url: '/staff/users/ganger',
        icon_url: '/avatars/ganger.jpg',
        type: 'user',
        relevance_score: 0.60
      }
    ];

    const mockDocuments: SearchResult[] = [
      {
        id: 'doc-platform-manual',
        title: 'Platform User Manual',
        excerpt: 'Comprehensive guide to using all platform features and applications',
        url: '/documents/platform-manual.pdf',
        icon_url: '/icons/pdf.svg',
        type: 'document',
        relevance_score: 0.55
      }
    ];

    // Filter results based on query
    const searchQuery = query.q.toLowerCase();
    const filterResults = (results: SearchResult[]) => 
      results.filter(item => 
        item.title.toLowerCase().includes(searchQuery) ||
        item.excerpt.toLowerCase().includes(searchQuery)
      ).slice(0, query.limit);

    let categorizedResults: CategorizedSearchResults;

    if (query.category === 'all') {
      categorizedResults = {
        applications: filterResults(mockApplications),
        help: filterResults(mockHelp),
        users: filterResults(mockUsers),
        documents: filterResults(mockDocuments)
      };
    } else {
      categorizedResults = {
        applications: query.category === 'applications' ? filterResults(mockApplications) : [],
        help: query.category === 'help' ? filterResults(mockHelp) : [],
        users: query.category === 'users' ? filterResults(mockUsers) : [],
        documents: query.category === 'documents' ? filterResults(mockDocuments) : []
      };
    }

    const queryTime = Date.now() - startTime;
    const totalResults = Object.values(categorizedResults).reduce((sum, results) => sum + results.length, 0);

    return NextResponse.json(successResponse({
      query: query.q,
      results: categorizedResults,
      totalResults,
      categories: {
        applications: categorizedResults.applications.length,
        help: categorizedResults.help.length,
        users: categorizedResults.users.length,
        documents: categorizedResults.documents.length
      }
    }, {
      performance: {
        queryTime
      }
    }));

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid search request', error.errors),
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        errorResponse('SEARCH_FAILED', 'Failed to perform search'),
        { status: 500 }
      );
    }
  }
}

// POST /api/search - Advanced search with filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query: searchQuery,
      filters = {},
      sort = 'relevance',
      limit = 20
    } = body;

    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Search query must be at least 2 characters'),
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Mock advanced search implementation
    const results = {
      query: searchQuery,
      results: [],
      totalResults: 0,
      appliedFilters: filters,
      sortBy: sort
    };

    const queryTime = Date.now() - startTime;

    return NextResponse.json(successResponse(results, {
      performance: {
        queryTime
      }
    }));

  } catch (error) {
    return NextResponse.json(
      errorResponse('SEARCH_FAILED', 'Failed to perform advanced search'),
      { status: 500 }
    );
  }
}