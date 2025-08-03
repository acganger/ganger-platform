import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from '@ganger/ui';

const meta: Meta<typeof StatCard> = {
  title: '@ganger/ui/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Statistics card component for displaying metrics with optional trends.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Stat title/label',
    },
    value: {
      control: 'text',
      description: 'Main statistic value',
    },
    change: {
      control: 'text',
      description: 'Change value (e.g., +12%)',
    },
    changeType: {
      control: 'select',
      options: ['increase', 'decrease', 'neutral'],
      description: 'Type of change for color coding',
    },
    icon: {
      control: false,
      description: 'Optional icon element',
    },
    footer: {
      control: 'text',
      description: 'Footer text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    title: 'Total Patients',
    value: '1,234',
  },
};

export const WithChange: Story = {
  args: {
    title: 'Monthly Revenue',
    value: '$45,678',
    change: '+12.5%',
    changeType: 'increase',
  },
};

export const Decrease: Story = {
  args: {
    title: 'Wait Time',
    value: '18 min',
    change: '-5 min',
    changeType: 'decrease',
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Appointments Today',
    value: '45',
    change: '+3',
    changeType: 'increase',
    footer: 'vs. yesterday',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Active Staff',
    value: '28',
    icon: (
      <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total Patients"
        value="1,234"
        change="+8%"
        changeType="increase"
        footer="from last month"
      />
      <StatCard
        title="Appointments"
        value="892"
        change="+45"
        changeType="increase"
        footer="this week"
      />
      <StatCard
        title="Avg Wait Time"
        value="12 min"
        change="-3 min"
        changeType="decrease"
        footer="improvement"
      />
      <StatCard
        title="Satisfaction"
        value="98%"
        change="0%"
        changeType="neutral"
        footer="no change"
      />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <StatCard
        title="Success Metric"
        value="95%"
        change="+5%"
        changeType="increase"
        className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      />
      <StatCard
        title="Warning Metric"
        value="68%"
        change="-2%"
        changeType="decrease"
        className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
      />
      <StatCard
        title="Error Metric"
        value="12"
        change="+3"
        changeType="increase"
        className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <StatCard
      title="Loading..."
      value={
        <div className="space-y-2">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2" />
        </div>
      }
    />
  ),
};

export const CustomContent: Story = {
  render: () => (
    <StatCard
      title="Inventory Status"
      value={
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold">152</span>
          <span className="text-lg text-neutral-500 mb-1">/ 200</span>
        </div>
      }
      footer={
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '76%' }} />
        </div>
      }
    />
  ),
};

export const Compact: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-2 w-64">
      <StatCard
        title="In Stock"
        value="89"
        className="p-3"
      />
      <StatCard
        title="Low Stock"
        value="12"
        className="p-3"
      />
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="New Patients"
          value="45"
          change="+12%"
          changeType="increase"
          icon={
            <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <StatCard
          title="Revenue"
          value="$125.4K"
          change="+8.2%"
          changeType="increase"
          icon={
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Appointments"
          value="234"
          change="-3"
          changeType="decrease"
          footer="vs last week"
        />
        <StatCard
          title="Staff Active"
          value="42/45"
          change="93%"
          changeType="neutral"
        />
      </div>
    </div>
  ),
};