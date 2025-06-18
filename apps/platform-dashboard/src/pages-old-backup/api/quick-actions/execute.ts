// Platform Entrypoint Dashboard - Quick Actions Execution API
// Handles execution of quick actions and dynamic action processing

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Types for quick actions
interface QuickActionApiResponse<T = any> {
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
    action_type?: string;
  };
}

interface QuickAction {
  id: string;
  action_id: string;
  display_name: string;
  description: string;
  icon_name: string;
  button_color: string;
  action_type: 'app_launch' | 'external_link' | 'modal_form' | 'api_call';
  action_target: string;
  opens_in_new_tab: boolean;
  required_permissions: string[];
  required_roles: string[];
  category: string;
  display_order: number;
  is_system_action: boolean;
  is_active: boolean;
}

interface ActionExecutionResult {
  action_type: string;
  url?: string;
  openInNewTab?: boolean;
  data?: any;
  form_config?: any;
  success_message?: string;
  redirect_url?: string;
}

// Request validation schemas
const ExecuteActionSchema = z.object({
  actionId: z.string().min(1, 'Action ID is required'),
  parameters: z.record(z.any()).optional().default({}),
  session_id: z.string().optional()
});

const CreateActionSchema = z.object({
  action_id: z.string().min(1, 'Action ID is required'),
  display_name: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  icon_name: z.string().min(1, 'Icon name is required'),
  button_color: z.string().optional().default('blue'),
  action_type: z.enum(['app_launch', 'external_link', 'modal_form', 'api_call']),
  action_target: z.string().min(1, 'Action target is required'),
  opens_in_new_tab: z.boolean().optional().default(false),
  required_permissions: z.array(z.string()).optional().default([]),
  required_roles: z.array(z.string()).optional().default([]),
  category: z.string().optional().default('general'),
  display_order: z.number().int().optional().default(0)
});

