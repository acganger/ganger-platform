import { Button } from '@ganger/ui';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export const ErrorState = ({ 
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  actionLabel = "Try Again",
  onAction,
  variant = 'error'
}: ErrorStateProps) => {
  const variantStyles = {
    error: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: 'text-red-400'
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      icon: 'text-yellow-400'
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: 'text-blue-400'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className={`rounded-lg p-6 ${styles.bg}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`h-6 w-6 ${styles.icon}`} fill="currentColor" viewBox="0 0 24 24">
            {variant === 'error' && (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            )}
            {variant === 'warning' && (
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            )}
            {variant === 'info' && (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            )}
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${styles.text}`}>{title}</h3>
          <div className={`mt-2 text-sm ${styles.text}`}>
            <p>{message}</p>
          </div>
          {onAction && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onAction}
                className={styles.text}
              >
                {actionLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CallErrorState = ({ 
  callId, 
  error, 
  onRetry 
}: { 
  callId: string; 
  error: string; 
  onRetry: () => void;
}) => {
  return (
    <ErrorState
      title="Call Processing Error"
      message={`Failed to process call ${callId}: ${error}`}
      actionLabel="Retry Call"
      onAction={onRetry}
      variant="error"
    />
  );
};

export const DemoErrorState = ({ 
  scenarioName, 
  onRetry 
}: { 
  scenarioName: string; 
  onRetry: () => void;
}) => {
  return (
    <ErrorState
      title="Demo Scenario Failed"
      message={`The "${scenarioName}" scenario encountered an error during execution.`}
      actionLabel="Run Again"
      onAction={onRetry}
      variant="warning"
    />
  );
};