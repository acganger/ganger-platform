import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from '@ganger/ui';
import { useState } from 'react';

const meta: Meta<typeof Checkbox> = {
  title: '@ganger/ui/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Checkbox component for boolean input with optional label.',
      },
    },
  },
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the checkbox is checked',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler',
    },
    label: {
      control: 'text',
      description: 'Label text for the checkbox',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the checkbox is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
    indeterminate: {
      control: 'boolean',
      description: 'Show indeterminate state',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the checkbox',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'This checkbox is checked',
    checked: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Checkbox label="Disabled unchecked" disabled />
      <Checkbox label="Disabled checked" disabled checked />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-2">
      <Checkbox size="sm" label="Small checkbox" />
      <Checkbox size="md" label="Medium checkbox (default)" />
      <Checkbox size="lg" label="Large checkbox" />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: 'Required field',
    error: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all',
    indeterminate: true,
  },
};

export const NoLabel: Story = {
  args: {
    'aria-label': 'Standalone checkbox',
  },
};

export const Interactive: Story = {
  render: () => {
    const CheckboxDemo = () => {
      const [checked, setChecked] = useState(false);
      return (
        <div className="space-y-4">
          <Checkbox
            label={`Checkbox is ${checked ? 'checked' : 'unchecked'}`}
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Click the checkbox to toggle its state
          </p>
        </div>
      );
    };
    return <CheckboxDemo />;
  },
};

export const CheckboxGroup: Story = {
  render: () => {
    const CheckboxGroupDemo = () => {
      const [selected, setSelected] = useState<string[]>([]);
      
      const options = [
        { id: 'email', label: 'Email notifications' },
        { id: 'sms', label: 'SMS notifications' },
        { id: 'push', label: 'Push notifications' },
      ];

      const handleChange = (id: string, checked: boolean) => {
        if (checked) {
          setSelected([...selected, id]);
        } else {
          setSelected(selected.filter(item => item !== id));
        }
      };

      return (
        <div className="space-y-3">
          <h3 className="font-medium">Notification Preferences</h3>
          {options.map(option => (
            <Checkbox
              key={option.id}
              label={option.label}
              checked={selected.includes(option.id)}
              onChange={(e) => handleChange(option.id, e.target.checked)}
            />
          ))}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4">
            Selected: {selected.length > 0 ? selected.join(', ') : 'None'}
          </p>
        </div>
      );
    };
    return <CheckboxGroupDemo />;
  },
};

export const LongLabel: Story = {
  args: {
    label: 'I agree to receive marketing communications from Ganger Dermatology including newsletters, special offers, and updates about new services and treatments.',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};