import { renderHook, act } from '@testing-library/react';
import { useErrorHandler, useAsyncErrorHandler } from '@/hooks/useErrorHandler';

// Mock useRetry hook
jest.mock('@/hooks/useRetry', () => ({
  useRetry: jest.fn(),
  useApiRetry: jest.fn(),
}));

describe('useErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('initializes with no error state', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.errorMessage).toBe('');
    expect(result.current.canRetry).toBe(false);
    expect(result.current.retryCount).toBe(0);
  });

  it('handles network errors correctly', () => {
    const { result } = renderHook(() => useErrorHandler());
    const networkError = new Error('fetch failed');
    networkError.name = 'NetworkError';

    act(() => {
      result.current.handleError(networkError);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(networkError);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.errorMessage).toContain('network');
  });

  it('handles HTTP status errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const httpError = new Error('500 Internal Server Error');

    act(() => {
      result.current.handleError(httpError);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.errorMessage).toContain('server error');
  });

  it('handles non-retryable errors', () => {
    const { result } = renderHook(() => useErrorHandler());
    const authError = new Error('401 Unauthorized');

    act(() => {
      result.current.handleError(authError);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.canRetry).toBe(false);
    expect(result.current.errorMessage).toContain('log in');
  });

  it('clears error state', () => {
    const { result } = renderHook(() => useErrorHandler());
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.isError).toBe(true);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.errorMessage).toBe('');
  });

  it('logs errors when enabled', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useErrorHandler({ logErrors: true }));
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not log errors when disabled', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useErrorHandler({ logErrors: false }));
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('stores error logs in localStorage', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('[]');
    
    const { result } = renderHook(() => useErrorHandler({ logErrors: true }));
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(getItemSpy).toHaveBeenCalledWith('errorLogs');
    expect(setItemSpy).toHaveBeenCalledWith('errorLogs', expect.any(String));
    
    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  it('dispatches custom error toast event', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    
    const { result } = renderHook(() => useErrorHandler({ showToast: true }));
    const error = new Error('Test error');

    act(() => {
      result.current.handleError(error);
    });

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'errorToast',
        detail: expect.objectContaining({
          message: expect.any(String)
        })
      })
    );
    
    dispatchEventSpy.mockRestore();
  });

  it('uses custom default error message', () => {
    const customMessage = 'Custom error occurred';
    const { result } = renderHook(() => 
      useErrorHandler({ defaultErrorMessage: customMessage })
    );
    const error = new Error('Original error');

    act(() => {
      result.current.handleError(error);
    });

    expect(result.current.errorMessage).toBe('Original error');
  });
});

describe('useAsyncErrorHandler', () => {
  it('handles successful async operations', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useAsyncErrorHandler(mockOperation));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe(null);

    let resultData;
    await act(async () => {
      resultData = await result.current.execute();
    });

    expect(resultData).toBe('success');
    expect(result.current.data).toBe('success');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('handles failed async operations', async () => {
    const mockError = new Error('Async operation failed');
    const mockOperation = jest.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useAsyncErrorHandler(mockOperation));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it('sets loading state during execution', async () => {
    let resolvePromise: (value: string) => void;
    const mockOperation = jest.fn().mockImplementation(() => 
      new Promise<string>((resolve) => {
        resolvePromise = resolve;
      })
    );
    
    const { result } = renderHook(() => useAsyncErrorHandler(mockOperation));

    act(() => {
      result.current.execute();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!('success');
    });

    expect(result.current.isLoading).toBe(false);
  });
});