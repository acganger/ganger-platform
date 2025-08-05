import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';
import { debounce as lodashDebounce, throttle as lodashThrottle } from 'lodash';

/**
 * Generates a unique identifier using UUID v4
 * @returns A UUID v4 string
 * @example
 * const id = generateId(); // "550e8400-e29b-41d4-a716-446655440000"
 */
export const generateId = (): string => uuidv4();

/**
 * Generates a short alphanumeric ID
 * @param length - Desired length of the ID (default: 8)
 * @returns An uppercase alphanumeric string
 * @example
 * const shortId = generateShortId(); // "X7K9M2P4"
 * const longerId = generateShortId(12); // "X7K9M2P4Q8N5"
 */
export const generateShortId = (length = 8): string => {
  return Math.random().toString(36).substring(2, length + 2).toUpperCase();
};

/**
 * Encrypts a string using AES encryption
 * @param text - The text to encrypt
 * @param secretKey - The secret key for encryption
 * @returns The encrypted string
 * @example
 * const encrypted = encrypt('sensitive data', 'my-secret-key');
 */
export const encrypt = (text: string, secretKey: string): string => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

/**
 * Decrypts an AES encrypted string
 * @param encryptedText - The encrypted text to decrypt
 * @param secretKey - The secret key used for encryption
 * @returns The decrypted string
 * @example
 * const decrypted = decrypt(encryptedString, 'my-secret-key');
 */
