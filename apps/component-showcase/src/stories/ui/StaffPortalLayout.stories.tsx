import type { Meta, StoryObj } from '@storybook/react';
import { StaffPortalLayout } from '@ganger/ui';
import { withMockAuth } from '../mocks/auth';

const meta: Meta<typeof StaffPortalLayout> = {
  title: '@ganger/ui/StaffPortalLayout',
  component: StaffPortalLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Staff portal layout wrapper with navigation and authentication. Requires AuthProvider context.',
      },
    },
  },
  decorators: [withMockAuth],
  argTypes: {
    currentApp: {
      control: 'select',
      options: ['inventory', 'handouts', 'kiosk', 'actions', 'staffing', 'call-center'],
      description: 'Currently active app for navigation highlighting',
    },
    children: {
      control: false,
      description: 'Page content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof StaffPortalLayout>;

export const Default: Story = {
  args: {
    currentApp: 'inventory',
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Inventory Management</h1>
        <p>This is the main content area wrapped by StaffPortalLayout.</p>
      </div>
    ),
  },
};

export const DifferentApps: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden h-48">
        <StaffPortalLayout currentApp="inventory">
          <div className="p-4">
            <h2 className="font-semibold">Inventory App</h2>
          </div>
        </StaffPortalLayout>
      </div>
      
      <div className="border rounded-lg overflow-hidden h-48">
        <StaffPortalLayout currentApp="handouts">
          <div className="p-4">
            <h2 className="font-semibold">Patient Handouts App</h2>
          </div>
        </StaffPortalLayout>
      </div>
      
      <div className="border rounded-lg overflow-hidden h-48">
        <StaffPortalLayout currentApp="actions">
          <div className="p-4">
            <h2 className="font-semibold">Ganger Actions App</h2>
          </div>
        </StaffPortalLayout>
      </div>
    </div>
  ),
};

export const WithComplexContent: Story = {
  args: {
    currentApp: 'staffing',
    children: (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Clinical Staffing</h1>
          <p className="text-neutral-600">Manage provider schedules and assignments</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-cyan-600">12</div>
            <div className="text-sm text-neutral-600">Active Providers</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">45</div>
            <div className="text-sm text-neutral-600">Appointments Today</div>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">3</div>
            <div className="text-sm text-neutral-600">Open Shifts</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span>Dr. Smith</span>
              <span className="text-sm text-neutral-600">9:00 AM - 5:00 PM</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Dr. Jones</span>
              <span className="text-sm text-neutral-600">8:00 AM - 4:00 PM</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Dr. Brown</span>
              <span className="text-sm text-neutral-600">10:00 AM - 6:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
};

export const MobileView: Story = {
  args: {
    currentApp: 'call-center',
    children: (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Call Center Operations</h1>
        <p className="text-sm">Mobile-optimized view of the staff portal layout.</p>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithNotifications: Story = {
  args: {
    currentApp: 'inventory',
    children: (
      <div className="p-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Low Stock Alert
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                5 items are running low on inventory. Review and reorder soon.
              </p>
            </div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Main content area with notification banner.</p>
      </div>
    ),
  },
};