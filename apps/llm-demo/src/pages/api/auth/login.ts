import { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@ganger/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (data?.url) {
    res.redirect(data.url);
  }
}