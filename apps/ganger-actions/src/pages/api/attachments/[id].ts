// pages/api/attachments/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@ganger/auth/server';
import { Database } from '../../../types/database';

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
  uploader: {
    id: string;
    name: string;
    email: string;
  };
  ticket: {
    id: string;
    ticket_number: string;
    title: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: {
    attachment?: Attachment;
    download_url?: string;
  };
  error?: {
    code: string;
    message: string;
    timestamp: string;
    request_id: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const requestId = Math.random().toString(36).substring(7);
  const { id: attachmentId } = req.query;

  if (!attachmentId || typeof attachmentId !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ATTACHMENT_ID',
        message: 'Valid attachment ID is required',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

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
      return await handleGetAttachment(req, res, supabase, userProfile, attachmentId, requestId);
    } else if (req.method === 'DELETE') {
      return await handleDeleteAttachment(req, res, supabase, userProfile, attachmentId, requestId);
    } else {
      res.setHeader('Allow', ['GET', 'DELETE']);
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
    console.error('Attachment API error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Attachment service unavailable',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}

async function handleGetAttachment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  attachmentId: string,
  requestId: string
) {
  const { download } = req.query;

  // Get attachment with related data (RLS will handle permissions)
  const { data: attachment, error } = await supabase
    .from('staff_ticket_attachments')
    .select(`
      *,
      uploader:staff_user_profiles!staff_ticket_attachments_uploaded_by_fkey(id, full_name, email),
      ticket:staff_tickets!staff_ticket_attachments_ticket_id_fkey(id, ticket_number, title)
    `)
    .eq('id', attachmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found or access denied',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    console.error('Attachment fetch error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch attachment',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Additional permission check for internal attachments
  if (attachment.is_internal && 
      attachment.uploaded_by !== userProfile.id && 
      !['admin', 'manager'].includes(userProfile.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Access denied to internal attachment',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // If download requested, create signed download URL
  let downloadUrl = undefined;
  if (download === 'true') {
    const { data: urlData, error: urlError } = await supabase.storage
      .from('staff-documents')
      .createSignedUrl(attachment.storage_path, 3600); // 1 hour expiry

    if (urlError) {
      console.error('Download URL creation error:', urlError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DOWNLOAD_URL_ERROR',
          message: 'Failed to create download URL',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    downloadUrl = urlData.signedUrl;

    // Log analytics event for download
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'attachment_downloaded',
        user_id: userProfile.id,
        metadata: {
          attachment_id: attachmentId,
          ticket_id: attachment.ticket_id,
          ticket_number: attachment.ticket.ticket_number,
          filename: attachment.original_filename,
          request_id: requestId
        }
      });
  }

  // Format response
  const formattedAttachment: Attachment = {
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
    ticket: {
      id: attachment.ticket.id,
      ticket_number: attachment.ticket.ticket_number,
      title: attachment.ticket.title
    }
  };

  return res.status(200).json({
    success: true,
    data: {
      attachment: formattedAttachment,
      download_url: downloadUrl
    }
  });
}

async function handleDeleteAttachment(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: any,
  userProfile: any,
  attachmentId: string,
  requestId: string
) {
  // Get current attachment to check permissions
  const { data: currentAttachment, error: fetchError } = await supabase
    .from('staff_ticket_attachments')
    .select(`
      id,
      uploaded_by,
      ticket_id,
      original_filename,
      storage_path,
      is_internal,
      ticket:staff_tickets!staff_ticket_attachments_ticket_id_fkey(ticket_number)
    `)
    .eq('id', attachmentId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found or access denied',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch attachment for deletion',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Only uploader or admin can delete attachments
  const isUploader = currentAttachment.uploaded_by === userProfile.id;
  const isAdmin = userProfile.role === 'admin';

  if (!isUploader && !isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You can only delete attachments you uploaded',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('staff-documents')
      .remove([currentAttachment.storage_path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete the attachment record
    const { error: deleteError } = await supabase
      .from('staff_ticket_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('Attachment deletion error:', deleteError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DELETION_ERROR',
          message: 'Failed to delete attachment',
          timestamp: new Date().toISOString(),
          request_id: requestId
        }
      });
    }

    // Log analytics event
    await supabase
      .from('staff_analytics')
      .insert({
        event_type: 'attachment_deleted',
        user_id: userProfile.id,
        metadata: {
          attachment_id: attachmentId,
          ticket_id: currentAttachment.ticket_id,
          ticket_number: currentAttachment.ticket.ticket_number,
          filename: currentAttachment.original_filename,
          was_internal: currentAttachment.is_internal,
          request_id: requestId
        }
      });

    return res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.error('Attachment deletion process error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DELETION_PROCESS_ERROR',
        message: 'Attachment deletion process failed',
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }
}