// Utility functions
function successResponse<T>(data: T, meta?: any): QuickActionApiResponse<T> {
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

function errorResponse(code: string, message: string, details?: any): QuickActionApiResponse {
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

// POST /api/quick-actions/execute - Execute a quick action
async function handlePost(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const request = ExecuteActionSchema.parse(req.body);

    // Get quick action
    const actionResults = await db.query(`
      SELECT * FROM quick_actions 
      WHERE action_id = $1 AND is_active = true
    `, [request.actionId]);

    if (actionResults.length === 0) {
      return res.status(404).json(errorResponse('ACTION_NOT_FOUND', 'Quick action not found'));
    }

    const action: QuickAction = actionResults[0] as unknown as QuickAction;

    // Verify user has access
    if (action.required_roles.length > 0 && !action.required_roles.includes(user.role)) {
      return res.status(403).json(errorResponse('ACCESS_DENIED', 'Insufficient permissions to execute this action'));
    }

    // Execute action based on type
    let result: ActionExecutionResult;
    
    try {
      switch (action.action_type) {
        case 'app_launch':
          result = await executeAppLaunchAction(action, user, request.parameters);
          break;
        
        case 'external_link':
          result = await executeExternalLinkAction(action, user, request.parameters);
          break;
        
        case 'api_call':
          result = await executeAPICallAction(action, user, request.parameters);
          break;
        
        case 'modal_form':
          result = await executeModalFormAction(action, user, request.parameters);
          break;
        
        default:
          throw new Error(`Unsupported action type: ${action.action_type}`);
      }

      // Log action execution
      await logUserActivity({
        user_id: user.id,
        activity_type: 'quick_action',
        target_action: request.actionId,
        session_id: request.session_id,
        metadata: { 
          action_type: action.action_type,
          parameters: request.parameters,
          success: true
        }
      });

      res.status(200).json(successResponse(result, {
        action_type: action.action_type
      }));

    } catch (executionError) {
      
      // Log failed execution
      await logUserActivity({
        user_id: user.id,
        activity_type: 'quick_action',
        target_action: request.actionId,
        session_id: request.session_id,
        metadata: { 
          action_type: action.action_type,
          parameters: request.parameters,
          success: false,
          error: executionError instanceof Error ? executionError.message : String(executionError)
        }
      });

      throw executionError;
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid action execution request', error.errors));
    } else {
      res.status(500).json(errorResponse('EXECUTION_FAILED', 'Failed to execute quick action'));
    }
  }
}

// GET /api/quick-actions/execute - Get available quick actions for user
async function handleGet(req: NextApiRequest, res: NextApiResponse, user: any) {
  try {
    const { category, limit = 20 } = req.query;

    let whereClause = 'WHERE is_active = true';
    const params: any[] = [user.role];

    if (category && category !== 'all') {
      whereClause += ' AND category = $2';
      params.push(category);
    }

    const quickActions = await db.query(`
      SELECT * FROM quick_actions 
      ${whereClause}
        AND (
          required_roles = ARRAY[]::TEXT[] 
          OR $1 = ANY(required_roles)
        )
      ORDER BY display_order ASC, display_name ASC
      LIMIT ${parseInt(String(limit))}
    `, params);

    res.status(200).json(successResponse({
      actions: quickActions,
      totalActions: quickActions.length,
      categories: await getActionCategories(user.role)
    }));

  } catch (error) {
    res.status(500).json(errorResponse('FETCH_FAILED', 'Failed to fetch quick actions'));
  }
}

// Action execution handlers

async function executeAppLaunchAction(
  action: QuickAction, 
  user: any, 
  parameters: any
): Promise<ActionExecutionResult> {
  
  // Get application details
  const appResults = await db.query(`
    SELECT * FROM platform_applications 
    WHERE app_name = $1 AND is_active = true
  `, [action.action_target]);

  let appUrl = action.action_target;
  
  if (appResults.length > 0) {
    const app = appResults[0] as unknown as { app_url?: string; app_name: string; required_roles?: string[] };
    appUrl = app.app_url || `/${app.app_name}`;
    
    // Check if user has access to the application
    if (app.required_roles && app.required_roles.length > 0 && !app.required_roles.includes(user.role)) {
      throw new Error('Insufficient permissions to access this application');
    }
  } else {
    // Fallback to direct URL construction
    appUrl = action.action_target.startsWith('http') ? action.action_target : `/${action.action_target}`;
  }

  // Track app launch
  await logUserActivity({
    user_id: user.id,
    activity_type: 'app_launch',
    target_app: action.action_target,
    session_id: parameters.session_id
  });

  return {
    action_type: 'app_launch',
    url: appUrl,
    openInNewTab: action.opens_in_new_tab,
    success_message: `Launching ${action.display_name}`
  };
}

async function executeExternalLinkAction(
  action: QuickAction, 
  _user: any, 
  _parameters: any
): Promise<ActionExecutionResult> {
  
  // Validate URL
  try {
    new URL(action.action_target);
  } catch {
    throw new Error('Invalid external URL');
  }

  return {
    action_type: 'external_link',
    url: action.action_target,
    openInNewTab: action.opens_in_new_tab,
    success_message: `Opening ${action.display_name}`
  };
}

async function executeAPICallAction(
  action: QuickAction, 
  user: any, 
  parameters: any
): Promise<ActionExecutionResult> {
  
  try {
    // Generate service token for internal API calls
    const serviceToken = await generateServiceToken(user);
    
    const response = await fetch(action.action_target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceToken}`,
        'X-User-ID': user.id,
        'X-User-Role': user.role
      },
      body: JSON.stringify({ 
        user_id: user.id,
        user_role: user.role,
        action_id: action.action_id,
        ...parameters 
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      action_type: 'api_call',
      data,
      success_message: data.message || `${action.display_name} completed successfully`
    };

  } catch (error) {
    throw new Error(`Failed to execute ${action.display_name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function executeModalFormAction(
  action: QuickAction, 
  user: any, 
  _parameters: any
): Promise<ActionExecutionResult> {
  
  // Get form configuration based on action target
  const formConfig = await getModalFormConfig(action.action_target, user);
  
  if (!formConfig) {
    throw new Error(`Form configuration not found for ${action.action_target}`);
  }

  return {
    action_type: 'modal_form',
    form_config: formConfig,
    success_message: `${action.display_name} form ready`
  };
}

// Helper functions

async function getActionCategories(userRole: string): Promise<string[]> {
  const categories = await db.query(`
    SELECT DISTINCT category 
    FROM quick_actions 
    WHERE is_active = true
      AND (
        required_roles = ARRAY[]::TEXT[] 
        OR $1 = ANY(required_roles)
      )
    ORDER BY category ASC
  `, [userRole]);

  return categories.map((cat: any) => cat.category);
}

async function getModalFormConfig(formId: string, _user: any): Promise<any> {
  // Define form configurations for different modal forms
  const formConfigs: Record<string, any> = {
    system_status: {
      title: 'System Status',
      type: 'info',
      fields: [],
      data_endpoint: '/api/system/status',
      readonly: true
    },
    new_support_ticket: {
      title: 'Create Support Ticket',
      type: 'form',
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          placeholder: 'Brief description of the issue'
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: true,
          placeholder: 'Detailed description of the issue'
        },
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' }
          ]
        },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          options: [
            { value: 'hardware', label: 'Hardware' },
            { value: 'software', label: 'Software' },
            { value: 'network', label: 'Network' },
            { value: 'access', label: 'Access' },
            { value: 'other', label: 'Other' }
          ]
        }
      ],
      submit_endpoint: '/api/support/tickets',
      submit_method: 'POST'
    },
    request_time_off: {
      title: 'Request Time Off',
      type: 'form',
      fields: [
        {
          name: 'start_date',
          label: 'Start Date',
          type: 'date',
          required: true
        },
        {
          name: 'end_date',
          label: 'End Date',
          type: 'date',
          required: true
        },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          options: [
            { value: 'vacation', label: 'Vacation' },
            { value: 'sick', label: 'Sick Leave' },
            { value: 'personal', label: 'Personal Day' },
            { value: 'bereavement', label: 'Bereavement' }
          ]
        },
        {
          name: 'reason',
          label: 'Reason (Optional)',
          type: 'textarea',
          placeholder: 'Additional details if needed'
        }
      ],
      submit_endpoint: '/api/staff/time-off-requests',
      submit_method: 'POST'
    }
  };

  return formConfigs[formId] || null;
}

async function generateServiceToken(user: any): Promise<string> {
  // Generate a short-lived service token for internal API calls
  // This would integrate with your auth system
  // For now, return a placeholder
  return `service_token_${user.id}_${Date.now()}`;
}

async function logUserActivity(activity: {
  user_id: string;
  activity_type: string;
  target_app?: string;
  target_action?: string;
  session_id?: string;
  metadata?: any;
}) {
  try {
    await db.query(`
      INSERT INTO user_activity_log (
        user_id, activity_type, target_app, target_action, 
        session_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      activity.user_id,
      activity.activity_type,
      activity.target_app,
      activity.target_action,
      activity.session_id,
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