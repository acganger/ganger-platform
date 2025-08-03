import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from '@ganger/ui';
import { useState } from 'react';

const meta: Meta<typeof ErrorBoundary> = {
  title: '@ganger/ui/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Error boundary component that catches JavaScript errors and displays a fallback UI.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'Child components to wrap',
    },
    fallback: {
      control: false,
      description: 'Custom fallback component',
    },
    onError: {
      action: 'error',
      description: 'Error handler callback',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a test error!');
  }
  return <div>Component is working normally</div>;
};

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Protected Component</h3>
        <p>This component is wrapped in an ErrorBoundary.</p>
      </div>
    </ErrorBoundary>
  ),
};

export const WithError: Story = {
  render: () => {
    const ErrorDemo = () => {
      const [hasError, setHasError] = useState(false);
      
      return (
        <div className="space-y-4">
          <button
            onClick={() => setHasError(!hasError)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {hasError ? 'Fix Error' : 'Trigger Error'}
          </button>
          
          <ErrorBoundary>
            <div className="p-4 border rounded">
              <ThrowError shouldThrow={hasError} />
            </div>
          </ErrorBoundary>
        </div>
      );
    };
    
    return <ErrorDemo />;
  },
};

export const CustomFallback: Story = {
  render: () => {
    const [hasError, setHasError] = useState(true);
    
    return (
      <div className="space-y-4">
        <button
          onClick={() => setHasError(!hasError)}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          {hasError ? 'Fix Error' : 'Trigger Error'}
        </button>
        
        <ErrorBoundary
          fallback={
            <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
              <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Custom Error Message</h3>
              <p className="text-red-700">Something went wrong with this component.</p>
            </div>
          }
        >
          <div className="p-4 border rounded">
            <ThrowError shouldThrow={hasError} />
          </div>
        </ErrorBoundary>
      </div>
    );
  },
};

export const WithErrorHandler: Story = {
  render: () => {
    const [errors, setErrors] = useState<Error[]>([]);
    
    return (
      <div className="space-y-4">
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Error caught:', error, errorInfo);
            setErrors([...errors, error]);
          }}
        >
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Component with Error Logging</h3>
            <p>Errors will be logged to the console and displayed below.</p>
          </div>
        </ErrorBoundary>
        
        {errors.length > 0 && (
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
            <h4 className="font-semibold mb-2">Logged Errors:</h4>
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-600">
                {error.message}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
};

export const NestedErrorBoundaries: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 border rounded space-y-4">
        <h3 className="font-semibold">Parent Error Boundary</h3>
        
        <ErrorBoundary>
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
            <h4 className="font-medium mb-2">Child Error Boundary 1</h4>
            <p>This component has its own error boundary.</p>
          </div>
        </ErrorBoundary>
        
        <ErrorBoundary>
          <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded">
            <h4 className="font-medium mb-2">Child Error Boundary 2</h4>
            <p>Errors here won't affect the sibling component.</p>
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  ),
};