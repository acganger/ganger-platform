import type { Meta, StoryObj } from '@storybook/react';
import { AppLayout } from '@ganger/ui';

const meta: Meta<typeof AppLayout> = {
  title: '@ganger/ui/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main application layout component that provides the structure for Ganger Platform apps.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'The main content of the layout',
    },
    title: {
      control: 'text',
      description: 'Page title displayed in the header',
    },
    showSidebar: {
      control: 'boolean',
      description: 'Whether to show the sidebar navigation',
    },
    showHeader: {
      control: 'boolean',
      description: 'Whether to show the header',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Welcome to Ganger Platform</h1>
        <p>This is the main content area of the application.</p>
      </div>
    ),
  },
};

export const WithoutSidebar: Story = {
  args: {
    title: 'Fullwidth Page',
    showSidebar: false,
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Full Width Content</h1>
        <p>This layout doesn't include a sidebar, giving more space to the content.</p>
      </div>
    ),
  },
};

export const WithoutHeader: Story = {
  args: {
    showHeader: false,
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Content Only</h1>
        <p>This layout hides the header for a more immersive experience.</p>
      </div>
    ),
  },
};

export const ComplexContent: Story = {
  args: {
    title: 'Inventory Management',
    children: (
      <div className="p-8 space-y-6">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600">152</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">89</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">In Stock</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">12</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">Low Stock</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-neutral-600 dark:text-neutral-400">View recent inventory transactions here.</p>
        </div>
      </div>
    ),
  },
};