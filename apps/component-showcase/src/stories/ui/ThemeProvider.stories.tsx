import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, useTheme, Button, Card, CardContent } from '@ganger/ui';
import { useState } from 'react';

const ThemeDemo = () => {
  const { theme, setTheme, actualTheme } = useTheme();
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Current theme: <strong>{theme}</strong>
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Actual theme (resolved): <strong>{actualTheme}</strong>
            </p>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'outline'}
              onClick={() => setTheme('system')}
            >
              System
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Sample Content</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This content adapts to the current theme automatically.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              Status indicator with theme support
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const meta: Meta<typeof ThemeProvider> = {
  title: '@ganger/ui/ThemeProvider',
  component: ThemeProvider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Theme provider component that manages light/dark/system theme preferences with localStorage persistence.',
      },
    },
  },
  argTypes: {
    defaultTheme: {
      control: 'select',
      options: ['light', 'dark', 'system'],
      description: 'Default theme preference',
    },
    storageKey: {
      control: 'text',
      description: 'localStorage key for theme persistence',
    },
    children: {
      control: false,
      description: 'Child components',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

export const Default: Story = {
  render: () => (
    <ThemeProvider>
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const DarkDefault: Story = {
  render: () => (
    <ThemeProvider defaultTheme="dark">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const SystemDefault: Story = {
  render: () => (
    <ThemeProvider defaultTheme="system">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const CustomStorageKey: Story = {
  render: () => (
    <ThemeProvider storageKey="custom-theme-key">
      <ThemeDemo />
    </ThemeProvider>
  ),
};

export const ColorShowcase: Story = {
  render: () => (
    <ThemeProvider>
      <div className="space-y-6">
        <ThemeDemo />
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="h-24 bg-cyan-600 rounded-lg mb-2" />
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-neutral-600">Cyan</p>
            </div>
            <div>
              <div className="h-24 bg-green-600 rounded-lg mb-2" />
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-neutral-600">Green</p>
            </div>
            <div>
              <div className="h-24 bg-orange-600 rounded-lg mb-2" />
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-neutral-600">Orange</p>
            </div>
            <div>
              <div className="h-24 bg-red-600 rounded-lg mb-2" />
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs text-neutral-600">Red</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Neutral Colors</h3>
          <div className="flex gap-2">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
              <div key={shade} className="flex-1">
                <div 
                  className={`h-12 bg-neutral-${shade} dark:bg-neutral-${shade} rounded border`}
                />
                <p className="text-xs text-center mt-1">{shade}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ThemeProvider>
  ),
};

export const ComponentsInTheme: Story = {
  render: () => (
    <ThemeProvider>
      <div className="space-y-6">
        <ThemeDemo />
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Buttons</h4>
            <div className="flex gap-2 flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Form Elements</h4>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Input field" 
                className="w-full px-3 py-2 border rounded dark:bg-neutral-800 dark:border-neutral-700"
              />
              <select className="w-full px-3 py-2 border rounded dark:bg-neutral-800 dark:border-neutral-700">
                <option>Select option</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  ),
};

export const NestedProviders: Story = {
  render: () => (
    <ThemeProvider defaultTheme="light">
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg">
        <p className="mb-4">Outer theme provider (light default)</p>
        
        <ThemeProvider defaultTheme="dark">
          <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border">
            <p>Nested theme provider (dark default)</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Note: In practice, you should only use one ThemeProvider at the root of your app.
            </p>
          </div>
        </ThemeProvider>
      </div>
    </ThemeProvider>
  ),
};