import React, { ReactNode, useState, useEffect } from 'react';
import { ThemeProvider } from '@ganger/ui';

// Mock ThemeProvider for Storybook stories
export const MockThemeProvider = ({ 
  children,
  defaultTheme = 'light' 
}: { 
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}) => {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      {children}
    </ThemeProvider>
  );
};

// Mock decorator for Storybook with theme toggle
export const withMockTheme = (Story: React.ComponentType, context: any) => {
  // Get theme from Storybook globals
  const theme = context.globals?.theme || 'light';
  
  return (
    <MockThemeProvider defaultTheme={theme}>
      <Story />
    </MockThemeProvider>
  );
};

// Combined mock provider for components that need both auth and theme
export const MockProviders = ({ 
  children,
  defaultTheme = 'light' 
}: { 
  children: ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
}) => {
  return (
    <MockThemeProvider defaultTheme={defaultTheme}>
      {children}
    </MockThemeProvider>
  );
};