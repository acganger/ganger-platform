import { 
  commonRecoveryStrategies, 
  attemptRecovery, 
  withAutoRecovery,
  ProgressiveDegradation,
  progressiveDegradation 
} from '@/utils/error-recovery';

// Mock global objects
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock navigator and window objects
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    getRegistrations: jest.fn().mockResolvedValue([]),
    register: jest.fn().mockResolvedValue({}),
  },
  writable: true,
});

// Mock caches API
Object.defineProperty(window, 'caches', {
  value: {
    keys: jest.fn().mockResolvedValue(['cache1', 'cache2']),
    delete: jest.fn().mockResolvedValue(true),
  },
  writable: true,
});

describe('commonRecoveryStrategies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Network connectivity recovery', () => {
    it('identifies network errors correctly', () => {
      const networkStrategy = commonRecoveryStrategies[0];
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';

      expect(networkStrategy.canRecover(networkError)).toBe(true);
    });

    it('waits for online status and tests connectivity', async () => {
      const networkStrategy = commonRecoveryStrategies[0];
      const networkError = new Error('fetch failed');
      
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await networkStrategy.recover(networkError);

      expect(result).toEqual({ recovered: true, strategy: 'network' });
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
    });

    it('throws error when connectivity test fails', async () => {
      const networkStrategy = commonRecoveryStrategies[0];
      const networkError = new Error('fetch failed');
      
      mockFetch.mockRejectedValueOnce(new Error('Still offline'));

      await expect(networkStrategy.recover(networkError)).rejects.toThrow('Network connectivity test failed');
    });
  });

  describe('Cache refresh recovery', () => {
    it('identifies cache-related errors', () => {
      const cacheStrategy = commonRecoveryStrategies[1];
      const cacheError = new Error('Cache is stale');

      expect(cacheStrategy.canRecover(cacheError)).toBe(true);
    });

    it('clears caches and localStorage', async () => {
      const cacheStrategy = commonRecoveryStrategies[1];
      const cacheError = new Error('Cache outdated');

      // Mock localStorage
      const mockLocalStorage = {
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      const result = await cacheStrategy.recover(cacheError);

      expect(result).toEqual({ recovered: true, strategy: 'cache_refresh' });
      expect(window.caches.keys).toHaveBeenCalled();
      expect(window.caches.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Authentication refresh recovery', () => {
    it('identifies authentication errors', () => {
      const authStrategy = commonRecoveryStrategies[2];
      const authError = new Error('401 Unauthorized');

      expect(authStrategy.canRecover(authError)).toBe(true);
    });

    it('refreshes authentication token', async () => {
      const authStrategy = commonRecoveryStrategies[2];
      const authError = new Error('401 Unauthorized');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: 'new-token' }),
      });

      // Mock localStorage
      const mockLocalStorage = {
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      const result = await authStrategy.recover(authError);

      expect(result).toEqual({ 
        recovered: true, 
        strategy: 'auth_refresh', 
        token: 'new-token' 
      });
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
    });

    it('redirects to login when refresh fails', async () => {
      const authStrategy = commonRecoveryStrategies[2];
      const authError = new Error('token expired');

      mockFetch.mockRejectedValueOnce(new Error('Refresh failed'));

      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '' };

      await expect(authStrategy.recover(authError)).rejects.toThrow();
      expect(window.location.href).toBe('/login');
    });
  });

  describe('Memory cleanup recovery', () => {
    it('identifies memory-related errors', () => {
      const memoryStrategy = commonRecoveryStrategies[5];
      const memoryError = new Error('Quota exceeded');
      memoryError.name = 'QuotaExceededError';

      expect(memoryStrategy.canRecover(memoryError)).toBe(true);
    });

    it('performs memory cleanup', async () => {
      const memoryStrategy = commonRecoveryStrategies[5];
      const memoryError = new Error('Out of memory');

      // Mock gc function
      (window as any).gc = jest.fn();

      const result = await memoryStrategy.recover(memoryError);

      expect(result).toEqual({ recovered: true, strategy: 'memory_cleanup' });
      expect((window as any).gc).toHaveBeenCalled();
    });
  });
});

