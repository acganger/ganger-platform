import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@ganger/ui';
import { useState } from 'react';

const meta: Meta<typeof Switch> = {
  title: '@ganger/ui/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toggle switch component for binary on/off states.',
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the switch is on',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler',
    },
    label: {
      control: 'text',
      description: 'Label text',
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
      options: ['primary', 'success', 'warning', 'error'],
      description: 'Color when checked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    label: 'Enable notifications',
  },
};

export const Checked: Story = {
  args: {
    label: 'This switch is on',
    checked: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch size="sm" label="Small switch" />
      <Switch size="md" label="Medium switch (default)" />
      <Switch size="lg" label="Large switch" />
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch color="primary" label="Primary (default)" defaultChecked />
      <Switch color="success" label="Success" defaultChecked />
      <Switch color="warning" label="Warning" defaultChecked />
      <Switch color="error" label="Error" defaultChecked />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4">
      <Switch label="Normal switch" />
      <Switch label="Checked switch" defaultChecked />
      <Switch label="Disabled off" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
    </div>
  ),
};

export const NoLabel: Story = {
  args: {
    'aria-label': 'Toggle setting',
  },
};

export const Interactive: Story = {
  render: () => {
    const InteractiveDemo = () => {
      const [isOn, setIsOn] = useState(false);
      
      return (
        <div className="space-y-4">
          <Switch
            checked={isOn}
            onChange={(e) => setIsOn(e.target.checked)}
            label={`Switch is ${isOn ? 'ON' : 'OFF'}`}
          />
          <p className="text-sm text-neutral-600">
            Current state: {isOn ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      );
    };
    
    return <InteractiveDemo />;
  },
};

export const SettingsPanel: Story = {
  render: () => {
    const SettingsDemo = () => {
      const [settings, setSettings] = useState({
        emailNotifications: true,
        smsAlerts: false,
        pushNotifications: true,
        marketingEmails: false,
        darkMode: false,
      });
      
      const updateSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
      };
      
      return (
        <div className="w-96 bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-neutral-600">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onChange={() => updateSetting('emailNotifications')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-neutral-600">Get text message alerts</p>
              </div>
              <Switch
                checked={settings.smsAlerts}
                onChange={() => updateSetting('smsAlerts')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-neutral-600">Browser push notifications</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onChange={() => updateSetting('pushNotifications')}
              />
            </div>
            
            <hr className="my-4" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-neutral-600">Promotional content</p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onChange={() => updateSetting('marketingEmails')}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-neutral-600">Use dark theme</p>
              </div>
              <Switch
                checked={settings.darkMode}
                onChange={() => updateSetting('darkMode')}
              />
            </div>
          </div>
        </div>
      );
    };
    
    return <SettingsDemo />;
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <Switch label="Enable notifications" />
      </div>
      
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <Switch label="Lock on exit" />
      </div>
    </div>
  ),
};