// pages/api/forms/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, updateFormSchema } from '../../../lib/validation-schemas';

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
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    form?: Form;
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
  const { id: formId } = req.query;

  if (!formId || typeof formId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FORM_ID',
        message: 'Valid form ID is required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Authentication check
  const supabase = createServerSupabaseClient<Database>({ req, res });
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
  const email = session.user.email;
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
      return await handleGetForm(req, res, supabase, userProfile, formId, requestId);
    } else if (req.method === 'PUT') {
      return await handleUpdateForm(req, res, supabase, userProfile, formId, requestId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteForm(req, res, supabase, userProfile, formId, requestId);
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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
    console.error('Form API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Form service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetForm(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  formId: string,
  requestId: string
) {
  // Get form with related data
  const { data: form, error } = await supabase
    .from('staff_forms')
    .select(`
      *,
      creator:staff_user_profiles!staff_forms_created_by_fkey(id, full_name, email)
    `)
    .eq('id', formId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FORM_NOT_FOUND',
          message: 'Form not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    console.error('Form fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch form',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response
  const formattedForm: Form = {
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
    creator: {
      id: form.creator.id,
      name: form.creator.full_name,
      email: form.creator.email
    }
  };

  return res.status(200).json({
    success: true,
    data: {
      form: formattedForm
    }
  });
}

async function handleUpdateForm(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  formId: string,
  requestId: string
) {
  // Only admin and managers can update forms
  if (!['admin', 'manager'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only managers and administrators can update forms',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  const validation = validateRequest(updateFormSchema, req.body);
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

  const updates = validation.data;

  // Get current form to check and track changes
  const { data: currentForm, error: fetchError } = await supabase
    .from('staff_forms')
    .select('*')
    .eq('id', formId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FORM_NOT_FOUND',
          message: 'Form not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch form for update',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Validate fields if being updated
  if (updates.fields) {
    for (const field of updates.fields) {
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

  // Check if name conflicts with another form
  if (updates.name && updates.name !== currentForm.name) {
    const { data: existingForm } = await supabase
      .from('staff_forms')
      .select('id, name')
      .eq('name', updates.name)
      .neq('id', formId)
      .single();

    if (existingForm) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'FORM_NAME_EXISTS',
          message: 'Another form with this name already exists',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }
  }

  // Prepare update data
  const updateData: any = {};
  const changes: Record<string, { from: any; to: any }> = {};

  // Track and apply changes
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && JSON.stringify(value) !== JSON.stringify(currentForm[key])) {
      changes[key] = { from: currentForm[key], to: value };
      updateData[key] = value;
    }
  });

  // Increment version if fields are modified
  if (updateData.fields) {
    updateData.version = currentForm.version + 1;
    changes.version = { from: currentForm.version, to: updateData.version };
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_CHANGES',
        message: 'No changes detected',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Update the form
  const { data: updatedForm, error: updateError } = await supabase
    .from('staff_forms')
    .update(updateData)
    .eq('id', formId)
    .select(`
      *,
      creator:staff_user_profiles!staff_forms_created_by_fkey(id, full_name, email)
    `)
    .single();

  if (updateError) {
    console.error('Form update error:', updateError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update form',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'form_updated',
      user_id: userProfile.id,
      metadata: {
        form_id: formId,
        form_name: currentForm.name,
        changes,
        new_version: updateData.version || currentForm.version,
        request_id: requestId
      }
    });

  // Format response
  const formattedForm: Form = {
    id: updatedForm.id,
    name: updatedForm.name,
    title: updatedForm.title,
    description: updatedForm.description,
    fields: updatedForm.fields || [],
    is_active: updatedForm.is_active,
    category: updatedForm.category,
    version: updatedForm.version,
    metadata: updatedForm.metadata || {},
    created_by: updatedForm.created_by,
    created_at: updatedForm.created_at,
    updated_at: updatedForm.updated_at,
    creator: {
      id: updatedForm.creator.id,
      name: updatedForm.creator.full_name,
      email: updatedForm.creator.email
    }
  };

  return res.status(200).json({
    success: true,
    data: {
      form: formattedForm
    }
  });
}

async function handleDeleteForm(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  formId: string,
  requestId: string
) {
  // Only admin can delete forms
  if (userProfile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only administrators can delete forms',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Get current form
  const { data: currentForm, error: fetchError } = await supabase
    .from('staff_forms')
    .select('id, name, category, is_active')
    .eq('id', formId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FORM_NOT_FOUND',
          message: 'Form not found',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch form for deletion',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Check if form is used in any tickets
  const { count: ticketCount } = await supabase
    .from('staff_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('form_type', currentForm.name);

  if (ticketCount && ticketCount > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FORM_IN_USE',
        message: `Cannot delete form - it is used by ${ticketCount} ticket(s)`,
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Soft delete by deactivating instead of hard delete
  const { error: updateError } = await supabase
    .from('staff_forms')
    .update({
      is_active: false,
      metadata: {
        ...currentForm.metadata,
        deleted_by: userProfile.id,
        deleted_at: new Date().toISOString(),
        deleted_reason: 'Admin deletion'
      }
    })
    .eq('id', formId);

  if (updateError) {
    console.error('Form deletion error:', updateError);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_ERROR',
        message: 'Failed to delete form',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Log analytics event
  await supabase
    .from('staff_analytics')
    .insert({
      event_type: 'form_deleted',
      user_id: userProfile.id,
      metadata: {
        form_id: formId,
        form_name: currentForm.name,
        category: currentForm.category,
        request_id: requestId
      }
    });

  return res.status(200).json({
    success: true,
    data: {}
  });
}