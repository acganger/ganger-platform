import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, TableSkeleton, CardSkeleton, SkeletonLegacy } from '@ganger/ui-catalyst';

const meta: Meta<typeof Skeleton> = {
  title: '@ganger/ui-catalyst/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst skeleton loaders for showing loading states with various presets.',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    width: {
      control: 'text',
      description: 'Width of skeleton',
    },
    height: {
      control: 'text',
      description: 'Height of skeleton',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    className: 'w-32 h-4',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-2">Text Lines</p>
        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
      
      <div>
        <p className="text-sm mb-2">Heading</p>
        <Skeleton className="w-48 h-8" />
      </div>
      
      <div>
        <p className="text-sm mb-2">Button</p>
        <Skeleton className="w-24 h-10 rounded" />
      </div>
      
      <div>
        <p className="text-sm mb-2">Avatar</p>
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
      </div>
    </div>
  ),
};

export const TableSkeletonDemo: Story = {
  render: () => (
    <div className="w-[600px]">
      <h3 className="text-sm font-semibold mb-3">Table Loading State</h3>
      <TableSkeleton rows={5} columns={4} />
    </div>
  ),
};

export const CardSkeletonDemo: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Skeleton</h3>
        <div className="space-y-2">
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-3/4 h-4" />
          <TableSkeleton rows={3} columns={3} />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Skeleton</h3>
        <div className="space-y-2">
          <SkeletonLegacy className="w-full h-4" />
          <SkeletonLegacy className="w-3/4 h-4" />
        </div>
      </div>
    </div>
  ),
};

export const FormSkeleton: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div>
        <Skeleton className="w-20 h-4 mb-1" />
        <Skeleton className="w-full h-10 rounded" />
      </div>
      <div>
        <Skeleton className="w-24 h-4 mb-1" />
        <Skeleton className="w-full h-10 rounded" />
      </div>
      <div>
        <Skeleton className="w-32 h-4 mb-1" />
        <Skeleton className="w-full h-20 rounded" />
      </div>
      <Skeleton className="w-24 h-10 rounded" />
    </div>
  ),
};

export const ProfileSkeleton: Story = {
  render: () => (
    <div className="w-96 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="w-32 h-6 mb-2" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <Skeleton className="w-16 h-3 mb-1" />
          <Skeleton className="w-full h-4" />
        </div>
        <div>
          <Skeleton className="w-20 h-3 mb-1" />
          <Skeleton className="w-3/4 h-4" />
        </div>
        <div>
          <Skeleton className="w-24 h-3 mb-1" />
          <Skeleton className="w-1/2 h-4" />
        </div>
      </div>
    </div>
  ),
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
        <Skeleton className="w-48 h-6 mb-4" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  ),
};

export const ListSkeleton: Story = {
  render: () => (
    <div className="w-96 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-lg">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="w-32 h-4 mb-1" />
            <Skeleton className="w-24 h-3" />
          </div>
          <Skeleton className="w-16 h-6 rounded" />
        </div>
      ))}
    </div>
  ),
};

export const AnimatedSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm mb-2">Pulse Animation (default)</p>
        <Skeleton className="w-64 h-4 animate-pulse" />
      </div>
      
      <div>
        <p className="text-sm mb-2">Wave Animation</p>
        <div className="w-64 h-4 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden relative">
          <div className="absolute inset-0 -translate-x-full animate-[wave_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes wave {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  ),
};