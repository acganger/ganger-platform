import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@ganger/ui';
import { useState } from 'react';

const meta: Meta<typeof Input> = {
  title: '@ganger/ui/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input component for text entry with various types and states.',
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
    fullWidth: {
      control: 'boolean',
      description: 'Make input full width',
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

export const Types: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input type="number" placeholder="Number" />
      <Input type="tel" placeholder="Phone number" />
      <Input type="url" placeholder="Website URL" />
      <Input type="search" placeholder="Search..." />
      <Input type="date" />
      <Input type="time" />
    </div>
  ),
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
      <Input placeholder="Error input" error className="border-red-500" />
      <Input placeholder="Success input" className="border-green-500 focus:border-green-600 focus:ring-green-600" />
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

export const ControlledInput: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [value, setValue] = useState('');
      
      return (
        <div className="space-y-4 w-80">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type something..."
          />
          <p className="text-sm text-neutral-600">
            You typed: {value || '(nothing yet)'}
          </p>
          <button
            onClick={() => setValue('')}
            className="px-3 py-1 bg-neutral-200 hover:bg-neutral-300 rounded text-sm"
          >
            Clear
          </button>
        </div>
      );
    };
    
    return <ControlledDemo />;
  },
};

export const WithLabels: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Full Name
        </label>
        <Input id="name" placeholder="John Doe" />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Phone Number
        </label>
        <Input id="phone" type="tel" placeholder="(555) 123-4567" />
        <p className="text-xs text-neutral-500 mt-1">Optional</p>
      </div>
    </div>
  ),
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
        <Input placeholder="0.00" className="rounded-r-none" />
        <span className="inline-flex items-center px-3 bg-neutral-100 dark:bg-neutral-800 border border-l-0 border-neutral-300 dark:border-neutral-600 rounded-r">
          USD
        </span>
      </div>
    </div>
  ),
};