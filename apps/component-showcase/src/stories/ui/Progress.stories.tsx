import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@ganger/ui';
import { useState, useEffect } from 'react';

const meta: Meta<typeof Progress> = {
  title: '@ganger/ui/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Progress bar component for showing completion status.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value (0-100)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the progress bar',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error'],
      description: 'Color variant',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show percentage label',
    },
    striped: {
      control: 'boolean',
      description: 'Show striped pattern',
    },
    animated: {
      control: 'boolean',
      description: 'Animate stripes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <p className="text-sm mb-1">Small</p>
        <Progress value={40} size="sm" />
      </div>
      <div>
        <p className="text-sm mb-1">Medium (default)</p>
        <Progress value={60} size="md" />
      </div>
      <div>
        <p className="text-sm mb-1">Large</p>
        <Progress value={80} size="lg" />
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <p className="text-sm mb-1">Primary</p>
        <Progress value={70} color="primary" />
      </div>
      <div>
        <p className="text-sm mb-1">Success</p>
        <Progress value={90} color="success" />
      </div>
      <div>
        <p className="text-sm mb-1">Warning</p>
        <Progress value={50} color="warning" />
      </div>
      <div>
        <p className="text-sm mb-1">Error</p>
        <Progress value={30} color="error" />
      </div>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Progress value={25} showLabel />
      <Progress value={50} showLabel color="success" />
      <Progress value={75} showLabel color="warning" />
      <Progress value={100} showLabel color="success" />
    </div>
  ),
};

export const Striped: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <Progress value={60} striped />
      <Progress value={60} striped animated />
    </div>
  ),
};

export const AnimatedProgress: Story = {
  render: () => {
    const AnimatedDemo = () => {
      const [progress, setProgress] = useState(0);
      
      useEffect(() => {
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) return 0;
            return prev + 10;
          });
        }, 500);
        
        return () => clearInterval(interval);
      }, []);
      
      return (
        <div className="w-64 space-y-2">
          <Progress value={progress} showLabel animated striped />
          <p className="text-sm text-neutral-600">Auto-progressing demo</p>
        </div>
      );
    };
    
    return <AnimatedDemo />;
  },
};

export const MultipleProgress: Story = {
  render: () => (
    <div className="w-96 space-y-6">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">File Upload</span>
          <span className="text-sm text-neutral-600">45%</span>
        </div>
        <Progress value={45} />
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Data Processing</span>
          <span className="text-sm text-neutral-600">78%</span>
        </div>
        <Progress value={78} color="warning" />
      </div>
      
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">Verification</span>
          <span className="text-sm text-neutral-600">Complete</span>
        </div>
        <Progress value={100} color="success" />
      </div>
    </div>
  ),
};

export const TaskProgress: Story = {
  render: () => (
    <div className="w-96 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Daily Tasks</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Patient Check-ins</span>
            <span className="text-sm font-medium">32/45</span>
          </div>
          <Progress value={71} color="primary" size="sm" />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Lab Results Review</span>
            <span className="text-sm font-medium">18/20</span>
          </div>
          <Progress value={90} color="success" size="sm" />
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm">Prescription Refills</span>
            <span className="text-sm font-medium">5/12</span>
          </div>
          <Progress value={42} color="warning" size="sm" />
        </div>
      </div>
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div className="w-64">
      <p className="text-sm mb-2">Loading...</p>
      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
        <div className="bg-cyan-600 h-full w-1/3 rounded-full animate-[slide_1s_ease-in-out_infinite]" />
      </div>
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  ),
};