// Re-export Supabase client utilities from @ganger/auth
export { 
  getSupabaseClient as getSupabase,
  createAppSupabaseClient as createSupabaseClient,
  getTypedSupabaseClient,
  supabase
} from '@ganger/auth';

// Backward compatibility helpers
export const isAuthenticated = async () => {
  const { getSupabaseClient } = await import('@ganger/auth');
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return !!user;
};

export const getCurrentUser = async () => {
  const { getSupabaseClient } = await import('@ganger/auth');
  const client = getSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};
