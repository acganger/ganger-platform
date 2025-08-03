import type { Meta, StoryObj } from '@storybook/react';
import { Button, ButtonLegacy } from '@ganger/ui-catalyst';

const meta: Meta<typeof Button> = {
  title: '@ganger/ui-catalyst/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst button component with 18 color variants and enhanced styling.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Button label',
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
      description: 'Color variant (18 Catalyst colors)',
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
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Catalyst Button',
  },
};

export const AllColors: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-2 max-w-4xl">
      <Button color="zinc">Zinc</Button>
      <Button color="neutral">Neutral</Button>
      <Button color="stone">Stone</Button>
      <Button color="gray">Gray</Button>
      <Button color="slate">Slate</Button>
      <Button color="red">Red</Button>
      <Button color="orange">Orange</Button>
      <Button color="amber">Amber</Button>
      <Button color="yellow">Yellow</Button>
      <Button color="lime">Lime</Button>
      <Button color="green">Green</Button>
      <Button color="emerald">Emerald</Button>
      <Button color="teal">Teal</Button>
      <Button color="cyan">Cyan</Button>
      <Button color="sky">Sky</Button>
      <Button color="blue">Blue</Button>
      <Button color="indigo">Indigo</Button>
      <Button color="violet">Violet</Button>
      <Button color="purple">Purple</Button>
      <Button color="fuchsia">Fuchsia</Button>
      <Button color="pink">Pink</Button>
      <Button color="rose">Rose</Button>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="solid">Solid</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="solid" color="green">Solid Green</Button>
        <Button variant="outline" color="green">Outline Green</Button>
        <Button variant="ghost" color="green">Ghost Green</Button>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Button</h3>
        <div className="flex gap-2 flex-wrap">
          <Button color="blue">Blue</Button>
          <Button color="green">Green</Button>
          <Button color="red">Red</Button>
          <Button color="purple">Purple</Button>
          <Button color="cyan">Cyan</Button>
          <Button color="orange">Orange</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Button (5 variants)</h3>
        <div className="flex gap-2 flex-wrap">
          <ButtonLegacy variant="primary">Primary</ButtonLegacy>
          <ButtonLegacy variant="secondary">Secondary</ButtonLegacy>
          <ButtonLegacy variant="outline">Outline</ButtonLegacy>
          <ButtonLegacy variant="ghost">Ghost</ButtonLegacy>
          <ButtonLegacy variant="danger">Danger</ButtonLegacy>
        </div>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button color="blue">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </Button>
        <Button color="green" variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save
        </Button>
        <Button color="red" variant="ghost">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button size="sm" color="purple">
          Icon Only
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
        <Button size="sm" variant="outline" color="cyan">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </Button>
      </div>
    </div>
  ),
};

export const ButtonGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex">
        <Button variant="outline" className="rounded-r-none">Left</Button>
        <Button variant="outline" className="rounded-none border-l-0">Center</Button>
        <Button variant="outline" className="rounded-l-none border-l-0">Right</Button>
      </div>
      
      <div className="flex">
        <Button color="blue" className="rounded-r-none">Save</Button>
        <Button color="blue" variant="outline" className="rounded-l-none border-l-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Button loading color="blue">Processing</Button>
      <Button loading color="green" variant="outline">Saving</Button>
      <Button loading color="purple" variant="ghost">Loading</Button>
      <Button loading size="sm">Small</Button>
      <Button loading size="md">Medium</Button>
      <Button loading size="lg">Large</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <Button color="blue" className="w-full">Full Width Button</Button>
      <Button color="green" variant="outline" className="w-full">Another Full Width</Button>
    </div>
  ),
};