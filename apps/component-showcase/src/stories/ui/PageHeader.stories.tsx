import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader, Button, Badge } from '@ganger/ui';

const meta: Meta<typeof PageHeader> = {
  title: '@ganger/ui/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Page header component for consistent page titles and actions.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title',
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle',
    },
    breadcrumbs: {
      control: 'object',
      description: 'Breadcrumb navigation items',
    },
    actions: {
      control: false,
      description: 'Action buttons',
    },
    children: {
      control: false,
      description: 'Additional content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Dashboard',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Patient Records',
    subtitle: 'Manage and view all patient information',
  },
};

export const WithBreadcrumbs: Story = {
  args: {
    title: 'John Doe',
    breadcrumbs: [
      { label: 'Patients', href: '/patients' },
      { label: 'Active', href: '/patients/active' },
      { label: 'John Doe' },
    ],
  },
};

export const WithActions: Story = {
  args: {
    title: 'Inventory',
    actions: (
      <div className="flex gap-2">
        <Button variant="outline">Export</Button>
        <Button variant="primary">Add Item</Button>
      </div>
    ),
  },
};

export const Complete: Story = {
  args: {
    title: 'Appointments',
    subtitle: 'Manage today\'s appointments and schedule',
    breadcrumbs: [
      { label: 'Dashboard', href: '/' },
      { label: 'Schedule', href: '/schedule' },
      { label: 'Appointments' },
    ],
    actions: (
      <div className="flex items-center gap-3">
        <Badge variant="info">45 Total</Badge>
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Filter
        </Button>
        <Button variant="primary" size="sm">
          New Appointment
        </Button>
      </div>
    ),
  },
};

export const WithStats: Story = {
  render: () => (
    <PageHeader
      title="Monthly Report"
      subtitle="Performance metrics for November 2025"
      actions={
        <Button variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </Button>
      }
    >
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-cyan-600">1,234</div>
          <div className="text-sm text-neutral-600">Total Patients</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">892</div>
          <div className="text-sm text-neutral-600">Appointments</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">45</div>
          <div className="text-sm text-neutral-600">Pending</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">98%</div>
          <div className="text-sm text-neutral-600">Satisfaction</div>
        </div>
      </div>
    </PageHeader>
  ),
};

export const WithTabs: Story = {
  render: () => (
    <PageHeader
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="flex gap-6 mt-6 border-b">
        <button className="pb-3 border-b-2 border-cyan-600 text-cyan-600 font-medium">
          General
        </button>
        <button className="pb-3 border-b-2 border-transparent text-neutral-600 hover:text-neutral-900">
          Security
        </button>
        <button className="pb-3 border-b-2 border-transparent text-neutral-600 hover:text-neutral-900">
          Notifications
        </button>
        <button className="pb-3 border-b-2 border-transparent text-neutral-600 hover:text-neutral-900">
          Billing
        </button>
      </div>
    </PageHeader>
  ),
};

export const Minimal: Story = {
  args: {
    title: 'Simple Page',
  },
};

export const WithBackButton: Story = {
  render: () => (
    <PageHeader
      title="Patient Details"
      breadcrumbs={[
        { 
          label: (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Patients
            </div>
          ), 
          href: '/patients' 
        },
      ]}
      actions={
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="danger">Delete</Button>
        </div>
      }
    />
  ),
};