import type { Meta, StoryObj } from '@storybook/react';
import { Badge, BadgeLegacy } from '@ganger/ui-catalyst';

const meta: Meta<typeof Badge> = {
  title: '@ganger/ui-catalyst/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst badge component with 18 color variants and enhanced styling.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Badge content',
    },
    color: {
      control: 'select',
      options: [
        'zinc', 'neutral', 'stone', 'gray', 'slate', 
        'red', 'orange', 'amber', 'yellow',
        'lime', 'green', 'emerald', 'teal', 'cyan',
        'sky', 'blue', 'indigo', 'violet', 'purple',
        'fuchsia', 'pink', 'rose'
      ],
      description: 'Color variant (18 Catalyst colors)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
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

export const AllColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 max-w-2xl">
      <Badge color="zinc">Zinc</Badge>
      <Badge color="neutral">Neutral</Badge>
      <Badge color="stone">Stone</Badge>
      <Badge color="gray">Gray</Badge>
      <Badge color="slate">Slate</Badge>
      <Badge color="red">Red</Badge>
      <Badge color="orange">Orange</Badge>
      <Badge color="amber">Amber</Badge>
      <Badge color="yellow">Yellow</Badge>
      <Badge color="lime">Lime</Badge>
      <Badge color="green">Green</Badge>
      <Badge color="emerald">Emerald</Badge>
      <Badge color="teal">Teal</Badge>
      <Badge color="cyan">Cyan</Badge>
      <Badge color="sky">Sky</Badge>
      <Badge color="blue">Blue</Badge>
      <Badge color="indigo">Indigo</Badge>
      <Badge color="violet">Violet</Badge>
      <Badge color="purple">Purple</Badge>
      <Badge color="fuchsia">Fuchsia</Badge>
      <Badge color="pink">Pink</Badge>
      <Badge color="rose">Rose</Badge>
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

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Badge (18 colors)</h3>
        <div className="flex gap-2 flex-wrap">
          <Badge color="blue">Primary</Badge>
          <Badge color="green">Success</Badge>
          <Badge color="yellow">Warning</Badge>
          <Badge color="red">Error</Badge>
          <Badge color="purple">Special</Badge>
          <Badge color="cyan">Info</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Badge (6 variants)</h3>
        <div className="flex gap-2 flex-wrap">
          <BadgeLegacy variant="primary">Primary</BadgeLegacy>
          <BadgeLegacy variant="success">Success</BadgeLegacy>
          <BadgeLegacy variant="warning">Warning</BadgeLegacy>
          <BadgeLegacy variant="error">Error</BadgeLegacy>
          <BadgeLegacy variant="info">Info</BadgeLegacy>
          <BadgeLegacy variant="default">Default</BadgeLegacy>
        </div>
      </div>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Status:</span>
        <Badge color="green" size="sm">Active</Badge>
        <Badge color="yellow" size="sm">Pending</Badge>
        <Badge color="red" size="sm">Inactive</Badge>
        <Badge color="gray" size="sm">Archived</Badge>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Priority:</span>
        <Badge color="red">High</Badge>
        <Badge color="orange">Medium</Badge>
        <Badge color="blue">Low</Badge>
      </div>
    </div>
  ),
};

export const WithNumbers: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge color="blue">12</Badge>
      <Badge color="red">99+</Badge>
      <Badge color="green" size="lg">NEW</Badge>
      <Badge color="purple">v2.0</Badge>
    </div>
  ),
};

export const InlineUsage: Story = {
  render: () => (
    <div className="space-y-3">
      <p className="text-sm">
        New feature available <Badge color="green" size="sm">NEW</Badge> in the latest release
      </p>
      <p className="text-sm">
        Status: <Badge color="yellow">Under Review</Badge> by the medical team
      </p>
      <p className="text-sm">
        Priority: <Badge color="red">Urgent</Badge> - requires immediate attention
      </p>
    </div>
  ),
};

export const BadgeGroups: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Patient Record</h3>
        <div className="flex gap-2 flex-wrap">
          <Badge color="blue">Male</Badge>
          <Badge color="purple">45 years</Badge>
          <Badge color="green">Insured</Badge>
          <Badge color="orange">Allergies</Badge>
        </div>
      </div>
      
      <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
        <h3 className="font-semibold mb-2">Appointment Details</h3>
        <div className="flex gap-2 flex-wrap">
          <Badge color="cyan">Dermatology</Badge>
          <Badge color="emerald">Confirmed</Badge>
          <Badge color="violet">30 min</Badge>
          <Badge color="pink">First Visit</Badge>
        </div>
      </div>
    </div>
  ),
};

export const DotBadges: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm">Online</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500" />
        <span className="text-sm">Away</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm">Busy</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-500" />
        <span className="text-sm">Offline</span>
      </div>
    </div>
  ),
};