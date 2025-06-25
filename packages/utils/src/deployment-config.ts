/**
 * Get the base path and asset prefix for the current deployment
 * - In standalone deployment (Vercel): no prefix
 * - In staff portal deployment: use the app-specific prefix
 */
export function getDeploymentConfig(appPath: string) {
  // If deployed standalone on Vercel, no prefix needed
  if (process.env.VERCEL && !process.env.STAFF_PORTAL_MODE) {
    return {
      basePath: '',
      assetPrefix: ''
    };
  }
  
  // Otherwise use the configured path for staff portal routing
  return {
    basePath: appPath,
    assetPrefix: appPath
  };
}
