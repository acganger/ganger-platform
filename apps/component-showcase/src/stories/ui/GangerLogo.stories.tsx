import type { Meta, StoryObj } from '@storybook/react';
import { GangerLogo, GangerHeader, GangerLogoCompact } from '@ganger/ui';

const meta: Meta<typeof GangerLogo> = {
  title: '@ganger/ui/GangerLogo',
  component: GangerLogo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Ganger Dermatology branding components including logo variations and header.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Logo size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GangerLogo>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-600 mb-2">Small</p>
        <GangerLogo size="sm" />
      </div>
      <div>
        <p className="text-sm text-neutral-600 mb-2">Medium (default)</p>
        <GangerLogo size="md" />
      </div>
      <div>
        <p className="text-sm text-neutral-600 mb-2">Large</p>
        <GangerLogo size="lg" />
      </div>
      <div>
        <p className="text-sm text-neutral-600 mb-2">Extra Large</p>
        <GangerLogo size="xl" />
      </div>
    </div>
  ),
};

export const CompactLogo: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-neutral-600 mb-2">Compact Logo (Icon only)</p>
        <GangerLogoCompact />
      </div>
      <div>
        <p className="text-sm text-neutral-600 mb-2">Compact Logo - Large</p>
        <GangerLogoCompact size="lg" />
      </div>
    </div>
  ),
};

export const Header: Story = {
  render: () => (
    <div className="w-full">
      <GangerHeader />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const OnDarkBackground: Story = {
  render: () => (
    <div className="bg-neutral-900 p-8 rounded-lg space-y-4">
      <GangerLogo className="text-white" />
      <GangerLogoCompact className="text-white" />
    </div>
  ),
};

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-4">
      <GangerLogo className="text-cyan-600" />
      <GangerLogo className="text-green-600" />
      <GangerLogo className="text-purple-600" />
    </div>
  ),
};

export const InNavigation: Story = {
  render: () => (
    <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <GangerLogo size="sm" />
        <div className="flex items-center gap-6">
          <a href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Dashboard
          </a>
          <a href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Patients
          </a>
          <a href="#" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
            Settings
          </a>
        </div>
      </div>
    </nav>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const ResponsiveLogo: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="block sm:hidden">
        <GangerLogoCompact />
      </div>
      <div className="hidden sm:block">
        <GangerLogo />
      </div>
      <p className="text-sm text-neutral-600">Resize window to see responsive behavior</p>
    </div>
  ),
};