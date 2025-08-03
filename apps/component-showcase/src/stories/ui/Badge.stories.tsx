import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@ganger/ui';

const meta: Meta<typeof Badge> = {
  title: '@ganger/ui/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Badge component for displaying status indicators, labels, or counts.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Content of the badge',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
      description: 'Visual variant of the badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    rounded: {
      control: 'boolean',
      description: 'Whether the badge has rounded corners',
    },
    dot: {
      control: 'boolean',
      description: 'Show as a dot indicator',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

export const WithNumbers: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="primary">12</Badge>
      <Badge variant="error">99+</Badge>
      <Badge variant="success">New</Badge>
    </div>
  ),
};

export const DotIndicators: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="success" dot />
        <span>Online</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning" dot />
        <span>Away</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="error" dot />
        <span>Busy</span>
      </div>
    </div>
  ),
};

export const InlineWithText: Story = {
  render: () => (
    <div className="space-y-2">
      <p>
        New feature available <Badge variant="success" size="sm">NEW</Badge>
      </p>
      <p>
        Status: <Badge variant="warning">Pending Review</Badge>
      </p>
      <p>
        Priority: <Badge variant="error">High</Badge>
      </p>
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
        Custom Purple
      </Badge>
      <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
        Custom Pink
      </Badge>
    </div>
  ),
};