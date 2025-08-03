import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@ganger/ui';

const meta: Meta<typeof Avatar> = {
  title: '@ganger/ui/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Avatar component for displaying user profile images or initials.',
      },
    },
  },
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the avatar',
    },
    name: {
      control: 'text',
      description: 'Name to generate initials from if no image',
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'away', 'busy'],
      description: 'Status indicator',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: 'Shape of the avatar',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    alt: 'John Doe',
  },
};

export const WithInitials: Story = {
  args: {
    name: 'John Doe',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar size="sm" name="Small Avatar" />
      <Avatar size="md" name="Medium Avatar" />
      <Avatar size="lg" name="Large Avatar" />
      <Avatar size="xl" name="Extra Large" />
    </div>
  ),
};

export const WithStatus: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar name="Online User" status="online" />
      <Avatar name="Away User" status="away" />
      <Avatar name="Busy User" status="busy" />
      <Avatar name="Offline User" status="offline" />
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex gap-4">
      <Avatar shape="circle" name="Circle Shape" />
      <Avatar shape="square" name="Square Shape" />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1" alt="User 1" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2" alt="User 2" />
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=User3" alt="User 3" />
      <Avatar name="+3" className="bg-neutral-300 dark:bg-neutral-700" />
    </div>
  ),
};

export const ErrorFallback: Story = {
  args: {
    src: 'https://invalid-url.com/image.jpg',
    name: 'Fallback User',
    alt: 'User with invalid image URL',
  },
};