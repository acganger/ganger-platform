import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertLegacy } from '@ganger/ui-catalyst';

const meta: Meta<typeof Alert> = {
  title: '@ganger/ui-catalyst/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst alert component with 18 color variants and legacy compatibility.',
      },
    },
  },
  argTypes: {
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
    children: {
      control: 'text',
      description: 'Alert content',
    },
    onClose: {
      action: 'closed',
      description: 'Close handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: 'This is a default alert message using the modern Catalyst design.',
  },
};

export const AllColors: Story = {
  render: () => (
    <div className="space-y-2 w-[600px]">
      <Alert color="zinc">Zinc alert</Alert>
      <Alert color="neutral">Neutral alert</Alert>
      <Alert color="stone">Stone alert</Alert>
      <Alert color="gray">Gray alert</Alert>
      <Alert color="slate">Slate alert</Alert>
      <Alert color="red">Red alert - Error state</Alert>
      <Alert color="orange">Orange alert - Warning</Alert>
      <Alert color="amber">Amber alert</Alert>
      <Alert color="yellow">Yellow alert - Caution</Alert>
      <Alert color="lime">Lime alert</Alert>
      <Alert color="green">Green alert - Success</Alert>
      <Alert color="emerald">Emerald alert</Alert>
      <Alert color="teal">Teal alert</Alert>
      <Alert color="cyan">Cyan alert - Info</Alert>
      <Alert color="sky">Sky alert</Alert>
      <Alert color="blue">Blue alert - Primary</Alert>
      <Alert color="indigo">Indigo alert</Alert>
      <Alert color="violet">Violet alert</Alert>
      <Alert color="purple">Purple alert</Alert>
      <Alert color="fuchsia">Fuchsia alert</Alert>
      <Alert color="pink">Pink alert</Alert>
      <Alert color="rose">Rose alert</Alert>
    </div>
  ),
};

export const WithCloseButton: Story = {
  args: {
    color: 'blue',
    children: 'This alert can be dismissed by clicking the close button.',
    onClose: () => {},
  },
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Modern Catalyst Alert</h3>
        <div className="space-y-2">
          <Alert color="green">Success with 18 color options</Alert>
          <Alert color="red">Error with modern design</Alert>
          <Alert color="yellow">Warning with Catalyst styling</Alert>
          <Alert color="blue">Info with enhanced visuals</Alert>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-2">Legacy Alert (5 variants)</h3>
        <div className="space-y-2">
          <AlertLegacy type="success">Legacy success alert</AlertLegacy>
          <AlertLegacy type="error">Legacy error alert</AlertLegacy>
          <AlertLegacy type="warning">Legacy warning alert</AlertLegacy>
          <AlertLegacy type="info">Legacy info alert</AlertLegacy>
        </div>
      </div>
    </div>
  ),
};

export const ComplexContent: Story = {
  render: () => (
    <div className="space-y-2 w-[600px]">
      <Alert color="green">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold">Success!</h4>
            <p className="text-sm mt-1">Your changes have been saved successfully.</p>
          </div>
        </div>
      </Alert>
      
      <Alert color="red">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold">Error occurred</h4>
            <p className="text-sm mt-1">Failed to save changes. Please try again.</p>
            <button className="text-sm underline mt-2">View details</button>
          </div>
        </div>
      </Alert>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[600px]">
      <Alert color="blue" className="text-sm py-2">
        Small alert with reduced padding
      </Alert>
      <Alert color="blue">
        Default size alert
      </Alert>
      <Alert color="blue" className="text-lg py-6">
        Large alert with increased padding
      </Alert>
    </div>
  ),
};

export const InlineAlerts: Story = {
  render: () => (
    <div className="max-w-md">
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full px-3 py-2 border rounded" />
        </div>
        
        <Alert color="amber">
          <p className="text-sm">Your email will be visible to other users.</p>
        </Alert>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full px-3 py-2 border rounded" />
        </div>
        
        <Alert color="red">
          <p className="text-sm">Password must be at least 8 characters.</p>
        </Alert>
      </form>
    </div>
  ),
};