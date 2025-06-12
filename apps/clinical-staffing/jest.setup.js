import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => Promise.resolve()),
      })),
      unsubscribe: jest.fn(),
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  })),
}))

// Mock @ganger packages
jest.mock('@ganger/auth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    error: null,
  })),
  AuthProvider: ({ children }) => children,
}))

jest.mock('@ganger/ui', () => ({
  AppLayout: ({ children }) => <div data-testid="app-layout">{children}</div>,
  PageHeader: ({ title, subtitle }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
  Card: ({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, variant, size, className, ...props }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  Input: ({ value, onChange, type, className, ...props }) => (
    <input
      data-testid="input"
      type={type}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  ),
  Select: ({ value, onChange, options, className, ...props }) => (
    <select
      data-testid="select"
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    >
      {options?.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  LoadingSpinner: ({ size }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
  StatCard: ({ title, value, variant, trend }) => (
    <div data-testid="stat-card" data-variant={variant}>
      <div>{title}</div>
      <div>{value}</div>
      {trend && <div data-testid="trend">{trend.direction} {trend.value}</div>}
    </div>
  ),
  FormField: ({ label, error, children }) => (
    <div data-testid="form-field">
      <label>{label}</label>
      {children}
      {error && <div data-testid="error">{error}</div>}
    </div>
  ),
  ThemeProvider: ({ children }) => children,
}))

// Set up window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})