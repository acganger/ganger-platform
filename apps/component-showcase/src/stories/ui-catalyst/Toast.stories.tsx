import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastProvider, useToast, Button } from '@ganger/ui-catalyst';

const ToastDemo = () => {
  const { showToast } = useToast();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Toast Types</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            color="green"
            onClick={() => showToast({
              title: 'Success!',
              description: 'Your changes have been saved.',
              type: 'success',
            })}
          >
            Success Toast
          </Button>
          
          <Button
            color="red"
            onClick={() => showToast({
              title: 'Error',
              description: 'Something went wrong.',
              type: 'error',
            })}
          >
            Error Toast
          </Button>
          
          <Button
            color="yellow"
            onClick={() => showToast({
              title: 'Warning',
              description: 'Please review your input.',
              type: 'warning',
            })}
          >
            Warning Toast
          </Button>
          
          <Button
            color="blue"
            onClick={() => showToast({
              title: 'Info',
              description: 'This is an informational message.',
              type: 'info',
            })}
          >
            Info Toast
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Colors</h3>
        <div className="grid grid-cols-3 gap-2">
          <Button
            color="purple"
            variant="outline"
            onClick={() => showToast({
              title: 'Purple Toast',
              description: 'Using custom color',
              color: 'purple',
            })}
          >
            Purple
          </Button>
          <Button
            color="cyan"
            variant="outline"
            onClick={() => showToast({
              title: 'Cyan Toast',
              description: 'Using custom color',
              color: 'cyan',
            })}
          >
            Cyan
          </Button>
          <Button
            color="pink"
            variant="outline"
            onClick={() => showToast({
              title: 'Pink Toast',
              description: 'Using custom color',
              color: 'pink',
            })}
          >
            Pink
          </Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-3">Features</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => showToast({
              title: 'With Action',
              description: 'Click the action button',
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo clicked'),
              },
            })}
          >
            Toast with Action
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              showToast({ title: 'First toast', type: 'info' });
              setTimeout(() => showToast({ title: 'Second toast', type: 'success' }), 500);
              setTimeout(() => showToast({ title: 'Third toast', type: 'warning' }), 1000);
            }}
          >
            Multiple Toasts
          </Button>
          
          <Button
            variant="outline"
            onClick={() => showToast({
              title: 'Persistent Toast',
              description: 'This stays until dismissed',
              duration: 0,
            })}
          >
            Persistent Toast
          </Button>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: '@ganger/ui-catalyst/Toast',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modern Catalyst toast notification system with enhanced styling and color options.',
      },
    },
  },
};

export default meta;

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

export const Positions: Story = {
  render: () => {
    const PositionDemo = () => {
      const { showToast } = useToast();
      
      return (
        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({
              title: 'Top Left',
              position: 'top-left',
            })}
          >
            Top Left
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({
              title: 'Top Center',
              position: 'top-center',
            })}
          >
            Top Center
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({
              title: 'Top Right',
              position: 'top-right',
            })}
          >
            Top Right
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({
              title: 'Bottom Left',
              position: 'bottom-left',
            })}
          >
            Bottom Left
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({
              title: 'Bottom Center',
              position: 'bottom-center',
            })}
          >
            Bottom Center
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => showToast({
              title: 'Bottom Right',
              position: 'bottom-right',
            })}
          >
            Bottom Right
          </Button>
        </div>
      );
    };
    
    return (
      <ToastProvider>
        <PositionDemo />
      </ToastProvider>
    );
  },
};

export const CustomContent: Story = {
  render: () => {
    const CustomDemo = () => {
      const { showToast } = useToast();
      
      return (
        <div className="space-y-2">
          <Button
            color="blue"
            onClick={() => showToast({
              title: (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Complete
                </div>
              ),
              description: 'File uploaded successfully',
              color: 'blue',
            })}
          >
            Icon Toast
          </Button>
          
          <Button
            color="green"
            onClick={() => showToast({
              title: 'Task Progress',
              description: (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing files...</span>
                    <span>60%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
              ),
              duration: 10000,
              color: 'green',
            })}
          >
            Progress Toast
          </Button>
        </div>
      );
    };
    
    return (
      <ToastProvider>
        <CustomDemo />
      </ToastProvider>
    );
  },
};

export const RealWorldExamples: Story = {
  render: () => {
    const ExamplesDemo = () => {
      const { showToast } = useToast();
      
      return (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Patient Management</h3>
            <div className="flex gap-2">
              <Button
                color="green"
                size="sm"
                onClick={() => showToast({
                  title: 'Patient saved',
                  description: 'Medical record updated successfully.',
                  type: 'success',
                })}
              >
                Save Patient
              </Button>
              
              <Button
                color="blue"
                size="sm"
                onClick={() => showToast({
                  title: 'Appointment scheduled',
                  description: 'Tuesday, Nov 14 at 2:30 PM',
                  type: 'info',
                  action: {
                    label: 'View Calendar',
                    onClick: () => console.log('View calendar'),
                  },
                })}
              >
                Schedule
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg shadow">
            <h3 className="font-semibold mb-3">System Operations</h3>
            <div className="flex gap-2">
              <Button
                color="orange"
                size="sm"
                variant="outline"
                onClick={() => showToast({
                  title: 'Connection unstable',
                  description: 'Attempting to reconnect...',
                  type: 'warning',
                  duration: 15000,
                })}
              >
                Network Warning
              </Button>
              
              <Button
                color="red"
                size="sm"
                variant="outline"
                onClick={() => showToast({
                  title: 'Sync failed',
                  description: 'Unable to sync data with server.',
                  type: 'error',
                  action: {
                    label: 'Retry',
                    onClick: () => showToast({
                      title: 'Retrying...',
                      type: 'info',
                    }),
                  },
                })}
              >
                Sync Error
              </Button>
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <ToastProvider>
        <ExamplesDemo />
      </ToastProvider>
    );
  },
};