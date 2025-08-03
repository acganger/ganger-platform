import type { Meta, StoryObj } from '@storybook/react';
import { FormField, Input, Select, Checkbox } from '@ganger/ui-catalyst';

const meta: Meta<typeof FormField> = {
  title: '@ganger/ui-catalyst/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form field wrapper component with label, error handling, and help text support.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    helpText: {
      control: 'text',
      description: 'Help text displayed below the field',
    },
    required: {
      control: 'boolean',
      description: 'Mark field as required',
    },
    children: {
      control: false,
      description: 'Form control element',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    children: <Input type="email" placeholder="john.doe@example.com" />,
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    required: true,
    children: <Input placeholder="Enter your full name" />,
  },
};

export const WithHelpText: Story = {
  args: {
    label: 'Password',
    helpText: 'Password must be at least 8 characters long',
    children: <Input type="password" placeholder="Enter password" />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    error: 'This username is already taken',
    children: <Input defaultValue="johndoe" className="border-red-500" />,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <FormField label="Default field">
        <Input placeholder="Default state" />
      </FormField>
      
      <FormField label="Required field" required>
        <Input placeholder="This field is required" />
      </FormField>
      
      <FormField 
        label="Field with help text" 
        helpText="This text provides additional context"
      >
        <Input placeholder="Enter value" />
      </FormField>
      
      <FormField 
        label="Field with error" 
        error="This field has an error"
      >
        <Input placeholder="Invalid input" className="border-red-500" />
      </FormField>
      
      <FormField 
        label="All features" 
        required
        helpText="Enter a valid email address"
        error="Invalid email format"
      >
        <Input 
          type="email" 
          defaultValue="invalid-email" 
          className="border-red-500"
        />
      </FormField>
    </div>
  ),
};

export const DifferentInputTypes: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <FormField label="Text Input">
        <Input type="text" placeholder="Enter text" />
      </FormField>
      
      <FormField label="Select Dropdown">
        <Select>
          <option>Choose an option</option>
          <option>Option 1</option>
          <option>Option 2</option>
          <option>Option 3</option>
        </Select>
      </FormField>
      
      <FormField label="Textarea">
        <textarea 
          className="w-full px-3 py-2 border rounded-md resize-none" 
          rows={3}
          placeholder="Enter long text"
        />
      </FormField>
      
      <FormField label="Checkbox">
        <label className="flex items-center gap-2">
          <Checkbox />
          <span className="text-sm">I agree to the terms</span>
        </label>
      </FormField>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="w-96 space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Patient Registration</h3>
      
      <FormField label="First Name" required>
        <Input placeholder="John" />
      </FormField>
      
      <FormField label="Last Name" required>
        <Input placeholder="Doe" />
      </FormField>
      
      <FormField 
        label="Email" 
        required
        helpText="We'll use this to send appointment reminders"
      >
        <Input type="email" placeholder="john.doe@example.com" />
      </FormField>
      
      <FormField label="Phone Number" required>
        <Input type="tel" placeholder="(555) 123-4567" />
      </FormField>
      
      <FormField label="Insurance Provider">
        <Select>
          <option>Select insurance</option>
          <option>Blue Cross Blue Shield</option>
          <option>Aetna</option>
          <option>UnitedHealth</option>
          <option>Cigna</option>
          <option>Other</option>
        </Select>
      </FormField>
      
      <FormField label="Reason for Visit">
        <textarea 
          className="w-full px-3 py-2 border rounded-md resize-none" 
          rows={3}
          placeholder="Briefly describe your symptoms"
        />
      </FormField>
      
      <FormField label="Consent">
        <label className="flex items-center gap-2">
          <Checkbox />
          <span className="text-sm">I consent to treatment</span>
        </label>
      </FormField>
      
      <button
        type="submit"
        className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
      >
        Register
      </button>
    </form>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <FormField 
        label="Valid Input"
        helpText="This input is valid"
      >
        <Input 
          defaultValue="valid@example.com" 
          className="border-green-500 focus:border-green-600"
        />
      </FormField>
      
      <FormField 
        label="Invalid Input"
        error="Please enter a valid email address"
      >
        <Input 
          defaultValue="invalid-email" 
          className="border-red-500 focus:border-red-600"
        />
      </FormField>
      
      <FormField 
        label="Warning State"
        helpText="This email domain is uncommon"
      >
        <Input 
          defaultValue="user@uncommon.xyz" 
          className="border-orange-500 focus:border-orange-600"
        />
      </FormField>
    </div>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="max-w-xs">
        <h4 className="font-medium mb-3">Mobile Width</h4>
        <FormField 
          label="Mobile Field" 
          helpText="Responsive on small screens"
        >
          <Input placeholder="Mobile input" />
        </FormField>
      </div>
      
      <div className="max-w-md">
        <h4 className="font-medium mb-3">Tablet Width</h4>
        <FormField 
          label="Tablet Field" 
          helpText="Responsive on medium screens"
        >
          <Input placeholder="Tablet input" />
        </FormField>
      </div>
      
      <div className="max-w-2xl">
        <h4 className="font-medium mb-3">Desktop Width</h4>
        <FormField 
          label="Desktop Field" 
          helpText="Responsive on large screens"
        >
          <Input placeholder="Desktop input" />
        </FormField>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="p-6 bg-neutral-900 rounded-lg">
      <div className="w-96 space-y-4">
        <FormField 
          label="Dark Mode Field" 
          helpText="This field adapts to dark mode"
        >
          <Input placeholder="Enter value" />
        </FormField>
        
        <FormField 
          label="Error in Dark Mode" 
          error="This error is visible in dark mode"
        >
          <Input placeholder="Invalid input" className="border-red-500" />
        </FormField>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};