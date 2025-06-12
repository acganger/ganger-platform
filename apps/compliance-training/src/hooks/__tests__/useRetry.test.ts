import { renderHook, act } from '@testing-library/react';
import { useRetry, useApiRetry, useCircuitBreaker } from '@/hooks/useRetry';

describe('useRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('succeeds on first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useRetry(mockFn));

    let resultValue;
    await act(async () => {
      resultValue = await result.current.execute();
    });

    expect(resultValue).toBe('success');
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(null);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => 
      useRetry(mockFn, { maxAttempts: 3, baseDelay: 10 })
    );

    let resultValue;
    await act(async () => {
      resultValue = await result.current.execute();
    });

    expect(resultValue).toBe('success');
    expect(result.current.attemptCount).toBe(3);
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('fails after max attempts', async () => {
    const mockError = new Error('Persistent failure');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useRetry(mockFn, { maxAttempts: 2, baseDelay: 10 })
    );

    await act(async () => {
      try {
        await result.current.execute();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(result.current.hasExceededMaxAttempts).toBe(true);
    expect(result.current.lastError).toBe(mockError);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('respects retry condition', async () => {
    const mockError = new Error('Non-retryable error');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxAttempts: 3, 
        baseDelay: 10,
        retryCondition: () => false // Never retry
      })
    );

    await act(async () => {
      try {
        await result.current.execute();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockFn).toHaveBeenCalledTimes(1); // Only called once, no retries
  });

  it('calls retry callbacks', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');

    const onRetry = jest.fn();
    const onMaxAttemptsReached = jest.fn();

    const { result } = renderHook(() => 
      useRetry(mockFn, { 
        maxAttempts: 3, 
        baseDelay: 10,
        onRetry,
        onMaxAttemptsReached
      })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    expect(onMaxAttemptsReached).not.toHaveBeenCalled();
  });

  it('can be aborted', async () => {
    let resolvePromise: (value: string) => void;
    const mockFn = jest.fn().mockImplementation(() => 
      new Promise<string>((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useRetry(mockFn));

    act(() => {
      result.current.execute();
    });

    act(() => {
      result.current.abort();
    });

    expect(result.current.isRetrying).toBe(false);
  });

  it('can be reset', async () => {
    const mockError = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => useRetry(mockFn, { maxAttempts: 1 }));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.lastError).toBe(mockError);

    act(() => {
      result.current.reset();
    });

    expect(result.current.lastError).toBe(null);
    expect(result.current.attemptCount).toBe(0);
    expect(result.current.hasExceededMaxAttempts).toBe(false);
  });
});

describe('useApiRetry', () => {
  it('retries on specified HTTP status codes', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('429 Too Many Requests'))
      .mockResolvedValue('success');

    const { result } = renderHook(() => 
      useApiRetry(mockFn, { maxAttempts: 2, baseDelay: 10, retryOn: [429] })
    );

    let resultValue;
    await act(async () => {
      resultValue = await result.current.execute();
    });

    expect(resultValue).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('does not retry on non-specified HTTP status codes', async () => {
    const mockError = new Error('404 Not Found');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useApiRetry(mockFn, { maxAttempts: 3, baseDelay: 10, retryOn: [500, 502] })
    );

    await act(async () => {
      try {
        await result.current.execute();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });

    expect(mockFn).toHaveBeenCalledTimes(1); // No retries for 404
  });
});

describe('useCircuitBreaker', () => {
  it('starts in closed state', () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const { result } = renderHook(() => useCircuitBreaker(mockFn));

    expect(result.current.state).toBe('closed');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.failureCount).toBe(0);
  });

  it('opens circuit after failure threshold', async () => {
    const mockError = new Error('Service error');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useCircuitBreaker(mockFn, { failureThreshold: 2, resetTimeout: 1000, monitoringWindow: 5000 })
    );

    // First failure
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.state).toBe('closed');

    // Second failure - should open circuit
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.state).toBe('open');
    expect(result.current.isOpen).toBe(true);
    expect(result.current.failureCount).toBe(2);
  });

  it('rejects immediately when circuit is open', async () => {
    const mockError = new Error('Service error');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useCircuitBreaker(mockFn, { failureThreshold: 1, resetTimeout: 1000, monitoringWindow: 5000 })
    );

    // Trigger failure to open circuit
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.isOpen).toBe(true);

    // Next call should be rejected immediately
    await act(async () => {
      try {
        await result.current.execute();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toBe('Circuit breaker is open');
      }
    });

    // Function should only be called once (for the first failure)
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('can be manually reset', async () => {
    const mockError = new Error('Service error');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useCircuitBreaker(mockFn, { failureThreshold: 1, resetTimeout: 1000, monitoringWindow: 5000 })
    );

    // Trigger failure to open circuit
    await act(async () => {
      try {
        await result.current.execute();
      } catch (error) {
        // Expected
      }
    });

    expect(result.current.isOpen).toBe(true);

    // Reset circuit
    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toBe('closed');
    expect(result.current.failureCount).toBe(0);
  });
});