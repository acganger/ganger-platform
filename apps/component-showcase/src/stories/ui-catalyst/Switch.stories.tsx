import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof Switch> = {
  title: '@ganger/ui-catalyst/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toggle switch component for binary on/off states with smooth animations.',
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Default checked state for uncontrolled usage',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the switch',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Switch size',
    },
    color: {
      control: 'select',
      options: ['blue', 'green', 'red', 'purple', 'orange', 'cyan'],
      description: 'Color when checked',
    },
    onChange: {
      action: 'changed',
      description: 'Change event handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    defaultChecked: true,
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Switch size="sm" />
        <span className="text-sm">Small</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Switch size="md" defaultChecked />
        <span>Medium (default)</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Switch size="lg" />
        <span className="text-lg">Large</span>
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <label className="flex items-center gap-2">
        <Switch defaultChecked color="blue" />
        <span>Blue</span>
      </label>
      
      <label className="flex items-center gap-2">
        <Switch defaultChecked color="green" />
        <span>Green</span>
      </label>
      
      <label className="flex items-center gap-2">
        <Switch defaultChecked color="red" />
        <span>Red</span>
      </label>
      
      <label className="flex items-center gap-2">
        <Switch defaultChecked color="purple" />
        <span>Purple</span>
      </label>
      
      <label className="flex items-center gap-2">
        <Switch defaultChecked color="orange" />
        <span>Orange</span>
      </label>
      
      <label className="flex items-center gap-2">
        <Switch defaultChecked color="cyan" />
        <span>Cyan</span>
      </label>
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <label className="flex items-center justify-between w-64 cursor-pointer">
        <span>Email Notifications</span>
        <Switch defaultChecked />
      </label>
      
      <label className="flex items-center justify-between w-64 cursor-pointer">
        <span>SMS Alerts</span>
        <Switch />
      </label>
      
      <label className="flex items-center justify-between w-64 cursor-pointer text-neutral-500">
        <span>Push Notifications</span>
        <Switch disabled />
      </label>
      
      <label className="flex items-center justify-between w-64 cursor-pointer">
        <div>
          <div className="font-medium">Dark Mode</div>
          <div className="text-sm text-neutral-600">Use dark theme</div>
        </div>
        <Switch defaultChecked color="purple" />
      </label>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [isEnabled, setIsEnabled] = useState(false);
      
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <Switch 
              checked={isEnabled} 
              onChange={(e) => setIsEnabled(e.target.checked)} 
            />
            <span>Feature is {isEnabled ? 'enabled' : 'disabled'}</span>
          </label>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsEnabled(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Enable
            </button>
            <button
              onClick={() => setIsEnabled(false)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Disable
            </button>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className="px-3 py-1 text-sm border rounded hover:bg-neutral-50"
            >
              Toggle
            </button>
          </div>
        </div>
      );
    };
    
    return <ControlledDemo />;
  },
};

export const SettingsForm: Story = {
  render: () => {
    const SettingsDemo = () => {
      const [settings, setSettings] = useState({
        notifications: true,
        autoSave: true,
        publicProfile: false,
        twoFactor: true,
        analytics: false,
        newsletter: true,
      });
      
      const handleChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, [key]: e.target.checked }));
      };
      
      return (
        <div className="w-96 space-y-6 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Account Settings</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Notifications
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Email notifications</span>
                  <Switch 
                    checked={settings.notifications}
                    onChange={handleChange('notifications')}
                    color="blue"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Marketing emails</span>
                  <Switch 
                    checked={settings.newsletter}
                    onChange={handleChange('newsletter')}
                    color="blue"
                  />
                </label>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Privacy & Security
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm">Public profile</div>
                    <div className="text-xs text-neutral-500">
                      Make your profile visible to everyone
                    </div>
                  </div>
                  <Switch 
                    checked={settings.publicProfile}
                    onChange={handleChange('publicProfile')}
                    color="purple"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-sm">Two-factor authentication</div>
                    <div className="text-xs text-neutral-500">
                      Add an extra layer of security
                    </div>
                  </div>
                  <Switch 
                    checked={settings.twoFactor}
                    onChange={handleChange('twoFactor')}
                    color="green"
                  />
                </label>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                Preferences
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Auto-save drafts</span>
                  <Switch 
                    checked={settings.autoSave}
                    onChange={handleChange('autoSave')}
                    color="cyan"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm">Analytics tracking</span>
                  <Switch 
                    checked={settings.analytics}
                    onChange={handleChange('analytics')}
                    color="orange"
                  />
                </label>
              </div>
            </div>
          </div>
          
          <button className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
            Save Settings
          </button>
        </div>
      );
    };
    
    return <SettingsDemo />;
  },
};

export const FeatureFlags: Story = {
  render: () => (
    <div className="p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Feature Flags</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded">
          <div>
            <div className="font-medium text-green-900 dark:text-green-100">
              New Dashboard
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">
              Enabled for all users
            </div>
          </div>
          <Switch defaultChecked color="green" />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded">
          <div>
            <div className="font-medium text-orange-900 dark:text-orange-100">
              Beta Features
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">
              Testing with 50% of users
            </div>
          </div>
          <Switch defaultChecked color="orange" />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded">
          <div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
              Maintenance Mode
            </div>
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              Currently disabled
            </div>
          </div>
          <Switch color="red" />
        </div>
      </div>
    </div>
  ),
};

export const MedicalSettings: Story = {
  render: () => (
    <div className="w-96 space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Clinical Preferences</h3>
      
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm font-medium">Allergy Alerts</div>
            <div className="text-xs text-neutral-500">Show critical allergy warnings</div>
          </div>
          <Switch defaultChecked color="red" />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm font-medium">Drug Interactions</div>
            <div className="text-xs text-neutral-500">Check for medication conflicts</div>
          </div>
          <Switch defaultChecked color="orange" />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm font-medium">Lab Result Notifications</div>
            <div className="text-xs text-neutral-500">Alert when results are ready</div>
          </div>
          <Switch defaultChecked color="blue" />
        </label>
        
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm font-medium">Appointment Reminders</div>
            <div className="text-xs text-neutral-500">Send automated reminders</div>
          </div>
          <Switch defaultChecked color="green" />
        </label>
      </div>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
        <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse" />
        <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">With ARIA Labels</h4>
        <Switch aria-label="Enable notifications" defaultChecked />
        <p className="text-sm text-neutral-600 mt-2">
          Switch with aria-label for screen readers
        </p>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">With Description</h4>
        <label className="flex items-center gap-3">
          <Switch aria-describedby="switch-desc" />
          <span>Advanced mode</span>
        </label>
        <p id="switch-desc" className="text-sm text-neutral-600 mt-2">
          Enables advanced features and settings
        </p>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">Focus States</h4>
        <p className="text-sm text-neutral-600 mb-3">
          Tab through these switches to see focus indicators
        </p>
        <div className="flex gap-4">
          <Switch />
          <Switch defaultChecked />
          <Switch disabled />
        </div>
      </div>
    </div>
  ),
};