import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner, LoadingSpinnerLegacy } from '@ganger/ui-catalyst';

const meta: Meta<typeof LoadingSpinner> = {
  title: '@ganger/ui-catalyst/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst loading spinner with multiple color options and sizes.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Spinner size',
    },
    color: {
      control: 'select',
      options: ['zinc', 'blue', 'green', 'red', 'purple', 'cyan', 'orange'],
      description: 'Spinner color',
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
    <div className="flex items-center gap-6">
      <LoadingSpinner color="zinc" />
      <LoadingSpinner color="blue" />
      <LoadingSpinner color="green" />
      <LoadingSpinner color="red" />
      <LoadingSpinner color="purple" />
      <LoadingSpinner color="cyan" />
      <LoadingSpinner color="orange" />
    </div>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Spinner</h3>
        <div className="flex gap-4">
          <LoadingSpinner color="blue" size="lg" />
          <LoadingSpinner color="green" size="lg" />
          <LoadingSpinner color="purple" size="lg" />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Spinner</h3>
        <div className="flex gap-4">
          <LoadingSpinnerLegacy size="lg" />
          <LoadingSpinnerLegacy size="lg" color="secondary" />
          <LoadingSpinnerLegacy size="lg" color="white" className="bg-neutral-800 p-2 rounded" />
        </div>
      </div>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LoadingSpinner size="sm" color="blue" />
        <span>Loading...</span>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" color="purple" />
        <p className="text-sm text-neutral-600">Processing your request</p>
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <LoadingSpinner size="sm" color="green" />
        <span className="text-sm">Saving changes...</span>
      </div>
    </div>
  ),
};

export const InButtons: Story = {
  render: () => (
    <div className="space-y-4">
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2" disabled>
        <LoadingSpinner size="sm" className="text-white" />
        Processing...
      </button>
      
      <button className="px-4 py-2 border border-neutral-300 rounded flex items-center gap-2" disabled>
        <LoadingSpinner size="sm" color="zinc" />
        Loading
      </button>
      
      <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-3 text-lg" disabled>
        <LoadingSpinner size="md" className="text-white" />
        Submitting Form
      </button>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="w-96 bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Loading Data</h3>
          <LoadingSpinner size="sm" color="blue" />
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
        </div>
      </div>
      
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-xl">
          <LoadingSpinner size="xl" color="purple" />
          <p className="mt-4 text-center">Loading application...</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const CustomAnimations: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="text-center">
        <LoadingSpinner className="animate-spin" />
        <p className="text-sm mt-2">Spin (default)</p>
      </div>
      <div className="text-center">
        <LoadingSpinner className="animate-pulse" />
        <p className="text-sm mt-2">Pulse</p>
      </div>
      <div className="text-center">
        <LoadingSpinner className="animate-bounce" />
        <p className="text-sm mt-2">Bounce</p>
      </div>
    </div>
  ),
};