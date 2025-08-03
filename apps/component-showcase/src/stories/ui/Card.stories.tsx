import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, Button } from '@ganger/ui';

const meta: Meta<typeof Card> = {
  title: '@ganger/ui/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component with composable parts for flexible content layout.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Card content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardContent>
        <p>This is a simple card with content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>This is a description of the card content.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card body content goes here. It can contain any elements.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Action Card</CardTitle>
        <CardDescription>This card has actions in the footer.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Main content of the card.</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const ComplexCard: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Patient Information</CardTitle>
        <CardDescription>Last updated: Today at 3:45 PM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Name</label>
          <p className="text-neutral-900 dark:text-neutral-100">John Doe</p>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Date of Birth</label>
          <p className="text-neutral-900 dark:text-neutral-100">January 15, 1985</p>
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Medical Record Number</label>
          <p className="text-neutral-900 dark:text-neutral-100">MRN-123456</p>
        </div>
      </CardContent>
      <CardFooter className="bg-neutral-50 dark:bg-neutral-800">
        <Button variant="outline" size="sm" fullWidth>View Full Record</Button>
      </CardFooter>
    </Card>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-cyan-600">1,234</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">+12% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appointments Today</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">45</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">8 remaining</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-600">12</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">3 high priority</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ClickableCard: Story = {
  render: () => (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>Clickable Card</CardTitle>
        <CardDescription>This entire card is clickable</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Click anywhere on this card to trigger an action.</p>
      </CardContent>
    </Card>
  ),
};

export const ColoredCards: Story = {
  render: () => (
    <div className="space-y-4">
      <Card className="border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-950">
        <CardHeader>
          <CardTitle className="text-cyan-900 dark:text-cyan-100">Info Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-cyan-800 dark:text-cyan-200">This is an informational card.</p>
        </CardContent>
      </Card>
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-100">Success Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-800 dark:text-green-200">Operation completed successfully!</p>
        </CardContent>
      </Card>
    </div>
  ),
};