export const decrypt = (encryptedText: string, secretKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Hashes a password using PBKDF2 with salt
 * @param password - The password to hash
 * @param salt - Optional salt (generates random salt if not provided)
 * @returns The hashed password
 * @example
 * const hashedPassword = hashPassword('userPassword123');
 * const hashedWithSalt = hashPassword('userPassword123', 'custom-salt');
 */
export const hashPassword = (password: string, salt?: string): string => {
  const saltToUse = salt || generateShortId(16);
  return CryptoJS.PBKDF2(password, saltToUse, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
};

/**
 * Generates a SHA256 hash of the input data
 * @param data - The data to hash
 * @returns The SHA256 hash as a hex string
 * @example
 * const hash = generateHash('some data'); // "5b41e0c5969f673166d0..." 
 */
export const generateHash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Splits an array into chunks of specified size
 * @param array - The array to split
 * @param size - The size of each chunk
 * @returns An array of arrays (chunks)
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * chunk(['a', 'b', 'c', 'd'], 3); // [['a', 'b', 'c'], ['d']]
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Returns unique elements from an array
 * @param array - The array to deduplicate
 * @returns Array with unique elements
 * @example
 * unique([1, 2, 2, 3, 3, 4]); // [1, 2, 3, 4]
 * unique(['a', 'b', 'a', 'c']); // ['a', 'b', 'c']
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Returns unique elements from an array based on a key or function
 * @param array - The array to deduplicate
 * @param key - Property key or function to determine uniqueness
 * @returns Array with unique elements based on the key
 * @example
 * const users = [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}, {id: 1, name: 'John2'}];
 * uniqueBy(users, 'id'); // [{id: 1, name: 'John'}, {id: 2, name: 'Jane'}]
 * uniqueBy(users, item => item.name.charAt(0)); // First user starting with each letter
 */
export const uniqueBy = <T>(array: T[], key: keyof T | ((item: T) => any)): T[] => {
  const seen = new Set();
  const keyFn = typeof key === 'function' ? key : (item: T) => item[key];
  
  return array.filter(item => {
    const keyValue = keyFn(item);
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
};

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - The array to shuffle
 * @returns A new shuffled array
 * @example
 * shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4] (random order)
 * shuffle(['a', 'b', 'c']); // ['c', 'a', 'b'] (random order)
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

/**
 * Groups array elements by a key or function result
 * @param array - The array to group
 * @param key - Property key or function to group by
 * @returns Object with grouped arrays
 * @example
 * const items = [{type: 'fruit', name: 'apple'}, {type: 'fruit', name: 'banana'}, {type: 'vegetable', name: 'carrot'}];
 * groupBy(items, 'type'); // {fruit: [{...}, {...}], vegetable: [{...}]}
 * groupBy(items, item => item.name.charAt(0)); // Group by first letter
 */
export const groupBy = <T>(array: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> => {
  const keyFn = typeof key === 'function' ? key : (item: T) => String(item[key]);
  
  return array.reduce((groups, item) => {
    const groupKey = keyFn(item);
    groups[groupKey] = groups[groupKey] || [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

/**
 * Creates a new object with only the specified keys
 * @param obj - The source object
 * @param keys - Array of keys to pick
 * @returns New object with only the picked keys
 * @example
 * const user = {id: 1, name: 'John', email: 'john@example.com', password: 'secret'};
 * pick(user, ['id', 'name']); // {id: 1, name: 'John'}
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Creates a new object excluding the specified keys
 * @param obj - The source object
 * @param keys - Array of keys to omit
 * @returns New object without the omitted keys
 * @example
 * const user = {id: 1, name: 'John', email: 'john@example.com', password: 'secret'};
 * omit(user, ['password']); // {id: 1, name: 'John', email: 'john@example.com'}
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
};

/**
 * Creates a deep clone of an object or array
 * @param obj - The object to clone
 * @returns A deep copy of the object
 * @example
 * const original = {a: 1, b: {c: 2}};
 * const cloned = deepClone(original);
 * cloned.b.c = 3; // original.b.c is still 2
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const copy = {} as T;
    Object.keys(obj).forEach(key => {
      copy[key as keyof T] = deepClone((obj as any)[key]);
    });
    return copy;
  }
  return obj;
};

/**
 * Deep equality comparison for objects and arrays
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns True if values are deeply equal
 * @example
 * isEqual({a: 1, b: {c: 2}}, {a: 1, b: {c: 2}}); // true
 * isEqual([1, 2, [3, 4]], [1, 2, [3, 4]]); // true
 * isEqual({a: 1}, {a: 2}); // false
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isEqual(item, b[index]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => isEqual(a[key], b[key]));
  }
  return false;
};

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * // Multiple rapid calls will only execute once after 300ms
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  return lodashDebounce(func, wait) as unknown as T;
};

/**
 * Creates a throttled function that only invokes func at most once per wait milliseconds
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @returns The throttled function
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll position:', window.scrollY);
 * }, 100);
 * // Will execute at most once every 100ms during scrolling
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  return lodashThrottle(func, wait) as unknown as T;
};

/**
 * Creates a memoized version of a function that caches results
 * @param fn - The function to memoize
 * @returns The memoized function
 * @example
 * const expensiveCalc = memoize((n: number) => {
 *   console.log('Computing...');
 *   return n * n;
 * });
 * expensiveCalc(5); // Logs "Computing...", returns 25
 * expensiveCalc(5); // Returns 25 from cache, no log
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Retries an async function with exponential backoff
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns Promise resolving to the function result
 * @example
 * const data = await retry(
 *   () => fetch('/api/data').then(r => r.json()),
 *   3,
 *   1000
 * );
 * // Will retry up to 3 times with delays of 1s, 2s, 3s
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await sleep(delay * attempt);
    }
  }
  
  throw lastError!;
};

/**
 * Delays execution for the specified number of milliseconds
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the delay
 * @example
 * await sleep(1000); // Wait for 1 second
 * console.log('1 second has passed');
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Adds a timeout to a promise
 * @param promise - The promise to add timeout to
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects if timeout is exceeded
 * @example
 * try {
 *   const result = await timeout(fetchData(), 5000);
 * } catch (error) {
 *   // Will throw 'Operation timed out' if fetchData takes > 5 seconds
 * }
 */
export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Executes promises with concurrency limit
 * @param promises - Array of promises to execute
 * @param concurrency - Maximum concurrent executions (default: 5)
 * @returns Promise resolving to array of results
 * @example
 * const urls = ['url1', 'url2', 'url3', 'url4', 'url5'];
 * const results = await promiseAll(
 *   urls.map(url => fetch(url)),
 *   2 // Only 2 requests at a time
 * );
 */
export const promiseAll = async <T>(
  promises: Promise<T>[],
  concurrency = 5
): Promise<T[]> => {
  const results: T[] = [];
  const chunks = chunk(promises, concurrency);
  
  for (const chunkPromises of chunks) {
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
};

/**
 * Builds a URL with query parameters
 * @param base - The base URL
 * @param params - Object of query parameters
 * @returns Complete URL with query string
 * @example
 * buildUrl('https://api.example.com/users', {
 *   page: 2,
 *   limit: 10,
 *   sort: 'name'
 * }); // "https://api.example.com/users?page=2&limit=10&sort=name"
 */
export const buildUrl = (base: string, params: Record<string, any>): string => {
  const url = new URL(base);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  
  return url.toString();
};

/**
 * Parses query parameters from a URL search string
 * @param search - The search string (with or without '?')
 * @returns Object containing query parameters
 * @example
 * parseQueryParams('?page=2&limit=10&sort=name');
 * // {page: '2', limit: '10', sort: 'name'}
 * parseQueryParams('page=2&limit=10');
 * // {page: '2', limit: '10'}
 */
export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
};

/**
 * Type guard to check if a value is a string
 * @param value - The value to check
 * @returns True if the value is a string
 * @example
 * if (isString(value)) {
 *   // TypeScript knows value is a string here
 *   console.log(value.toUpperCase());
 * }
 */
export const isString = (value: any): value is string => {
  return typeof value === 'string';
};

/**
 * Type guard to check if a value is a number (excluding NaN)
 * @param value - The value to check
 * @returns True if the value is a valid number
 * @example
 * isNumber(123); // true
 * isNumber('123'); // false
 * isNumber(NaN); // false
 */
export const isNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

/**
 * Type guard to check if a value is a boolean
 * @param value - The value to check
 * @returns True if the value is a boolean
 * @example
 * isBoolean(true); // true
 * isBoolean(false); // true
 * isBoolean(1); // false
 */
export const isBoolean = (value: any): value is boolean => {
  return typeof value === 'boolean';
};

/**
 * Type guard to check if a value is an array
 * @param value - The value to check
 * @returns True if the value is an array
 * @example
 * isArray([1, 2, 3]); // true
 * isArray('not an array'); // false
 */
export const isArray = (value: any): value is any[] => {
  return Array.isArray(value);
};

/**
 * Type guard to check if a value is a plain object (not null or array)
 * @param value - The value to check
 * @returns True if the value is a plain object
 * @example
 * isObject({a: 1}); // true
 * isObject([1, 2]); // false
 * isObject(null); // false
 */
export const isObject = (value: any): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Type guard to check if a value is a function
 * @param value - The value to check
 * @returns True if the value is a function
 * @example
 * isFunction(() => {}); // true
 * isFunction(console.log); // true
 * isFunction('not a function'); // false
 */
export const isFunction = (value: any): value is Function => {
  return typeof value === 'function';
};

/**
 * Checks if a value is empty (null, undefined, empty string/array/object)
 * @param value - The value to check
 * @returns True if the value is empty
 * @example
 * isEmpty(null); // true
 * isEmpty(''); // true
 * isEmpty([]); // true
 * isEmpty({}); // true
 * isEmpty('text'); // false
 * isEmpty([1, 2]); // false
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (isString(value) || isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
};

/**
 * Browser localStorage utilities with JSON serialization
 * Safe to use in SSR environments (returns defaultValue on server)
 */
export const localStorage = {
  /**
   * Gets a value from localStorage
   * @param key - The storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns The stored value or defaultValue
   * @example
   * const user = localStorage.get('user', { name: 'Guest' });
   */
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  /**
   * Sets a value in localStorage
   * @param key - The storage key
   * @param value - The value to store (will be JSON stringified)
   * @example
   * localStorage.set('user', { name: 'John', role: 'admin' });
   */
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  /**
   * Removes a value from localStorage
   * @param key - The storage key to remove
   * @example
   * localStorage.remove('user');
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
  
  /**
   * Clears all values from localStorage
   * @example
   * localStorage.clear();
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  },
};

/**
 * Browser sessionStorage utilities with JSON serialization
 * Safe to use in SSR environments (returns defaultValue on server)
 */
export const sessionStorage = {
  /**
   * Gets a value from sessionStorage
   * @param key - The storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns The stored value or defaultValue
   * @example
   * const sessionData = sessionStorage.get('tempData', {});
   */
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  /**
   * Sets a value in sessionStorage
   * @param key - The storage key
   * @param value - The value to store (will be JSON stringified)
   * @example
   * sessionStorage.set('tempData', { step: 1, form: {...} });
   */
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return;
    
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  },
  
  /**
   * Removes a value from sessionStorage
   * @param key - The storage key to remove
   * @example
   * sessionStorage.remove('tempData');
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(key);
  },
  
  /**
   * Clears all values from sessionStorage
   * @example
   * sessionStorage.clear();
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.clear();
  },
};

/**
 * Generates a random integer between min and max (inclusive)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer
 * @example
 * randomInt(1, 10); // Random number from 1 to 10
 * randomInt(0, 100); // Random number from 0 to 100
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generates a random float between min and max
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random float
 * @example
 * randomFloat(0, 1); // Random float from 0 to 1
 * randomFloat(10.5, 20.5); // Random float from 10.5 to 20.5
 */
export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Selects a random element from an array
 * @param array - The array to choose from
 * @returns Random element from the array
 * @example
 * randomChoice(['red', 'green', 'blue']); // Random color
 * randomChoice([1, 2, 3, 4, 5]); // Random number from array
 */
export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]!;
};

/**
 * Generates a random string of specified length
 * @param length - Length of the string (default: 8)
 * @param chars - Characters to use (default: alphanumeric)
 * @returns Random string
 * @example
 * randomString(); // "X7k9M2p4"
 * randomString(16); // "aB3xY9zK4mN7pQ2w"
 * randomString(6, '0123456789'); // "384729" (only digits)
 */
export const randomString = (length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Environment detection utilities
 */
/** True if running in browser environment */
export const isBrowser = typeof window !== 'undefined';
/** True if running on server (SSR/Node.js) */
export const isServer = !isBrowser;
/** True if NODE_ENV is 'development' */
export const isDevelopment = process.env.NODE_ENV === 'development';
/** True if NODE_ENV is 'production' */
export const isProduction = process.env.NODE_ENV === 'production';
/** True if NODE_ENV is 'test' */
export const isTest = process.env.NODE_ENV === 'test';

/**
 * Custom application error class with additional metadata
 * @example
 * throw new AppError('User not found', 'USER_NOT_FOUND', 404);
 * throw new AppError('Validation failed', 'VALIDATION_ERROR', 400, {
 *   fields: ['email', 'password']
 * });
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Factory function to create AppError instances
 * @param message - Error message
 * @param code - Error code (e.g., 'USER_NOT_FOUND')
 * @param statusCode - HTTP status code
 * @param details - Additional error details
 * @returns AppError instance
 * @example
 * const error = createError('Invalid input', 'INVALID_INPUT', 400, {
 *   field: 'email',
 *   value: 'not-an-email'
 * });
 */
export const createError = (
  message: string,
  code?: string,
  statusCode?: number,
  details?: any
): AppError => {
  return new AppError(message, code, statusCode, details);
};