import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/styles/globals.css';
import { withMockTheme } from '../src/stories/mocks/theme';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    withMockTheme,
    (Story) => (
      <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8">
        <Story />
      </div>
    ),
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light mode' },
          { value: 'dark', icon: 'moon', title: 'Dark mode' },
          { value: 'system', icon: 'browser', title: 'System preference' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;