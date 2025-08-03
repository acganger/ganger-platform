import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader, Button } from '@ganger/ui-catalyst';

const meta: Meta<typeof PageHeader> = {
  title: '@ganger/ui-catalyst/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Page header component with title, description, and optional action buttons.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title',
    },
    description: {
      control: 'text',
      description: 'Optional page description',
    },
    children: {
      control: false,
      description: 'Action buttons or other content',
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

export const WithDescription: Story = {
  args: {
    title: 'Patient Management',
    description: 'View and manage patient records, appointments, and medical history',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Inventory',
    description: 'Manage medical supplies and equipment',
    children: (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Export</Button>
        <Button color="blue" size="sm">Add Item</Button>
      </div>
    ),
  },
};

export const ComplexActions: Story = {
  args: {
    title: 'Staff Schedule',
    description: 'Manage provider schedules and shift assignments',
    children: (
      <div className="flex items-center gap-4">
        <select className="px-3 py-1.5 text-sm border rounded">
          <option>This Week</option>
          <option>Next Week</option>
          <option>This Month</option>
        </select>
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download
        </Button>
        <Button color="green" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Shift
        </Button>
      </div>
    ),
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Electronic Health Records Management System Administration Panel',
    description: 'Configure system settings, user permissions, and integration options for the EHR platform',
  },
};

export const Breadcrumbs: Story = {
  render: () => (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <a href="#" className="hover:text-neutral-900">Home</a>
        <span>/</span>
        <a href="#" className="hover:text-neutral-900">Patients</a>
        <span>/</span>
        <span className="text-neutral-900">John Doe</span>
      </nav>
      
      <PageHeader 
        title="John Doe"
        description="Patient ID: 12345 • DOB: 01/15/1980 • Last Visit: 03/20/2025"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Medical History</Button>
          <Button variant="outline" size="sm">Prescriptions</Button>
          <Button color="blue" size="sm">New Appointment</Button>
        </div>
      </PageHeader>
    </div>
  ),
};

export const WithStats: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader 
        title="Analytics Dashboard"
        description="Real-time metrics and performance indicators"
      >
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </PageHeader>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-cyan-600">156</div>
          <div className="text-sm text-neutral-600">Patients Today</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">98%</div>
          <div className="text-sm text-neutral-600">Satisfaction</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">24</div>
          <div className="text-sm text-neutral-600">Active Staff</div>
        </div>
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">3.2</div>
          <div className="text-sm text-neutral-600">Avg Wait (min)</div>
        </div>
      </div>
    </div>
  ),
};

export const WithTabs: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader 
        title="Settings"
        description="Manage your account and application preferences"
      />
      
      <div className="border-b">
        <nav className="flex gap-8">
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
            Integrations
          </button>
        </nav>
      </div>
      
      <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg">
        <p>Settings content goes here...</p>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  args: {
    title: 'Mobile View',
    description: 'Responsive header for small screens',
    children: (
      <Button color="blue" size="sm" className="w-full sm:w-auto">
        Action
      </Button>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const EmptyState: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader 
        title="Appointments"
        description="Schedule and manage patient appointments"
      >
        <Button color="blue" size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </Button>
      </PageHeader>
      
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="w-16 h-16 text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No appointments scheduled</h3>
        <p className="text-neutral-600 mb-4">Get started by creating your first appointment</p>
        <Button color="blue">Schedule Appointment</Button>
      </div>
    </div>
  ),
};

export const LoadingState: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader 
        title="Loading..."
        description="Please wait while we fetch your data"
      />
      
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  ),
};