import type { Meta, StoryObj } from '@storybook/react';
import { LoadingButton, LoadingButtonLegacy } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof LoadingButton> = {
  title: '@ganger/ui-catalyst/LoadingButton',
  component: LoadingButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Button component with built-in loading state management and automatic spinner.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Button label',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    loadingText: {
      control: 'text',
      description: 'Text to show when loading',
    },
    color: {
      control: 'select',
      options: [
        'zinc', 'neutral', 'stone', 'gray', 'slate', 
        'red', 'orange', 'amber', 'yellow',
        'lime', 'green', 'emerald', 'teal', 'cyan',
        'sky', 'blue', 'indigo', 'violet', 'purple',
        'fuchsia', 'pink', 'rose'
      ],
      description: 'Color variant',
    },
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingButton>;

export const Default: Story = {
  args: {
    children: 'Click Me',
    loadingText: 'Loading...',
  },
};

export const LoadingState: Story = {
  args: {
    children: 'Submit',
    loadingText: 'Submitting...',
    loading: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const InteractiveDemo = () => {
      const [loading, setLoading] = useState(false);
      
      const handleClick = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
      };
      
      return (
        <div className="space-y-4">
          <LoadingButton
            loading={loading}
            onClick={handleClick}
            loadingText="Processing..."
            color="blue"
          >
            Simulate API Call
          </LoadingButton>
          <p className="text-sm text-neutral-600">
            Click the button to see the loading state for 2 seconds
          </p>
        </div>
      );
    };
    
    return <InteractiveDemo />;
  },
};

export const Colors: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-2">
      <LoadingButton loading loadingText="Loading..." color="blue">Blue</LoadingButton>
      <LoadingButton loading loadingText="Loading..." color="green">Green</LoadingButton>
      <LoadingButton loading loadingText="Loading..." color="red">Red</LoadingButton>
      <LoadingButton loading loadingText="Loading..." color="purple">Purple</LoadingButton>
      <LoadingButton loading loadingText="Loading..." color="cyan">Cyan</LoadingButton>
      <LoadingButton loading loadingText="Loading..." color="orange">Orange</LoadingButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <LoadingButton size="sm" loading loadingText="Small">Small</LoadingButton>
      <LoadingButton size="md" loading loadingText="Medium">Medium</LoadingButton>
      <LoadingButton size="lg" loading loadingText="Large">Large</LoadingButton>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex gap-2">
        <LoadingButton variant="solid" loading loadingText="Loading...">Solid</LoadingButton>
        <LoadingButton variant="outline" loading loadingText="Loading...">Outline</LoadingButton>
        <LoadingButton variant="ghost" loading loadingText="Loading...">Ghost</LoadingButton>
      </div>
      <div className="flex gap-2">
        <LoadingButton variant="solid" color="green">Solid</LoadingButton>
        <LoadingButton variant="outline" color="green">Outline</LoadingButton>
        <LoadingButton variant="ghost" color="green">Ghost</LoadingButton>
      </div>
    </div>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst LoadingButton</h3>
        <div className="flex gap-2">
          <LoadingButton color="blue" loading loadingText="Saving...">Save</LoadingButton>
          <LoadingButton color="green" loading loadingText="Submitting...">Submit</LoadingButton>
          <LoadingButton color="purple" loadingText="Processing...">Process</LoadingButton>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy LoadingButton</h3>
        <div className="flex gap-2">
          <LoadingButtonLegacy loading>Save</LoadingButtonLegacy>
          <LoadingButtonLegacy loading variant="secondary">Submit</LoadingButtonLegacy>
          <LoadingButtonLegacy>Process</LoadingButtonLegacy>
        </div>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => {
    const FormDemo = () => {
      const [saving, setSaving] = useState(false);
      const [deleting, setDeleting] = useState(false);
      
      const handleSave = () => {
        setSaving(true);
        setTimeout(() => {
          setSaving(false);
          alert('Saved successfully!');
        }, 1500);
      };
      
      const handleDelete = () => {
        setDeleting(true);
        setTimeout(() => {
          setDeleting(false);
          alert('Deleted successfully!');
        }, 1500);
      };
      
      return (
        <form className="w-96 space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Patient Form</h3>
          
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" className="w-full px-3 py-2 border rounded" placeholder="John Doe" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border rounded" placeholder="john@example.com" />
          </div>
          
          <div className="flex gap-2">
            <LoadingButton
              color="blue"
              loading={saving}
              loadingText="Saving..."
              onClick={handleSave}
              type="button"
            >
              Save Patient
            </LoadingButton>
            
            <LoadingButton
              color="red"
              variant="outline"
              loading={deleting}
              loadingText="Deleting..."
              onClick={handleDelete}
              type="button"
            >
              Delete
            </LoadingButton>
          </div>
        </form>
      );
    };
    
    return <FormDemo />;
  },
};

export const AsyncOperations: Story = {
  render: () => {
    const AsyncDemo = () => {
      const [uploadLoading, setUploadLoading] = useState(false);
      const [downloadLoading, setDownloadLoading] = useState(false);
      const [syncLoading, setSyncLoading] = useState(false);
      
      return (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg">
            <h4 className="font-medium mb-3">File Operations</h4>
            <div className="flex gap-2">
              <LoadingButton
                color="blue"
                size="sm"
                loading={uploadLoading}
                loadingText="Uploading..."
                onClick={() => {
                  setUploadLoading(true);
                  setTimeout(() => setUploadLoading(false), 3000);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload
              </LoadingButton>
              
              <LoadingButton
                color="green"
                size="sm"
                variant="outline"
                loading={downloadLoading}
                loadingText="Downloading..."
                onClick={() => {
                  setDownloadLoading(true);
                  setTimeout(() => setDownloadLoading(false), 2000);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </LoadingButton>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg">
            <h4 className="font-medium mb-3">Data Sync</h4>
            <LoadingButton
              color="purple"
              loading={syncLoading}
              loadingText="Syncing data..."
              onClick={() => {
                setSyncLoading(true);
                setTimeout(() => setSyncLoading(false), 4000);
              }}
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sync with Server
            </LoadingButton>
          </div>
        </div>
      );
    };
    
    return <AsyncDemo />;
  },
};