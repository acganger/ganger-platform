import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '@ganger/ui';

const meta: Meta<typeof Alert> = {
  title: '@ganger/ui/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Alert component for displaying important messages with various severity levels.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: 'The type/severity of the alert',
    },
    children: {
      control: 'text',
      description: 'The content of the alert',
    },
    dismissible: {
      control: 'boolean',
      description: 'Whether the alert can be dismissed',
    },
    onDismiss: {
      action: 'dismissed',
      description: 'Callback when alert is dismissed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: 'This is a default alert message.',
  },
};

export const Info: Story = {
  args: {
    type: 'info',
    children: 'This is an informational alert message.',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    children: 'Operation completed successfully!',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'Please be aware of this warning message.',
  },
};

export const Error: Story = {
  args: {
    type: 'error',
    children: 'An error occurred. Please try again.',
  },
};

export const Dismissible: Story = {
  args: {
    type: 'info',
    dismissible: true,
    children: 'This alert can be dismissed by clicking the X button.',
  },
};

export const LongContent: Story = {
  args: {
    type: 'info',
    children: 'This is a longer alert message that demonstrates how the component handles multiple lines of text. It should wrap appropriately and maintain proper spacing and readability.',
  },
};

export const CustomContent: Story = {
  args: {
    type: 'success',
    children: (
      <div>
        <strong>Success!</strong> Your changes have been saved.
        <br />
        <a href="#" className="underline">View details</a>
      </div>
    ),
  },
};