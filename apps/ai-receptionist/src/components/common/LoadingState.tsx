import { LoadingSpinner } from '@ganger/ui';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState = ({ 
  message = "Loading...", 
  size = 'md' 
}: LoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size={size} />
      <p className="mt-4 text-slate-600 text-sm">{message}</p>
    </div>
  );
};

export const CallLoadingState = ({ callId }: { callId: string }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
          <LoadingSpinner size="sm" />
          <span className="ml-2 text-sm text-blue-700">
            Processing call {callId}...
          </span>
        </div>
      </div>
    </div>
  );
};

export const AIProcessingState = ({ confidence }: { confidence?: number }) => {
  return (
    <div className="flex items-center space-x-2 text-sm text-slate-600">
      <div className="animate-pulse flex space-x-1">
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span>AI thinking...</span>
      {confidence && (
        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
          {Math.round(confidence * 100)}% confidence
        </span>
      )}
    </div>
  );
};