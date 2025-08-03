import type { Meta, StoryObj } from '@storybook/react';
import { FormField, Input, Select, Checkbox } from '@ganger/ui';

const meta: Meta<typeof FormField> = {
  title: '@ganger/ui/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form field wrapper component that provides consistent layout for form inputs with labels, help text, and error messages.',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Field label',
    },
    required: {
      control: 'boolean',
      description: 'Show required indicator',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    hint: {
      control: 'text',
      description: 'Help text for the field',
    },
    children: {
      control: false,
      description: 'Form input component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    children: <Input type="email" placeholder="john@example.com" />,
  },
};

export const Required: Story = {
  args: {
    label: 'Full Name',
    required: true,
    children: <Input placeholder="Enter your full name" />,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Password',
    hint: 'Must be at least 8 characters long',
    children: <Input type="password" placeholder="Enter password" />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Username',
    error: 'This username is already taken',
    children: <Input placeholder="Choose a username" className="border-red-500" />,
  },
};

export const Complete: Story = {
  args: {
    label: 'Work Email',
    required: true,
    hint: 'We\'ll use this for important notifications',
    error: 'Please enter a valid email address',
    children: <Input type="email" placeholder="email@company.com" className="border-red-500" />,
  },
};

export const WithSelect: Story = {
  args: {
    label: 'Department',
    required: true,
    children: (
      <Select>
        <option value="">Select department</option>
        <option value="medical">Medical</option>
        <option value="nursing">Nursing</option>
        <option value="admin">Administration</option>
      </Select>
    ),
  },
};

export const WithCheckbox: Story = {
  args: {
    children: <Checkbox label="I agree to the terms and conditions" />,
  },
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 w-96">
      <FormField label="First Name" required>
        <Input placeholder="John" />
      </FormField>
      
      <FormField label="Last Name" required>
        <Input placeholder="Doe" />
      </FormField>
      
      <FormField 
        label="Email" 
        required 
        hint="We'll never share your email"
      >
        <Input type="email" placeholder="john@example.com" />
      </FormField>
      
      <FormField label="Role" required>
        <Select>
          <option value="">Select a role</option>
          <option value="physician">Physician</option>
          <option value="nurse">Nurse</option>
          <option value="ma">Medical Assistant</option>
          <option value="admin">Administrator</option>
        </Select>
      </FormField>
      
      <FormField 
        label="Years of Experience"
        hint="Include all relevant medical experience"
      >
        <Input type="number" min="0" placeholder="5" />
      </FormField>
      
      <FormField>
        <Checkbox label="Subscribe to newsletter" />
      </FormField>
    </form>
  ),
};

export const InlineFields: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-96">
      <FormField label="First Name" required>
        <Input placeholder="First" />
      </FormField>
      <FormField label="Last Name" required>
        <Input placeholder="Last" />
      </FormField>
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <FormField label="Valid Input" hint="This field is valid">
        <Input defaultValue="Valid content" className="border-green-500" />
      </FormField>
      
      <FormField 
        label="Invalid Input" 
        error="This field contains an error"
      >
        <Input defaultValue="Invalid content" className="border-red-500" />
      </FormField>
      
      <FormField label="Disabled Input">
        <Input defaultValue="Cannot edit" disabled />
      </FormField>
    </div>
  ),
};