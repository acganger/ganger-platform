// Stub file to prevent import errors
// The real implementation is in google-workspace-service.ts.disabled
// This reduces build time by removing the 144MB+ googleapis dependency

export function getGoogleWorkspaceService() {
  throw new Error('Google Workspace functionality is temporarily disabled to improve build times');
}

export function validateGoogleWorkspaceConfig() {
  return { valid: false, error: 'Google Workspace functionality is temporarily disabled' };
}