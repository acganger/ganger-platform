import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@ganger/auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export async function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authorization header required' 
        });
      }
      
      const token = authHeader.substring(7);
      
      // Create Supabase client
      const supabase = getSupabaseClient();
      
      // Verify the token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'Authentication required to access this resource' 
        });
      }
      
      // Check if user has staff email domain
      if (!user.email || !user.email.endsWith('@gangerdermatology.com')) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Access restricted to Ganger Dermatology staff' 
        });
      }
      
      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'staff'
      };
      
      // Call the actual handler
      return handler(authenticatedReq, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Authentication check failed' 
      });
    }
  };
}