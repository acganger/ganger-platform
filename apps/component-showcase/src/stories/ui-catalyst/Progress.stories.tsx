import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@ganger/ui-catalyst';
import { useState, useEffect } from 'react';

const meta: Meta<typeof Progress> = {
  title: '@ganger/ui-catalyst/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Progress bar component for showing completion status and loading states.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress value (0-100)',
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
      description: 'Color variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Progress bar size',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show percentage label',
    },
    animate: {
      control: 'boolean',
      description: 'Animate the progress bar',
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

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Small</p>
        <Progress value={40} size="sm" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Medium (default)</p>
        <Progress value={60} size="md" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Large</p>
        <Progress value={80} size="lg" />
      </div>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div className="w-64 space-y-3">
      <Progress value={90} color="green" />
      <Progress value={75} color="blue" />
      <Progress value={60} color="purple" />
      <Progress value={45} color="orange" />
      <Progress value={30} color="red" />
      <Progress value={85} color="cyan" />
    </div>
  ),
};

export const Animated: Story = {
  render: () => {
    const AnimatedDemo = () => {
      const [progress, setProgress] = useState(0);
      
      useEffect(() => {
        const timer = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) return 0;
            return prev + 2;
          });
        }, 100);
        
        return () => clearInterval(timer);
      }, []);
      
      return (
        <div className="w-64 space-y-4">
          <Progress value={progress} animate showLabel />
          <p className="text-sm text-neutral-600 text-center">
            Auto-incrementing progress
          </p>
        </div>
      );
    };
    
    return <AnimatedDemo />;
  },
};

export const FileUpload: Story = {
  render: () => {
    const UploadDemo = () => {
      const [uploading, setUploading] = useState(false);
      const [progress, setProgress] = useState(0);
      
      const simulateUpload = () => {
        setUploading(true);
        setProgress(0);
        
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setUploading(false);
              return 100;
            }
            return prev + Math.random() * 15;
          });
        }, 200);
      };
      
      return (
        <div className="w-96 space-y-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium">document.pdf</p>
                  <p className="text-sm text-neutral-600">2.4 MB</p>
                </div>
              </div>
              {!uploading && progress === 0 && (
                <button
                  onClick={simulateUpload}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Upload
                </button>
              )}
            </div>
            
            {(uploading || progress > 0) && (
              <div>
                <Progress value={progress} color="blue" showLabel animate />
                <p className="text-sm text-neutral-600 mt-2">
                  {uploading ? 'Uploading...' : progress === 100 ? 'Complete!' : 'Ready'}
                </p>
              </div>
            )}
          </div>
          
          {progress === 100 && (
            <button
              onClick={() => setProgress(0)}
              className="text-sm text-blue-600 hover:underline"
            >
              Upload another file
            </button>
          )}
        </div>
      );
    };
    
    return <UploadDemo />;
  },
};

export const MultiStep: Story = {
  render: () => {
    const steps = [
      { name: 'Account Details', progress: 100 },
      { name: 'Medical History', progress: 100 },
      { name: 'Insurance Info', progress: 60 },
      { name: 'Confirmation', progress: 0 },
    ];
    
    const currentStep = 2;
    
    return (
      <div className="w-full max-w-2xl">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-40">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  index <= currentStep ? 'bg-cyan-600 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className={`text-sm ${index <= currentStep ? 'font-medium' : 'text-neutral-600'}`}>
                  {step.name}
                </span>
              </div>
              <div className="flex-1">
                <Progress 
                  value={step.progress} 
                  size="sm"
                  color={step.progress === 100 ? 'green' : 'cyan'}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-between">
          <button className="px-4 py-2 text-sm border rounded hover:bg-neutral-50">
            Previous
          </button>
          <button className="px-4 py-2 text-sm bg-cyan-600 text-white rounded hover:bg-cyan-700">
            Next Step
          </button>
        </div>
      </div>
    );
  },
};

export const DataSync: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg border">
        <h4 className="font-medium mb-3">Syncing Patient Records</h4>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Demographics</span>
              <span className="text-green-600">Complete</span>
            </div>
            <Progress value={100} size="sm" color="green" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Medical History</span>
              <span className="text-cyan-600">87%</span>
            </div>
            <Progress value={87} size="sm" color="cyan" animate />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Lab Results</span>
              <span className="text-cyan-600">42%</span>
            </div>
            <Progress value={42} size="sm" color="cyan" animate />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Imaging</span>
              <span className="text-neutral-600">Pending</span>
            </div>
            <Progress value={0} size="sm" />
          </div>
        </div>
        
        <p className="text-sm text-neutral-600 mt-4">
          Estimated time remaining: 2 minutes
        </p>
      </div>
    </div>
  ),
};

export const PerformanceMetrics: Story = {
  render: () => (
    <div className="w-full max-w-4xl space-y-6">
      <h3 className="text-lg font-semibold">System Performance</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">CPU Usage</span>
              <span className="text-sm text-neutral-600">45%</span>
            </div>
            <Progress value={45} color="blue" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Memory</span>
              <span className="text-sm text-neutral-600">72%</span>
            </div>
            <Progress value={72} color="orange" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Disk Space</span>
              <span className="text-sm text-neutral-600">89%</span>
            </div>
            <Progress value={89} color="red" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">API Response Time</span>
              <span className="text-sm text-neutral-600">Good</span>
            </div>
            <Progress value={95} color="green" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Database Queries</span>
              <span className="text-sm text-neutral-600">Normal</span>
            </div>
            <Progress value={65} color="cyan" />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Cache Hit Rate</span>
              <span className="text-sm text-neutral-600">Excellent</span>
            </div>
            <Progress value={92} color="green" />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <label htmlFor="progress-1" className="block text-sm font-medium mb-2">
          Download Progress
        </label>
        <Progress 
          id="progress-1"
          value={65} 
          showLabel 
          aria-label="Download progress: 65%"
        />
      </div>
      
      <div>
        <label htmlFor="progress-2" className="block text-sm font-medium mb-2">
          Installation Progress
        </label>
        <Progress 
          id="progress-2"
          value={30} 
          color="purple"
          aria-label="Installation progress: 30%"
          aria-describedby="progress-2-desc"
        />
        <p id="progress-2-desc" className="text-sm text-neutral-600 mt-1">
          Installing required components...
        </p>
      </div>
    </div>
  ),
};