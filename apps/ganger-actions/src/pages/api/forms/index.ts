// pages/api/forms/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';
import { validateRequest, validateQuery, formQuerySchema, createFormSchema } from '../../../lib/validation-schemas';

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'email' | 'number' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: Record<string, unknown>;
}

interface Form {
  id: string;
  name: string;
  title: string;
  description?: string;
  fields: FormField[];
  is_active: boolean;
  category: string;
  version: number;
  metadata?: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    forms?: Form[];
    form?: Form;
    pagination?: {
      total: number;
      limit: number;
      offset: number;
      has_more: boolean;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    request_id: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const requestId = Math.random().toString(36).substring(7);

  // Authentication check
  const supabase = createSupabaseServerClient();
  const { data: { session }, error: authError } = await supabase.auth.getSession();

  if (authError || !session) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check domain restriction
  const email = session.user?.email;
  if (!email?.endsWith('@gangerdermatology.com')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'DOMAIN_RESTRICTED',
        message: 'Access restricted to Ganger Dermatology domain',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Get user profile for permissions
  const { data: userProfile } = await supabase
    .from('staff_user_profiles')
    .select('id, role, email, full_name')
    .eq('id', session.user.id)
    .single();

  if (!userProfile) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PROFILE_NOT_FOUND',
        message: 'User profile not found',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  try {
    if (req.method === 'GET') {
      return await handleGetForms(req, res, supabase, userProfile, requestId);
    } else if (req.method === 'POST') {
      return await handleCreateForm(req, res, supabase, userProfile, requestId);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }
  } catch (error) {
    console.error('Forms API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Forms service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetForms(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateQuery(formQuerySchema, req.query);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Query validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const {
    is_active,
    category,
    created_by,
    search,
    sort_by,
    sort_order,
    limit,
    offset,
    created_after,
    created_before
  } = validation.data;

  // Build query
  let query = supabase
    .from('staff_forms')
    .select(`
      *,
      creator:staff_user_profiles!staff_forms_created_by_fkey(id, full_name, email)
    `);

  // Apply filters
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active);
  } else if (!validation.data.include_inactive) {
    // Default to showing only active forms unless explicitly requested
    query = query.eq('is_active', true);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (created_by) {
    query = query.eq('created_by', created_by);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (created_after) {
    query = query.gte('created_at', created_after);
  }

  if (created_before) {
    query = query.lte('created_at', created_before);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('staff_forms')
    .select('id', { count: 'exact', head: true });

  // Execute main query with pagination
  const { data: forms, error } = await query
    .range(offset!, offset! + limit! - 1);

  if (error) {
    console.error('Forms fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch forms',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response data
  const formattedForms: Form[] = (forms || []).map((form: any) => ({
    id: form.id,
    name: form.name,
    title: form.title,
    description: form.description,
    fields: form.fields || [],
    is_active: form.is_active,
    category: form.category,
    version: form.version,
    metadata: form.metadata || {},
    created_by: form.created_by,
    created_at: form.created_at,
    updated_at: form.updated_at,
    creator: form.creator ? {
      id: form.creator.id,
      name: form.creator.full_name,
      email: form.creator.email
    } : undefined
  }));

  return res.status(200).json({
    success: true,
    data: {
      forms: formattedForms,
      pagination: {
        total: totalCount || 0,
        limit: limit!,
        offset: offset!,
        has_more: (offset! + limit!) < (totalCount || 0)
      }
    }
  });
}

async function handleCreateForm(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  // Only admin and managers can create forms
  if (!['admin', 'manager'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only managers and administrators can create forms',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const validation = validateRequest(createFormSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validation.errors,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const {
    name,
    title,
    description,
    fields,
    category,
    metadata
  } = validation.data;

  try {
    // Check if form name already exists
    const { data: existingForm } = await supabase
      .from('staff_forms')
      .select('id, name')
      .eq('name', name)
      .single();

    if (existingForm) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'FORM_NAME_EXISTS',
          message: 'Form with this name already exists',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Validate fields structure
    if (fields && Array.isArray(fields)) {
      for (const field of fields) {
      if (!field.id || !field.type || !field.label) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FIELD_STRUCTURE',
            message: 'Each field must have id, type, and label',
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }

      // Validate field types
      const validTypes = ['text', 'textarea', 'select', 'checkbox', 'radio', 'date', 'email', 'number', 'file'];
      if (!validTypes.includes(field.type)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FIELD_TYPE',
            message: `Invalid field type: ${field.type}`,
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }

      // Validate options for select/radio fields
      if (['select', 'radio'].includes(field.type) && (!field.options || field.options.length === 0)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELD_OPTIONS',
            message: `Field type ${field.type} requires options`,
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }
    }
  }

    // Create form
    const formData = {
      name: name.trim(),
      title: title.trim(),
      description: description?.trim(),
      fields,
      is_active: true,
      category,
      version: 1,
      created_by: userProfile.id,
      metadata: {
        ...metadata,
        created_by_email: userProfile.email,
        request_id: requestId
      }
    };

    const { data: newForm, error } = await supabase
      .from('staff_forms')
      .insert(formData)
      .select(`
        *,
        creator:staff_user_profiles!staff_forms_created_by_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error('Form creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: 'Failed to create form',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'form_created',
        user_id: userProfile.id,
        metadata: {
          form_id: newForm.id,
          form_name: name,
          category,
          field_count: fields?.length || 0,
          request_id: requestId
        }
      });

    // Format response
    const formattedForm: Form = {
      id: newForm.id,
      name: newForm.name,
      title: newForm.title,
      description: newForm.description,
      fields: newForm.fields || [],
      is_active: newForm.is_active,
      category: newForm.category,
      version: newForm.version,
      metadata: newForm.metadata || {},
      created_by: newForm.created_by,
      created_at: newForm.created_at,
      updated_at: newForm.updated_at,
      creator: {
        id: newForm.creator.id,
        name: newForm.creator.full_name,
        email: newForm.creator.email
      }
    };

    return res.status(201).json({
      success: true,
      data: {
        form: formattedForm
      }
    });

  } catch (error) {
    console.error('Form creation process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_PROCESS_ERROR',
        message: 'Form creation process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}