describe('attemptRecovery', () => {
  it('attempts recovery with matching strategies', async () => {
    const mockStrategy = {
      canRecover: jest.fn().mockReturnValue(true),
      recover: jest.fn().mockResolvedValue({ recovered: true }),
      description: 'Mock strategy'
    };

    const error = new Error('Test error');
    const onRecoveryAttempt = jest.fn();
    const onRecoverySuccess = jest.fn();

    const result = await attemptRecovery(error, {
      strategies: [mockStrategy],
      onRecoveryAttempt,
      onRecoverySuccess
    });

    expect(result.recovered).toBe(true);
    expect(result.strategy).toBe(mockStrategy);
    expect(onRecoveryAttempt).toHaveBeenCalledWith(mockStrategy, 1);
    expect(onRecoverySuccess).toHaveBeenCalledWith(mockStrategy);
  });

  it('retries failed recovery attempts', async () => {
    const mockStrategy = {
      canRecover: jest.fn().mockReturnValue(true),
      recover: jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValue({ recovered: true }),
      description: 'Mock strategy'
    };

    const error = new Error('Test error');
    const result = await attemptRecovery(error, {
      strategies: [mockStrategy],
      maxAttempts: 2
    });

    expect(result.recovered).toBe(true);
    expect(mockStrategy.recover).toHaveBeenCalledTimes(2);
  });

  it('returns false when no strategies can recover', async () => {
    const mockStrategy = {
      canRecover: jest.fn().mockReturnValue(false),
      recover: jest.fn(),
      description: 'Mock strategy'
    };

    const error = new Error('Test error');
    const result = await attemptRecovery(error, {
      strategies: [mockStrategy]
    });

    expect(result.recovered).toBe(false);
    expect(mockStrategy.recover).not.toHaveBeenCalled();
  });

  it('calls onRecoveryFailure when all attempts fail', async () => {
    const mockStrategy = {
      canRecover: jest.fn().mockReturnValue(true),
      recover: jest.fn().mockRejectedValue(new Error('Recovery failed')),
      description: 'Mock strategy'
    };

    const error = new Error('Test error');
    const onRecoveryFailure = jest.fn();

    const result = await attemptRecovery(error, {
      strategies: [mockStrategy],
      maxAttempts: 2,
      onRecoveryFailure
    });

    expect(result.recovered).toBe(false);
    expect(onRecoveryFailure).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('withAutoRecovery', () => {
  it('executes function normally when no error occurs', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = withAutoRecovery(mockFn, { strategies: [] });

    const result = await wrappedFn('arg1', 'arg2');

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('attempts recovery when function throws error', async () => {
    const mockError = new Error('Function failed');
    const mockFn = jest.fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValue('success after recovery');

    const mockStrategy = {
      canRecover: jest.fn().mockReturnValue(true),
      recover: jest.fn().mockResolvedValue({ recovered: true }),
      description: 'Mock strategy'
    };

    const wrappedFn = withAutoRecovery(mockFn, { strategies: [mockStrategy] });

    const result = await wrappedFn();

    expect(result).toBe('success after recovery');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockStrategy.recover).toHaveBeenCalledWith(mockError);
  });

  it('re-throws error when recovery fails', async () => {
    const mockError = new Error('Function failed');
    const mockFn = jest.fn().mockRejectedValue(mockError);

    const mockStrategy = {
      canRecover: jest.fn().mockReturnValue(false),
      recover: jest.fn(),
      description: 'Mock strategy'
    };

    const wrappedFn = withAutoRecovery(mockFn, { strategies: [mockStrategy] });

    await expect(wrappedFn()).rejects.toBe(mockError);
  });
});

describe('ProgressiveDegradation', () => {
  it('initializes with feature detection', () => {
    const pd = new ProgressiveDegradation();

    expect(pd.isFeatureAvailable('fetch')).toBe(true);
    expect(pd.isFeatureAvailable('serviceWorker')).toBe(true);
  });

  it('uses modern implementation when feature is available', () => {
    const pd = new ProgressiveDegradation();
    const modernImpl = jest.fn().mockReturnValue('modern result');
    const fallbackImpl = jest.fn().mockReturnValue('fallback result');

    const result = pd.useFeatureOrFallback('fetch', modernImpl, fallbackImpl);

    expect(result).toBe('modern result');
    expect(modernImpl).toHaveBeenCalled();
    expect(fallbackImpl).not.toHaveBeenCalled();
  });

  it('uses fallback when feature is not available', () => {
    const pd = new ProgressiveDegradation();
    const modernImpl = jest.fn().mockReturnValue('modern result');
    const fallbackImpl = jest.fn().mockReturnValue('fallback result');

    const result = pd.useFeatureOrFallback('nonexistent', modernImpl, fallbackImpl);

    expect(result).toBe('fallback result');
    expect(modernImpl).not.toHaveBeenCalled();
    expect(fallbackImpl).toHaveBeenCalled();
  });

  it('uses fallback when modern implementation throws', () => {
    const pd = new ProgressiveDegradation();
    const modernImpl = jest.fn().mockImplementation(() => {
      throw new Error('Modern feature failed');
    });
    const fallbackImpl = jest.fn().mockReturnValue('fallback result');

    const result = pd.useFeatureOrFallback('fetch', modernImpl, fallbackImpl);

    expect(result).toBe('fallback result');
    expect(modernImpl).toHaveBeenCalled();
    expect(fallbackImpl).toHaveBeenCalled();
  });

  it('disables features when they cause errors', () => {
    const pd = new ProgressiveDegradation();
    const fetchError = new Error('fetch is not defined');

    expect(pd.isFeatureAvailable('fetch')).toBe(true);

    pd.degradeGracefully(fetchError);

    expect(pd.isFeatureAvailable('fetch')).toBe(false);
  });

  it('sets and uses registered fallbacks', () => {
    const pd = new ProgressiveDegradation();
    const registeredFallback = jest.fn().mockReturnValue('registered fallback');

    pd.setFallback('customFeature', registeredFallback);

    const result = pd.useFeatureOrFallback('customFeature', () => 'modern');

    expect(result).toBe('registered fallback');
    expect(registeredFallback).toHaveBeenCalled();
  });
});