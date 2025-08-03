import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, CardLegacy, Button } from '@ganger/ui-catalyst';

const meta: Meta<typeof Card> = {
  title: '@ganger/ui-catalyst/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst card component with enhanced styling and composable parts.',
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
        <p>This is a modern Catalyst card with enhanced styling.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>This is a description with Catalyst styling.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card body content with modern design elements.</p>
      </CardContent>
    </Card>
  ),
};

export const Complete: Story = {
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
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button color="blue">Save Changes</Button>
      </CardFooter>
    </Card>
  ),
};

export const LegacyComparison: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Modern Catalyst Card</h3>
        <Card>
          <CardHeader>
            <CardTitle>Modern Design</CardTitle>
            <CardDescription>Enhanced shadows and borders</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Features improved spacing, modern shadows, and better dark mode support.</p>
          </CardContent>
          <CardFooter>
            <Button color="blue" size="sm">Learn More</Button>
          </CardFooter>
        </Card>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Legacy Card</h3>
        <CardLegacy>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Legacy Design</h3>
            <p className="text-sm text-neutral-600 mb-4">Traditional card styling</p>
            <p className="text-sm">Original design with standard shadows and borders.</p>
          </div>
        </CardLegacy>
      </div>
    </div>
  ),
};

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-cyan-600">Total Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">1,234</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">+12% from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">45</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Today's schedule</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">12</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Requires attention</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const InteractiveCard: Story = {
  render: () => (
    <Card className="w-96 hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Appointment Details</CardTitle>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Confirmed</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>2:30 PM - 3:00 PM</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Dr. Sarah Smith</span>
          </div>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Room 203</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button color="blue" size="sm" className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const ImageCard: Story = {
  render: () => (
    <Card className="w-80 overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-cyan-500 to-blue-600" />
      <CardHeader>
        <CardTitle>Dermatology Services</CardTitle>
        <CardDescription>Comprehensive skin care solutions</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          Expert care for all your dermatological needs with state-of-the-art treatments.
        </p>
      </CardContent>
      <CardFooter>
        <Button color="blue">Book Appointment</Button>
      </CardFooter>
    </Card>
  ),
};