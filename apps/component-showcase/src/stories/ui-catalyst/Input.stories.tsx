import type { Meta, StoryObj } from '@storybook/react';
import { Input, InputLegacy } from '@ganger/ui-catalyst';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: '@ganger/ui-catalyst/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst input component with enhanced styling and focus states.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'time'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the input',
    },
    readOnly: {
      control: 'boolean',
      description: 'Make input read-only',
    },
    error: {
      control: 'boolean',
      description: 'Show error state',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Input size',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input (default)" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input placeholder="Normal input" />
      <Input placeholder="Disabled input" disabled />
      <Input value="Read-only input" readOnly />
      <Input placeholder="Error input" error />
      <Input placeholder="Focus me" className="focus:ring-2 focus:ring-cyan-500" />
    </div>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Input</h3>
        <div className="space-y-2">
          <Input placeholder="Enhanced focus states" />
          <Input placeholder="Modern styling" type="email" />
          <Input placeholder="Better dark mode support" error />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Input</h3>
        <div className="space-y-2">
          <InputLegacy placeholder="Traditional styling" />
          <InputLegacy placeholder="Standard focus" type="email" />
          <InputLegacy placeholder="Basic error state" error />
        </div>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input type="search" placeholder="Search..." className="pl-10" />
      </div>
      
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <Input type="email" placeholder="Email address" className="pl-10" />
      </div>
      
      <div className="relative">
        <Input type="password" placeholder="Password" className="pr-10" />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => {
    const FormDemo = () => {
      const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
      
      return (
        <form className="w-96 space-y-4 p-6 bg-white dark:bg-neutral-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <Input
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <Input
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </form>
      );
    };
    
    return <FormDemo />;
  },
};

export const InputGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex">
        <span className="inline-flex items-center px-3 bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-300 dark:border-neutral-600 rounded-l">
          https://
        </span>
        <Input placeholder="example.com" className="rounded-l-none" />
      </div>
      
      <div className="flex">
        <Input placeholder="Amount" className="rounded-r-none" />
        <span className="inline-flex items-center px-3 bg-neutral-100 dark:bg-neutral-800 border border-l-0 border-neutral-300 dark:border-neutral-600 rounded-r">
          USD
        </span>
      </div>
      
      <div className="flex">
        <button className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-r-0 border-neutral-300 dark:border-neutral-600 rounded-l hover:bg-neutral-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <Input type="number" defaultValue="1" className="rounded-none text-center" />
        <button className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-l-0 border-neutral-300 dark:border-neutral-600 rounded-r hover:bg-neutral-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  ),
};