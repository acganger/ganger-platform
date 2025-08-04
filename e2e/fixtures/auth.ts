import { test as base } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Extend the basic test to include authentication
export const test = base.extend<{
  authenticatedPage: void;
}>({
  authenticatedPage: [async ({ page, context }, use) => {
    // This fixture will handle authentication when it's working
    // For now, it's a placeholder that can be used later
    
    const authFile = path.join(__dirname, '../.auth/user.json');
    
    // Check if we have saved authentication state
    if (fs.existsSync(authFile)) {
      // Load the stored authentication state
      await context.addCookies(JSON.parse(fs.readFileSync(authFile, 'utf-8')));
    } else {
      // In the future, this would:
      // 1. Navigate to login page
      // 2. Perform OAuth login
      // 3. Save the authentication state
      
      console.log('Authentication not implemented yet');
    }
    
    // Use the page with authentication
    await use();
  }],
});

export { expect } from '@playwright/test';

/**
 * Save authentication state for reuse
 */
export async function saveAuthState(context: any) {
  const cookies = await context.cookies();
  const authDir = path.join(__dirname, '../.auth');
  
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(authDir, 'user.json'),
    JSON.stringify(cookies, null, 2)
  );
}

/**
 * Clear saved authentication state
 */
export function clearAuthState() {
  const authFile = path.join(__dirname, '../.auth/user.json');
  if (fs.existsSync(authFile)) {
    fs.unlinkSync(authFile);
  }
}