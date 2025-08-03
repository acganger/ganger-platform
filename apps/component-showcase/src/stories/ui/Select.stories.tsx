import type { Meta, StoryObj } from '@storybook/react';
import { Select } from '@ganger/ui';
import { useState } from 'react';

const meta: Meta<typeof Select> = {
  title: '@ganger/ui/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Select dropdown component for choosing from a list of options.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Selected value',
    },
    onChange: {
      action: 'changed',
      description: 'Change handler',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the select',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Select size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make select full width',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <option value="">Choose an option</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
      <option value="3">Option 3</option>
    </Select>
  ),
};

export const WithPlaceholder: Story = {
  render: () => (
    <Select defaultValue="">
      <option value="" disabled>Select a department</option>
      <option value="medical">Medical</option>
      <option value="surgical">Surgical</option>
      <option value="emergency">Emergency</option>
      <option value="pediatrics">Pediatrics</option>
    </Select>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Select size="sm">
        <option>Small select</option>
        <option>Option 2</option>
      </Select>
      <Select size="md">
        <option>Medium select (default)</option>
        <option>Option 2</option>
      </Select>
      <Select size="lg">
        <option>Large select</option>
        <option>Option 2</option>
      </Select>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Select>
        <option>Normal select</option>
        <option>Option 2</option>
      </Select>
      <Select disabled>
        <option>Disabled select</option>
      </Select>
      <Select error className="border-red-500">
        <option>Error select</option>
        <option>Option 2</option>
      </Select>
    </div>
  ),
};

export const ControlledSelect: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [value, setValue] = useState('');
      
      return (
        <div className="space-y-4 w-64">
          <Select value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">Choose a color</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
          </Select>
          <p className="text-sm text-neutral-600">
            Selected: {value || '(none)'}
          </p>
        </div>
      );
    };
    
    return <ControlledDemo />;
  },
};

export const GroupedOptions: Story = {
  render: () => (
    <Select className="w-64">
      <option value="">Select a staff member</option>
      <optgroup label="Physicians">
        <option value="dr-smith">Dr. Smith</option>
        <option value="dr-jones">Dr. Jones</option>
        <option value="dr-brown">Dr. Brown</option>
      </optgroup>
      <optgroup label="Nurses">
        <option value="nurse-wilson">Sarah Wilson, RN</option>
        <option value="nurse-taylor">Emily Taylor, RN</option>
      </optgroup>
      <optgroup label="Medical Assistants">
        <option value="ma-davis">John Davis</option>
        <option value="ma-miller">Lisa Miller</option>
      </optgroup>
    </Select>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <label htmlFor="country" className="block text-sm font-medium mb-1">
          Country
        </label>
        <Select id="country" fullWidth>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="uk">United Kingdom</option>
          <option value="au">Australia</option>
        </Select>
      </div>
      
      <div>
        <label htmlFor="state" className="block text-sm font-medium mb-1">
          State <span className="text-red-500">*</span>
        </label>
        <Select id="state" fullWidth>
          <option value="">Select a state</option>
          <option value="mi">Michigan</option>
          <option value="oh">Ohio</option>
          <option value="il">Illinois</option>
          <option value="in">Indiana</option>
        </Select>
        <p className="text-xs text-neutral-500 mt-1">Required field</p>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-96 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Appointment Booking</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">Provider</label>
        <Select fullWidth>
          <option value="">Select a provider</option>
          <option value="1">Dr. Smith - Dermatology</option>
          <option value="2">Dr. Jones - General Practice</option>
          <option value="3">Dr. Brown - Pediatrics</option>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Appointment Type</label>
        <Select fullWidth>
          <option value="">Select appointment type</option>
          <option value="consultation">New Patient Consultation</option>
          <option value="followup">Follow-up Visit</option>
          <option value="procedure">Procedure</option>
          <option value="checkup">Annual Check-up</option>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Duration</label>
        <Select fullWidth>
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
        </Select>
      </div>
    </form>
  ),
};

export const MultipleSelects: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
      <Select>
        <option>Month</option>
        <option value="1">January</option>
        <option value="2">February</option>
        <option value="3">March</option>
      </Select>
      <Select>
        <option>Day</option>
        {[...Array(31)].map((_, i) => (
          <option key={i} value={i + 1}>{i + 1}</option>
        ))}
      </Select>
      <Select>
        <option>Year</option>
        {[...Array(10)].map((_, i) => (
          <option key={i} value={2025 - i}>{2025 - i}</option>
        ))}
      </Select>
    </div>
  ),
};