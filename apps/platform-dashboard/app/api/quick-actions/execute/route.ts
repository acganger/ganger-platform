import { NextRequest, NextResponse } from 'next/server';
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requestData = ExecuteActionSchema.parse(body);

    // Mock user data for now
    const user = {
      id: '1',
      name: 'Dr. Ganger',
      email: 'ganger@gangerdermatology.com',
      role: 'superadmin'
    };

    // Mock quick actions
    const mockActions: Record<string, QuickAction> = {
      'backup_database': {
        id: '1',
        action_id: 'backup_database',
        display_name: 'Database Backup',
        description: 'Create a backup of the platform database',
        icon_name: 'database',
        button_color: 'blue',
        action_type: 'api_call',
        action_target: '/api/system/backup',
        opens_in_new_tab: false,
        required_permissions: [],
        required_roles: ['superadmin'],
        category: 'system',
        display_order: 1,
        is_system_action: true,
        is_active: true
      },
      'deploy_updates': {
        id: '2',
        action_id: 'deploy_updates',
        display_name: 'Deploy Platform Updates',
        description: 'Deploy pending platform updates',
        icon_name: 'upload',
        button_color: 'green',
        action_type: 'api_call',
        action_target: '/api/system/deploy',
        opens_in_new_tab: false,
        required_permissions: [],
        required_roles: ['superadmin'],
        category: 'system',
        display_order: 2,
        is_system_action: true,
        is_active: true
      },
      'system_monitor': {
        id: '3',
        action_id: 'system_monitor',
        display_name: 'System Monitor',
        description: 'View system performance metrics',
        icon_name: 'chart',
        button_color: 'purple',
        action_type: 'app_launch',
        action_target: '/monitoring',
        opens_in_new_tab: true,
        required_permissions: [],
        required_roles: ['superadmin', 'manager'],
        category: 'monitoring',
        display_order: 1,
        is_system_action: false,
        is_active: true
      }
    };

    const action = mockActions[requestData.actionId];

    if (!action) {
      return NextResponse.json(
        errorResponse('ACTION_NOT_FOUND', 'Quick action not found'),
        { status: 404 }
      );
    }

    // Verify user has access
    if (action.required_roles.length > 0 && !action.required_roles.includes(user.role)) {
      return NextResponse.json(
        errorResponse('ACCESS_DENIED', 'Insufficient permissions to execute this action'),
        { status: 403 }
      );
    }

    // Execute action based on type
    let result: ActionExecutionResult;
    
    try {
      switch (action.action_type) {
        case 'app_launch':
          result = await executeAppLaunchAction(action, user, requestData.parameters);
          break;
        
        case 'external_link':
          result = await executeExternalLinkAction(action, user, requestData.parameters);
          break;
        
        case 'api_call':
          result = await executeAPICallAction(action, user, requestData.parameters);
          break;
        
        case 'modal_form':
          result = await executeModalFormAction(action, user, requestData.parameters);
          break;
        
        default:
          throw new Error(`Unsupported action type: ${action.action_type}`);
      }

      return NextResponse.json(successResponse(result, {
        action_type: action.action_type
      }));

    } catch (executionError) {
      throw executionError;
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('VALIDATION_ERROR', 'Invalid action execution request', error.errors),
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        errorResponse('EXECUTION_FAILED', 'Failed to execute quick action'),
        { status: 500 }
      );
    }
  }
}

// GET /api/quick-actions/execute - Get available quick actions for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock user data
    const user = {
      id: '1',
      role: 'superadmin'
    };

    // Mock quick actions
    const quickActions = [
      {
        id: '1',
        action_id: 'backup_database',
        display_name: 'Database Backup',
        description: 'Create a backup of the platform database',
        icon_name: 'database',
        button_color: 'blue',
        category: 'system',
        required_roles: ['superadmin']
      },
      {
        id: '2',
        action_id: 'deploy_updates',
        display_name: 'Deploy Platform Updates',
        description: 'Deploy pending platform updates',
        icon_name: 'upload',
        button_color: 'green',
        category: 'system',
        required_roles: ['superadmin']
      },
      {
        id: '3',
        action_id: 'system_monitor',
        display_name: 'System Monitor',
        description: 'View system performance metrics',
        icon_name: 'chart',
        button_color: 'purple',
        category: 'monitoring',
        required_roles: ['superadmin', 'manager']
      }
    ];

    // Filter by category if specified
    const filteredActions = category && category !== 'all' 
      ? quickActions.filter(action => action.category === category)
      : quickActions;

    return NextResponse.json(successResponse({
      actions: filteredActions.slice(0, limit),
      totalActions: filteredActions.length,
      categories: ['system', 'monitoring']
    }));

  } catch (error) {
    return NextResponse.json(
      errorResponse('FETCH_FAILED', 'Failed to fetch quick actions'),
      { status: 500 }
    );
  }
}

// Action execution handlers

async function executeAppLaunchAction(
  action: QuickAction, 
  user: any, 
  parameters: any
): Promise<ActionExecutionResult> {
  
  let appUrl = action.action_target;
  
  // Fallback to direct URL construction
  appUrl = action.action_target.startsWith('http') ? action.action_target : `/${action.action_target}`;

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
  
  // Mock API call execution
  const mockResults: Record<string, any> = {
    '/api/system/backup': {
      message: 'Database backup initiated successfully',
      backup_id: `backup_${Date.now()}`,
      estimated_completion: '5 minutes'
    },
    '/api/system/deploy': {
      message: 'Platform deployment started successfully',
      deployment_id: `deploy_${Date.now()}`,
      estimated_completion: '10 minutes'
    }
  };

  const data = mockResults[action.action_target] || {
    message: `${action.display_name} completed successfully`,
    execution_id: `exec_${Date.now()}`
  };

  return {
    action_type: 'api_call',
    data,
    success_message: data.message || `${action.display_name} completed successfully`
  };
}

async function executeModalFormAction(
  action: QuickAction, 
  user: any, 
  _parameters: any
): Promise<ActionExecutionResult> {
  
  // Get form configuration based on action target
  const formConfig = getModalFormConfig(action.action_target, user);
  
  if (!formConfig) {
    throw new Error(`Form configuration not found for ${action.action_target}`);
  }

  return {
    action_type: 'modal_form',
    form_config: formConfig,
    success_message: `${action.display_name} form ready`
  };
}

function getModalFormConfig(formId: string, _user: any): any {
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
        }
      ],
      submit_endpoint: '/api/support/tickets',
      submit_method: 'POST'
    }
  };

  return formConfigs[formId] || null;
}

// Cloudflare Workers Edge Runtime
export const runtime = 'edge';