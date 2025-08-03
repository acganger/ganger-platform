import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { AllTheProviders } from './test-wrappers';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  user?: any;
}

/**
 * Custom render function that includes all necessary providers
 */
export function render(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { route = '/', user, ...renderOptions } = options || {};

  // Set up router mock with custom route
  if (route !== '/') {
    const router = require('next/router');
    router.useRouter.mockImplementation(() => ({
      route,
      pathname: route,
      query: {},
      asPath: route,
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }));
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders user={user}>{children}</AllTheProviders>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';