import type { Meta, StoryObj } from '@storybook/react';
import { Toast, ToastProvider, useToast, Button } from '@ganger/ui';

const ToastDemo = () => {
  const { showToast } = useToast();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="primary"
          onClick={() => showToast({
            title: 'Success!',
            description: 'Your changes have been saved.',
            type: 'success',
          })}
        >
          Show Success Toast
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => showToast({
            title: 'Info',
            description: 'This is an informational message.',
            type: 'info',
          })}
        >
          Show Info Toast
        </Button>
        
        <Button
          variant="outline"
          onClick={() => showToast({
            title: 'Warning',
            description: 'Please review your input.',
            type: 'warning',
          })}
        >
          Show Warning Toast
        </Button>
        
        <Button
          variant="danger"
          onClick={() => showToast({
            title: 'Error',
            description: 'Something went wrong. Please try again.',
            type: 'error',
          })}
        >
          Show Error Toast
        </Button>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">With Actions</h3>
        <Button
          onClick={() => showToast({
            title: 'File uploaded',
            description: 'document.pdf has been uploaded successfully.',
            type: 'success',
            action: {
              label: 'View',
              onClick: () => console.log('View clicked'),
            },
          })}
        >
          Toast with Action
        </Button>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Custom Duration</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => showToast({
              title: 'Quick toast',
              description: 'This will disappear quickly.',
              duration: 2000,
            })}
          >
            2 Second Toast
          </Button>
          
          <Button
            variant="outline"
            onClick={() => showToast({
              title: 'Long toast',
              description: 'This will stay visible longer.',
              duration: 10000,
            })}
          >
            10 Second Toast
          </Button>
        </div>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: '@ganger/ui/Toast',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast notification system with provider and hook for showing temporary messages.',
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
      
      const positions = [
        { value: 'top-left', label: 'Top Left' },
        { value: 'top-center', label: 'Top Center' },
        { value: 'top-right', label: 'Top Right' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-center', label: 'Bottom Center' },
        { value: 'bottom-right', label: 'Bottom Right' },
      ];
      
      return (
        <div className="grid grid-cols-3 gap-4">
          {positions.map(position => (
            <Button
              key={position.value}
              variant="outline"
              onClick={() => showToast({
                title: position.label,
                description: `Toast at ${position.label}`,
                position: position.value as any,
              })}
            >
              {position.label}
            </Button>
          ))}
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

export const MultipleToasts: Story = {
  render: () => {
    const MultipleDemo = () => {
      const { showToast } = useToast();
      
      const showMultiple = () => {
        showToast({
          title: 'First toast',
          description: 'This is the first notification.',
          type: 'info',
        });
        
        setTimeout(() => {
          showToast({
            title: 'Second toast',
            description: 'This is the second notification.',
            type: 'success',
          });
        }, 500);
        
        setTimeout(() => {
          showToast({
            title: 'Third toast',
            description: 'This is the third notification.',
            type: 'warning',
          });
        }, 1000);
      };
      
      return (
        <Button onClick={showMultiple}>
          Show Multiple Toasts
        </Button>
      );
    };
    
    return (
      <ToastProvider>
        <MultipleDemo />
      </ToastProvider>
    );
  },
};

export const CustomContent: Story = {
  render: () => {
    const CustomDemo = () => {
      const { showToast } = useToast();
      
      return (
        <div className="space-y-4">
          <Button
            onClick={() => showToast({
              title: (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Custom Icon Toast
                </div>
              ),
              description: 'Toast with custom JSX content',
            })}
          >
            Toast with Icon
          </Button>
          
          <Button
            onClick={() => showToast({
              title: 'Progress Update',
              description: (
                <div className="space-y-2">
                  <p>Uploading file...</p>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <p className="text-xs">60% complete</p>
                </div>
              ),
              duration: 5000,
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
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Form Actions</h3>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => showToast({
                  title: 'Patient saved',
                  description: 'Patient record has been updated successfully.',
                  type: 'success',
                })}
              >
                Save Patient
              </Button>
              
              <Button
                variant="danger"
                onClick={() => showToast({
                  title: 'Record deleted',
                  description: 'The record has been permanently removed.',
                  type: 'error',
                  action: {
                    label: 'Undo',
                    onClick: () => showToast({
                      title: 'Deletion cancelled',
                      type: 'info',
                    }),
                  },
                })}
              >
                Delete Record
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">System Messages</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => showToast({
                  title: 'Connection lost',
                  description: 'Attempting to reconnect...',
                  type: 'warning',
                  duration: 15000,
                })}
              >
                Network Error
              </Button>
              
              <Button
                variant="outline"
                onClick={() => showToast({
                  title: 'Update available',
                  description: 'A new version is ready to install.',
                  type: 'info',
                  action: {
                    label: 'Update now',
                    onClick: () => console.log('Update clicked'),
                  },
                  duration: 0, // Persistent
                })}
              >
                System Update
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