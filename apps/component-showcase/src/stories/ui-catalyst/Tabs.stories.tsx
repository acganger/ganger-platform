import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, Card, CardContent, Button, Badge } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof Tabs> = {
  title: '@ganger/ui-catalyst/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tab navigation component for organizing content into switchable panels.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Default active tab value',
    },
    value: {
      control: 'text',
      description: 'Controlled active tab value',
    },
    onValueChange: {
      action: 'changed',
      description: 'Callback when tab changes',
    },
    tabs: {
      control: false,
      description: 'Array of tab configurations',
    },
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
      description: 'Visual style variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    defaultValue: 'tab1',
    tabs: [
      { 
        value: 'tab1', 
        label: 'Tab 1', 
        content: <div className="p-4">Content for Tab 1</div> 
      },
      { 
        value: 'tab2', 
        label: 'Tab 2', 
        content: <div className="p-4">Content for Tab 2</div> 
      },
      { 
        value: 'tab3', 
        label: 'Tab 3', 
        content: <div className="p-4">Content for Tab 3</div> 
      },
    ],
  },
};

export const Pills: Story = {
  args: {
    variant: 'pills',
    defaultValue: 'overview',
    tabs: [
      { 
        value: 'overview', 
        label: 'Overview', 
        content: <div className="p-4">Overview content</div> 
      },
      { 
        value: 'details', 
        label: 'Details', 
        content: <div className="p-4">Details content</div> 
      },
      { 
        value: 'settings', 
        label: 'Settings', 
        content: <div className="p-4">Settings content</div> 
      },
    ],
  },
};

export const Underline: Story = {
  args: {
    variant: 'underline',
    defaultValue: 'profile',
    tabs: [
      { 
        value: 'profile', 
        label: 'Profile', 
        content: <div className="p-4">Profile information</div> 
      },
      { 
        value: 'security', 
        label: 'Security', 
        content: <div className="p-4">Security settings</div> 
      },
      { 
        value: 'billing', 
        label: 'Billing', 
        content: <div className="p-4">Billing information</div> 
      },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    defaultValue: 'dashboard',
    tabs: [
      { 
        value: 'dashboard', 
        label: (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </div>
        ),
        content: <div className="p-4">Dashboard content</div> 
      },
      { 
        value: 'analytics', 
        label: (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </div>
        ),
        content: <div className="p-4">Analytics content</div> 
      },
      { 
        value: 'reports', 
        label: (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reports
          </div>
        ),
        content: <div className="p-4">Reports content</div> 
      },
    ],
  },
};

export const WithBadges: Story = {
  args: {
    defaultValue: 'inbox',
    tabs: [
      { 
        value: 'inbox', 
        label: (
          <div className="flex items-center gap-2">
            Inbox
            <Badge color="red" size="sm">24</Badge>
          </div>
        ),
        content: <div className="p-4">Inbox messages</div> 
      },
      { 
        value: 'sent', 
        label: 'Sent',
        content: <div className="p-4">Sent messages</div> 
      },
      { 
        value: 'drafts', 
        label: (
          <div className="flex items-center gap-2">
            Drafts
            <Badge color="gray" size="sm">3</Badge>
          </div>
        ),
        content: <div className="p-4">Draft messages</div> 
      },
    ],
  },
};

export const Controlled: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [activeTab, setActiveTab] = useState('tab1');
      
      return (
        <div className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={[
              { 
                value: 'tab1', 
                label: 'First Tab', 
                content: <div className="p-4">First tab content</div> 
              },
              { 
                value: 'tab2', 
                label: 'Second Tab', 
                content: <div className="p-4">Second tab content</div> 
              },
              { 
                value: 'tab3', 
                label: 'Third Tab', 
                content: <div className="p-4">Third tab content</div> 
              },
            ]}
          />
          
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setActiveTab('tab1')}>Go to Tab 1</Button>
            <Button size="sm" onClick={() => setActiveTab('tab2')}>Go to Tab 2</Button>
            <Button size="sm" onClick={() => setActiveTab('tab3')}>Go to Tab 3</Button>
          </div>
          
          <p className="text-sm text-neutral-600">
            Active tab: <strong>{activeTab}</strong>
          </p>
        </div>
      );
    };
    
    return <ControlledDemo />;
  },
};

