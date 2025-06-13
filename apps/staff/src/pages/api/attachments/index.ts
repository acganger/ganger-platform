// pages/api/attachments/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/database';
import { validateRequest, validateQuery, createAttachmentSchema } from '../../../lib/validation-schemas';

interface Attachment {
  id: string;
  ticket_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string;
  is_internal: boolean;
  created_at: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  ticket?: {
    id: string;
    ticket_number: string;
    title: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    attachments?: Attachment[];
    attachment?: Attachment;
    upload_url?: string;
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
      return await handleGetAttachments(req, res, supabase, userProfile, requestId);
    } else if (req.method === 'POST') {
      return await handleCreateAttachment(req, res, supabase, userProfile, requestId);
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
    console.error('Attachments API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Attachments service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetAttachments(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  // Simple query parameter handling for now
  const {
    ticket_id,
    is_internal,
    uploaded_by,
    mime_type,
    search,
    sort_by = 'created_at',
    sort_order = 'desc',
    limit = 50,
    offset = 0,
    created_after,
    created_before,
    min_size,
    max_size
  } = req.query as any;

  // Build query with RLS handling permissions automatically
  let query = supabase
    .from('staff_ticket_attachments')
    .select(`
      *,
      uploader:staff_user_profiles!staff_ticket_attachments_uploaded_by_fkey(id, full_name, email),
      ticket:staff_tickets!staff_ticket_attachments_ticket_id_fkey(id, ticket_number, title)
    `);

  // Apply filters
  if (ticket_id) {
    query = query.eq('ticket_id', ticket_id);
  }

  if (is_internal !== undefined) {
    // Non-admin/manager users can't see internal attachments unless they uploaded them
    if (!['admin', 'manager'].includes(userProfile.role) && is_internal) {
      query = query.eq('uploaded_by', userProfile.id);
    } else {
      query = query.eq('is_internal', is_internal);
    }
  } else {
    // Filter out internal attachments for non-privileged users unless they uploaded them
    if (!['admin', 'manager'].includes(userProfile.role)) {
      query = query.or(`is_internal.eq.false,uploaded_by.eq.${userProfile.id}`);
    }
  }

  if (uploaded_by) {
    query = query.eq('uploaded_by', uploaded_by);
  }

  if (mime_type) {
    query = query.eq('mime_type', mime_type);
  }

  if (search) {
    query = query.or(`filename.ilike.%${search}%,original_filename.ilike.%${search}%`);
  }

  if (created_after) {
    query = query.gte('created_at', created_after);
  }

  if (created_before) {
    query = query.lte('created_at', created_before);
  }

  if (min_size) {
    query = query.gte('file_size', min_size);
  }

  if (max_size) {
    query = query.lte('file_size', max_size);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('staff_ticket_attachments')
    .select('id', { count: 'exact', head: true });

  // Execute main query with pagination
  const { data: attachments, error } = await query
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Attachments fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch attachments',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Format response data
  const formattedAttachments: Attachment[] = attachments.map((attachment: any) => ({
    id: attachment.id,
    ticket_id: attachment.ticket_id,
    filename: attachment.filename,
    original_filename: attachment.original_filename,
    file_size: attachment.file_size,
    mime_type: attachment.mime_type,
    storage_path: attachment.storage_path,
    uploaded_by: attachment.uploaded_by,
    is_internal: attachment.is_internal,
    created_at: attachment.created_at,
    uploader: {
      id: attachment.uploader.id,
      name: attachment.uploader.full_name,
      email: attachment.uploader.email
    },
    ticket: attachment.ticket ? {
      id: attachment.ticket.id,
      ticket_number: attachment.ticket.ticket_number,
      title: attachment.ticket.title
    } : undefined
  }));

  return res.status(200).json({
    success: true,
    data: {
      attachments: formattedAttachments,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        has_more: (offset + limit) < (totalCount || 0)
      }
    }
  });
}

async function handleCreateAttachment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  requestId: string
) {
  const validation = validateRequest(createAttachmentSchema, req.body);
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
    ticket_id,
    original_filename,
    file_size,
    mime_type,
    is_internal
  } = validation.data;

  try {
    // Verify ticket exists and user has access (RLS will handle this)
    const { data: ticket, error: ticketError } = await supabase
      .from('staff_tickets')
      .select('id, ticket_number, title, status')
      .eq('id', ticket_id)
      .single();

    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: 'Ticket not found or access denied',
            timestamp: new Date().toISOString(),
            request_id: requestId
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'TICKET_FETCH_ERROR',
          message: 'Failed to verify ticket access',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Only admin/manager can upload internal attachments
    if (is_internal && !['admin', 'manager'].includes(userProfile.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Only managers and administrators can upload internal attachments',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Validate file size (max 50MB)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file_size > maxFileSize) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 50MB limit',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Validate MIME type (basic security check)
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedMimeTypes.includes(mime_type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File type not allowed',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Generate unique filename
    const fileExtension = original_filename.split('.').pop();
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storagePath = `tickets/${ticket_id}/attachments/${uniqueFilename}`;

    // Create signed upload URL
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('staff-documents')
      .createSignedUploadUrl(storagePath, {
        upsert: false
      });

    if (uploadError) {
      console.error('Upload URL creation error:', uploadError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_URL_ERROR',
          message: 'Failed to create upload URL',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Create attachment record
    const attachmentData = {
      ticket_id,
      filename: uniqueFilename,
      original_filename: original_filename.trim(),
      file_size,
      mime_type,
      storage_path: storagePath,
      uploaded_by: userProfile.id,
      is_internal: is_internal || false
    };

    const { data: newAttachment, error } = await supabase
      .from('staff_ticket_attachments')
      .insert(attachmentData)
      .select(`
        *,
        uploader:staff_user_profiles!staff_ticket_attachments_uploaded_by_fkey(id, full_name, email),
        ticket:staff_tickets!staff_ticket_attachments_ticket_id_fkey(id, ticket_number, title)
      `)
      .single();

    if (error) {
      console.error('Attachment creation error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CREATION_ERROR',
          message: 'Failed to create attachment record',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'attachment_created',
        user_id: userProfile.id,
        metadata: {
          attachment_id: newAttachment.id,
          ticket_id,
          ticket_number: ticket.ticket_number,
          filename: original_filename,
          file_size,
          mime_type,
          is_internal: is_internal || false,
          request_id: requestId
        }
      });

    // Format response
    const formattedAttachment: Attachment = {
      id: newAttachment.id,
      ticket_id: newAttachment.ticket_id,
      filename: newAttachment.filename,
      original_filename: newAttachment.original_filename,
      file_size: newAttachment.file_size,
      mime_type: newAttachment.mime_type,
      storage_path: newAttachment.storage_path,
      uploaded_by: newAttachment.uploaded_by,
      is_internal: newAttachment.is_internal,
      created_at: newAttachment.created_at,
      uploader: {
        id: newAttachment.uploader.id,
        name: newAttachment.uploader.full_name,
        email: newAttachment.uploader.email
      },
      ticket: {
        id: newAttachment.ticket.id,
        ticket_number: newAttachment.ticket.ticket_number,
        title: newAttachment.ticket.title
      }
    };

    return res.status(201).json({
      success: true,
      data: {
        attachment: formattedAttachment,
        upload_url: uploadData.signedUrl
      }
    });

  } catch (error) {
    console.error('Attachment creation process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CREATION_PROCESS_ERROR',
        message: 'Attachment creation process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}