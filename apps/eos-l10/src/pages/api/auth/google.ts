import { NextApiRequest, NextApiResponse } from 'next';
// import { createSupabaseServerClient } from '@ganger/auth/utils/supabase';
import { supabase } from '@/lib/supabase';

export const runtime = 'experimental-edge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // const supabase = createSupabaseServerClient();
  // Using client-side supabase for now - TODO: implement server-side client

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        hd: 'gangerdermatology.com' // Restrict to Ganger Dermatology domain
      }
    }
  });

  if (error) {
    return res.status(500).json({ error: 'Authentication failed' });
  }

  // Redirect to Google OAuth
  return res.redirect(data.url);
}