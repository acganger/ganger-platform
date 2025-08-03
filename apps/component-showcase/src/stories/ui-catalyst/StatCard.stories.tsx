import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from '@ganger/ui-catalyst';

const meta: Meta<typeof StatCard> = {
  title: '@ganger/ui-catalyst/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Statistics card component for displaying metrics with optional trends and comparisons.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Stat title or label',
    },
    value: {
      control: 'text',
      description: 'Main stat value',
    },
    change: {
      control: 'text',
      description: 'Change percentage or value',
    },
    changeType: {
      control: 'select',
      options: ['increase', 'decrease', 'neutral'],
      description: 'Type of change indicator',
    },
    subtitle: {
      control: 'text',
      description: 'Additional context or time period',
    },
    icon: {
      control: false,
      description: 'Optional icon element',
    },
    color: {
      control: 'select',
      options: ['blue', 'green', 'red', 'purple', 'orange', 'cyan'],
      description: 'Color theme for the card',
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
    title: 'Revenue',
    value: '$45,678',
    change: '+12.5%',
    changeType: 'increase',
    subtitle: 'vs last month',
  },
};

export const Decrease: Story = {
  args: {
    title: 'Wait Time',
    value: '8 min',
    change: '-23%',
    changeType: 'decrease',
    subtitle: 'vs last week',
  },
};

export const WithIcon: Story = {
  args: {
    title: 'Active Staff',
    value: '42',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
};

export const ColorVariants: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        title="Appointments"
        value="156"
        change="+8%"
        changeType="increase"
        color="blue"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
      
      <StatCard
        title="Revenue"
        value="$12.4K"
        change="+15%"
        changeType="increase"
        color="green"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      
      <StatCard
        title="Cancellations"
        value="3"
        change="-40%"
        changeType="decrease"
        color="red"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
      />
      
      <StatCard
        title="New Patients"
        value="28"
        change="+5"
        changeType="increase"
        color="purple"
        subtitle="this week"
      />
      
      <StatCard
        title="Avg Rating"
        value="4.8"
        change="0%"
        changeType="neutral"
        color="orange"
        subtitle="out of 5"
      />
      
      <StatCard
        title="Procedures"
        value="89"
        change="+12"
        changeType="increase"
        color="cyan"
        subtitle="today"
      />
    </div>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Clinic Overview</h3>
      
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Patients"
          value="8,234"
          change="+125"
          changeType="increase"
          subtitle="new this month"
          color="blue"
        />
        
        <StatCard
          title="Appointments Today"
          value="47"
          change="+5%"
          changeType="increase"
          subtitle="vs yesterday"
          color="green"
        />
        
        <StatCard
          title="Avg Wait Time"
          value="12 min"
          change="-3 min"
          changeType="decrease"
          subtitle="improvement"
          color="purple"
        />
        
        <StatCard
          title="Staff Utilization"
          value="87%"
          change="+2%"
          changeType="increase"
          subtitle="efficiency"
          color="orange"
        />
      </div>
      
      <h3 className="text-lg font-semibold mt-8">Financial Metrics</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Monthly Revenue"
          value="$284,592"
          change="+18.2%"
          changeType="increase"
          subtitle="vs last month"
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Outstanding Claims"
          value="$45,123"
          change="-$8,450"
          changeType="decrease"
          subtitle="reduction"
          color="cyan"
        />
        
        <StatCard
          title="Collection Rate"
          value="94.2%"
          change="+1.8%"
          changeType="increase"
          subtitle="improvement"
          color="purple"
        />
      </div>
    </div>
  ),
};

export const Minimal: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="Active" value="142" />
      <StatCard title="Pending" value="28" />
      <StatCard title="Completed" value="967" />
      <StatCard title="Cancelled" value="13" />
    </div>
  ),
};

export const LargeNumbers: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        title="Total Records Processed"
        value="1,234,567"
        change="+123,456"
        changeType="increase"
        subtitle="last 30 days"
      />
      
      <StatCard
        title="Data Storage Used"
        value="892.4 GB"
        change="+45.2 GB"
        changeType="increase"
        subtitle="of 1 TB limit"
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-3" />
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
      </div>
      
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-3" />
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
      </div>
      
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg border animate-pulse">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-3" />
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2" />
        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-20" />
      </div>
    </div>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Desktop (4 columns)</h4>
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Metric 1" value="123" />
          <StatCard title="Metric 2" value="456" />
          <StatCard title="Metric 3" value="789" />
          <StatCard title="Metric 4" value="012" />
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Tablet (2 columns)</h4>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <StatCard title="Metric 1" value="123" />
          <StatCard title="Metric 2" value="456" />
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Mobile (1 column)</h4>
        <div className="grid grid-cols-1 gap-4 max-w-xs">
          <StatCard title="Metric 1" value="123" change="+10%" changeType="increase" />
        </div>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="p-6 bg-neutral-900 rounded-lg">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Dark Mode Stat"
          value="1,234"
          change="+15%"
          changeType="increase"
          color="blue"
        />
        
        <StatCard
          title="Another Metric"
          value="89%"
          change="-2%"
          changeType="decrease"
          color="red"
        />
        
        <StatCard
          title="Neutral Stat"
          value="456"
          subtitle="no change"
          color="purple"
        />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};