export const PatientRecord: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Patient: John Doe</h3>
      
      <Tabs
        defaultValue="overview"
        variant="underline"
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <div className="p-4 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-neutral-600">DOB:</span> 01/15/1980
                      </div>
                      <div>
                        <span className="text-neutral-600">Age:</span> 45
                      </div>
                      <div>
                        <span className="text-neutral-600">Gender:</span> Male
                      </div>
                      <div>
                        <span className="text-neutral-600">MRN:</span> 123456
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: 'medical',
            label: 'Medical History',
            content: (
              <div className="p-4 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Conditions</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Hypertension (2019)</li>
                      <li>• Type 2 Diabetes (2021)</li>
                      <li>• Seasonal Allergies</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: 'medications',
            label: 'Medications',
            content: (
              <div className="p-4 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Current Medications</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Metformin 1000mg - Twice daily</li>
                      <li>• Lisinopril 10mg - Once daily</li>
                      <li>• Atorvastatin 20mg - Once daily</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: 'labs',
            label: (
              <div className="flex items-center gap-2">
                Lab Results
                <Badge color="red" size="sm">New</Badge>
              </div>
            ),
            content: (
              <div className="p-4 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Recent Labs (03/15/2025)</h4>
                    <div className="text-sm space-y-1">
                      <div>HbA1c: 6.8%</div>
                      <div>Cholesterol: 185 mg/dL</div>
                      <div>Blood Pressure: 128/82</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  ),
};

export const SettingsPage: Story = {
  render: () => (
    <div className="max-w-4xl">
      <h3 className="text-lg font-semibold mb-4">Settings</h3>
      
      <Tabs
        defaultValue="general"
        variant="pills"
        tabs={[
          {
            value: 'general',
            label: 'General',
            content: (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input type="text" className="w-full px-3 py-2 border rounded" defaultValue="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border rounded" defaultValue="john@example.com" />
                </div>
                <Button color="blue">Save Changes</Button>
              </div>
            ),
          },
          {
            value: 'notifications',
            label: 'Notifications',
            content: (
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span>Email notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span>SMS notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" />
                    <span>Push notifications</span>
                  </label>
                </div>
                <Button color="blue">Update Preferences</Button>
              </div>
            ),
          },
          {
            value: 'security',
            label: 'Security',
            content: (
              <div className="p-6 space-y-4">
                <Button variant="outline">Change Password</Button>
                <Button variant="outline">Enable Two-Factor Auth</Button>
                <Button variant="outline" color="red">Delete Account</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  ),
};

export const DisabledTabs: Story = {
  args: {
    defaultValue: 'active',
    tabs: [
      { 
        value: 'active', 
        label: 'Active', 
        content: <div className="p-4">Active content</div> 
      },
      { 
        value: 'disabled1', 
        label: 'Disabled Tab', 
        disabled: true,
        content: <div className="p-4">This content is not accessible</div> 
      },
      { 
        value: 'another', 
        label: 'Another Tab', 
        content: <div className="p-4">Another tab content</div> 
      },
      { 
        value: 'disabled2', 
        label: 'Also Disabled', 
        disabled: true,
        content: <div className="p-4">This content is not accessible</div> 
      },
    ],
  },
};

export const ManyTabs: Story = {
  args: {
    defaultValue: 'tab1',
    tabs: Array.from({ length: 10 }, (_, i) => ({
      value: `tab${i + 1}`,
      label: `Tab ${i + 1}`,
      content: <div className="p-4">Content for Tab {i + 1}</div>,
    })),
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Desktop View</h4>
        <Tabs
          defaultValue="tab1"
          tabs={[
            { value: 'tab1', label: 'Dashboard', content: <div className="p-4">Dashboard</div> },
            { value: 'tab2', label: 'Analytics', content: <div className="p-4">Analytics</div> },
            { value: 'tab3', label: 'Reports', content: <div className="p-4">Reports</div> },
            { value: 'tab4', label: 'Settings', content: <div className="p-4">Settings</div> },
          ]}
        />
      </div>
      
      <div className="max-w-sm">
        <h4 className="font-medium mb-3">Mobile View</h4>
        <Tabs
          defaultValue="tab1"
          variant="pills"
          tabs={[
            { value: 'tab1', label: 'Home', content: <div className="p-4">Home</div> },
            { value: 'tab2', label: 'Stats', content: <div className="p-4">Stats</div> },
            { value: 'tab3', label: 'More', content: <div className="p-4">More</div> },
          ]}
        />
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="p-6 bg-neutral-900 rounded-lg">
      <Tabs
        defaultValue="overview"
        variant="underline"
        tabs={[
          { 
            value: 'overview', 
            label: 'Overview', 
            content: <div className="p-4 text-white">Dark mode overview content</div> 
          },
          { 
            value: 'details', 
            label: 'Details', 
            content: <div className="p-4 text-white">Dark mode details content</div> 
          },
          { 
            value: 'settings', 
            label: 'Settings', 
            content: <div className="p-4 text-white">Dark mode settings content</div> 
          },
        ]}
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};