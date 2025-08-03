import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarLegacy } from '@ganger/ui-catalyst';

const meta: Meta<typeof Avatar> = {
  title: '@ganger/ui-catalyst/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst avatar component with enhanced styling and legacy compatibility.',
      },
    },
  },
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    initials: {
      control: 'text',
      description: 'Initials to display when no image',
    },
    alt: {
      control: 'text',
      description: 'Alt text for accessibility',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Avatar size',
    },
    color: {
      control: 'select',
      options: ['zinc', 'blue', 'green', 'red', 'purple', 'orange', 'pink'],
      description: 'Background color for initials',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: 'Avatar shape',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Catalyst',
    alt: 'User Avatar',
  },
};

export const WithInitials: Story = {
  args: {
    initials: 'JD',
    alt: 'John Doe',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="xs" initials="XS" />
      <Avatar size="sm" initials="SM" />
      <Avatar size="md" initials="MD" />
      <Avatar size="lg" initials="LG" />
      <Avatar size="xl" initials="XL" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar initials="ZN" color="zinc" />
      <Avatar initials="BL" color="blue" />
      <Avatar initials="GR" color="green" />
      <Avatar initials="RD" color="red" />
      <Avatar initials="PR" color="purple" />
      <Avatar initials="OR" color="orange" />
      <Avatar initials="PK" color="pink" />
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar shape="circle" initials="CR" />
      <Avatar shape="square" initials="SQ" />
    </div>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Avatar</h3>
        <div className="flex gap-4">
          <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Modern" />
          <Avatar initials="CA" color="blue" />
          <Avatar initials="TA" color="green" size="lg" />
          <Avatar initials="LY" color="purple" shape="square" />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Avatar</h3>
        <div className="flex gap-4">
          <AvatarLegacy src="https://api.dicebear.com/7.x/avataaars/svg?seed=Legacy" />
          <AvatarLegacy name="Legacy User" />
          <AvatarLegacy name="Old Style" size="lg" />
          <AvatarLegacy name="Square Shape" shape="square" />
        </div>
      </div>
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex -space-x-2">
        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" className="ring-2 ring-white" />
        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" className="ring-2 ring-white" />
        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" className="ring-2 ring-white" />
        <Avatar initials="+5" color="zinc" className="ring-2 ring-white" />
      </div>
      
      <div className="flex -space-x-3">
        <Avatar size="lg" initials="JS" color="blue" className="ring-2 ring-white" />
        <Avatar size="lg" initials="MB" color="green" className="ring-2 ring-white" />
        <Avatar size="lg" initials="KL" color="purple" className="ring-2 ring-white" />
        <Avatar size="lg" initials="RW" color="orange" className="ring-2 ring-white" />
      </div>
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex gap-4">
      <div className="relative">
        <Avatar initials="ON" />
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
      </div>
      <div className="relative">
        <Avatar initials="AW" />
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-yellow-500 ring-2 ring-white" />
      </div>
      <div className="relative">
        <Avatar initials="BS" />
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
      </div>
      <div className="relative">
        <Avatar initials="OF" />
        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-gray-500 ring-2 ring-white" />
      </div>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
        <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=DrSmith" size="lg" />
        <div>
          <h3 className="font-semibold">Dr. Sarah Smith</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Dermatologist</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
        <Avatar initials="JD" color="purple" />
        <div className="flex-1">
          <h3 className="font-semibold">John Doe</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Patient</p>
        </div>
        <span className="text-sm text-neutral-500">2:30 PM</span>
      </div>
    </div>
  ),
};