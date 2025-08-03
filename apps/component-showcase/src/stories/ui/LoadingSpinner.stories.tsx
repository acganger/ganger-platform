import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from '@ganger/ui';

const meta: Meta<typeof LoadingSpinner> = {
  title: '@ganger/ui/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Loading spinner component for indicating loading states.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the spinner',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'white', 'black'],
      description: 'Color variant of the spinner',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <LoadingSpinner size="sm" />
        <p className="text-sm mt-2">Small</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="text-sm mt-2">Medium</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm mt-2">Large</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <p className="text-sm mt-2">Extra Large</p>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <LoadingSpinner color="primary" />
      <LoadingSpinner color="secondary" />
      <div className="bg-neutral-800 p-4 rounded">
        <LoadingSpinner color="white" />
      </div>
      <LoadingSpinner color="black" />
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span>Loading...</span>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-neutral-600">Processing your request</p>
      </div>
    </div>
  ),
};

export const InButton: Story = {
  render: () => (
    <div className="space-y-4">
      <button className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 flex items-center gap-2" disabled>
        <LoadingSpinner size="sm" color="white" />
        Saving...
      </button>
      
      <button className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded flex items-center gap-2" disabled>
        <LoadingSpinner size="sm" />
        Processing
      </button>
    </div>
  ),
};

export const FullScreen: Story = {
  render: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-xl">
        <LoadingSpinner size="xl" />
        <p className="mt-4 text-center">Loading application...</p>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const InCard: Story = {
  render: () => (
    <div className="w-96 bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Data Loading</h3>
        <LoadingSpinner size="sm" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
      </div>
    </div>
  ),
};

export const CustomAnimation: Story = {
  render: () => (
    <div className="space-y-4">
      <LoadingSpinner className="animate-spin" />
      <LoadingSpinner className="animate-pulse" />
      <LoadingSpinner className="animate-bounce" />
    </div>
  ),
};