import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof Checkbox> = {
  title: '@ganger/ui-catalyst/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern checkbox component with Catalyst styling and smooth animations.',
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
      description: 'Disable the checkbox',
    },
    name: {
      control: 'text',
      description: 'Input name attribute',
    },
    value: {
      control: 'text',
      description: 'Input value attribute',
    },
    onChange: {
      action: 'changed',
      description: 'Change event handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

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

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox />
        <span>Accept terms and conditions</span>
      </label>
      
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox defaultChecked />
        <span>Send me promotional emails</span>
      </label>
      
      <label className="flex items-center gap-2 cursor-pointer text-neutral-500">
        <Checkbox disabled />
        <span>This option is disabled</span>
      </label>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [checked, setChecked] = useState(false);
      
      return (
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox 
              checked={checked} 
              onChange={(e) => setChecked(e.target.checked)} 
            />
            <span>Controlled checkbox</span>
          </label>
          
          <p className="text-sm text-neutral-600">
            Checkbox is {checked ? 'checked' : 'unchecked'}
          </p>
          
          <button
            onClick={() => setChecked(!checked)}
            className="px-3 py-1 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700"
          >
            Toggle checkbox
          </button>
        </div>
      );
    };
    
    return <ControlledDemo />;
  },
};

export const FormExample: Story = {
  render: () => {
    const FormDemo = () => {
      const [formData, setFormData] = useState({
        newsletter: false,
        terms: false,
        privacy: false,
      });
      
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(JSON.stringify(formData, null, 2));
      };
      
      return (
        <form onSubmit={handleSubmit} className="w-96 space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Preferences</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.newsletter}
                onChange={(e) => setFormData(prev => ({ ...prev, newsletter: e.target.checked }))}
              />
              <span className="text-sm">Subscribe to newsletter</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.terms}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.checked }))}
              />
              <span className="text-sm">I accept the terms of service</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.privacy}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.checked }))}
              />
              <span className="text-sm">I have read the privacy policy</span>
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
            disabled={!formData.terms || !formData.privacy}
          >
            Submit
          </button>
        </form>
      );
    };
    
    return <FormDemo />;
  },
};

export const GroupSelection: Story = {
  render: () => {
    const GroupDemo = () => {
      const [selected, setSelected] = useState<string[]>([]);
      
      const options = [
        { id: 'react', label: 'React' },
        { id: 'vue', label: 'Vue' },
        { id: 'angular', label: 'Angular' },
        { id: 'svelte', label: 'Svelte' },
        { id: 'solid', label: 'Solid' },
      ];
      
      const toggleOption = (id: string) => {
        setSelected(prev => 
          prev.includes(id) 
            ? prev.filter(item => item !== id)
            : [...prev, id]
        );
      };
      
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Select your skills:</h4>
            <div className="space-y-2">
              {options.map(option => (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selected.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded text-sm">
            Selected: {selected.length === 0 ? 'None' : selected.join(', ')}
          </div>
        </div>
      );
    };
    
    return <GroupDemo />;
  },
};

export const IndeterminateState: Story = {
  render: () => {
    const IndeterminateDemo = () => {
      const [childChecked, setChildChecked] = useState([false, true, false]);
      
      const allChecked = childChecked.every(Boolean);
      const someChecked = childChecked.some(Boolean) && !allChecked;
      
      const handleParentChange = () => {
        const newState = !allChecked;
        setChildChecked([newState, newState, newState]);
      };
      
      const handleChildChange = (index: number) => {
        const newChildChecked = [...childChecked];
        newChildChecked[index] = !newChildChecked[index];
        setChildChecked(newChildChecked);
      };
      
      return (
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer font-medium">
            <Checkbox
              checked={allChecked}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someChecked;
                }
              }}
              onChange={handleParentChange}
            />
            <span>Select all features</span>
          </label>
          
          <div className="ml-6 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={childChecked[0]}
                onChange={() => handleChildChange(0)}
              />
              <span>Email notifications</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={childChecked[1]}
                onChange={() => handleChildChange(1)}
              />
              <span>SMS alerts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={childChecked[2]}
                onChange={() => handleChildChange(2)}
              />
              <span>Push notifications</span>
            </label>
          </div>
        </div>
      );
    };
    
    return <IndeterminateDemo />;
  },
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Keyboard Navigation</h4>
        <p className="text-sm text-neutral-600 mb-3">
          Use Tab to navigate and Space to toggle
        </p>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <Checkbox />
            <span>First option</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox defaultChecked />
            <span>Second option (checked)</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox disabled />
            <span>Third option (disabled)</span>
          </label>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-3">With ARIA Labels</h4>
        <Checkbox aria-label="Accept all cookies" />
        <p className="text-sm text-neutral-600 mt-2">
          Checkbox with aria-label for screen readers
        </p>
      </div>
    </div>
  ),
};