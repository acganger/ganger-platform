import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ganger/ui';

const meta: Meta<typeof Tabs> = {
  title: '@ganger/ui/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tabs component for organizing content into switchable panels.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Default active tab',
    },
    value: {
      control: 'text',
      description: 'Controlled active tab',
    },
    onValueChange: {
      action: 'changed',
      description: 'Tab change handler',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Tab orientation',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-96">
      <TabsList>
        <TabsTrigger value="tab1">General</TabsTrigger>
        <TabsTrigger value="tab2">Security</TabsTrigger>
        <TabsTrigger value="tab3">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4">
          <h3 className="font-semibold mb-2">General Settings</h3>
          <p className="text-sm text-neutral-600">Configure your general account settings here.</p>
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Security Settings</h3>
          <p className="text-sm text-neutral-600">Manage your security preferences and authentication.</p>
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4">
          <h3 className="font-semibold mb-2">Notification Preferences</h3>
          <p className="text-sm text-neutral-600">Choose how you want to be notified.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Overview
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Reports
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        <p>Overview content with icon</p>
      </TabsContent>
      <TabsContent value="analytics" className="mt-4">
        <p>Analytics content with icon</p>
      </TabsContent>
      <TabsContent value="reports" className="mt-4">
        <p>Reports content with icon</p>
      </TabsContent>
    </Tabs>
  ),
};

export const VerticalTabs: Story = {
  render: () => (
    <Tabs defaultValue="profile" orientation="vertical" className="flex gap-4 w-[600px]">
      <TabsList className="flex-col h-fit">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="profile">
          <h3 className="text-lg font-semibold mb-4">Profile Settings</h3>
          <p>Update your profile information</p>
        </TabsContent>
        <TabsContent value="account">
          <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
          <p>Manage your account details</p>
        </TabsContent>
        <TabsContent value="appearance">
          <h3 className="text-lg font-semibold mb-4">Appearance</h3>
          <p>Customize how the app looks</p>
        </TabsContent>
        <TabsContent value="notifications">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <p>Configure notification preferences</p>
        </TabsContent>
        <TabsContent value="display">
          <h3 className="text-lg font-semibold mb-4">Display</h3>
          <p>Adjust display settings</p>
        </TabsContent>
      </div>
    </Tabs>
  ),
};

export const DisabledTabs: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-96">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
        <TabsTrigger value="another">Another</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="p-4">This tab is active and clickable.</p>
      </TabsContent>
      <TabsContent value="another">
        <p className="p-4">This is another active tab.</p>
      </TabsContent>
    </Tabs>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="inbox" className="w-96">
      <TabsList>
        <TabsTrigger value="inbox" className="flex items-center gap-2">
          Inbox
          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
        </TabsTrigger>
        <TabsTrigger value="sent">Sent</TabsTrigger>
        <TabsTrigger value="drafts" className="flex items-center gap-2">
          Drafts
          <span className="bg-neutral-400 text-white text-xs px-1.5 py-0.5 rounded-full">12</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inbox">
        <div className="p-4">
          <p>You have 3 new messages in your inbox.</p>
        </div>
      </TabsContent>
      <TabsContent value="sent">
        <div className="p-4">
          <p>Your sent messages appear here.</p>
        </div>
      </TabsContent>
      <TabsContent value="drafts">
        <div className="p-4">
          <p>You have 12 draft messages.</p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const FormTabs: Story = {
  render: () => (
    <Tabs defaultValue="basic" className="w-[600px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="medical">Medical History</TabsTrigger>
        <TabsTrigger value="insurance">Insurance</TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input type="text" className="w-full px-3 py-2 border rounded" placeholder="John" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input type="text" className="w-full px-3 py-2 border rounded" placeholder="Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input type="date" className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input type="tel" className="w-full px-3 py-2 border rounded" placeholder="(555) 123-4567" />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="medical" className="space-y-4">
        <h3 className="text-lg font-semibold">Medical History</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Allergies</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Current Medications</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Previous Surgeries</span>
          </label>
        </div>
      </TabsContent>
      <TabsContent value="insurance" className="space-y-4">
        <h3 className="text-lg font-semibold">Insurance Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Insurance Provider</label>
            <select className="w-full px-3 py-2 border rounded">
              <option>Select provider</option>
              <option>Blue Cross Blue Shield</option>
              <option>Aetna</option>
              <option>Cigna</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Policy Number</label>
            <input type="text" className="w-full px-3 py-2 border rounded" placeholder="XXX-XXX-XXXX" />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
};