import type { Meta, StoryObj } from '@storybook/react';
import { useState, useRef, useEffect } from 'react';
import { Button, Card, CardContent } from '@ganger/ui-catalyst';

const meta: Meta = {
  title: 'Accessibility/ARIA Patterns',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Demonstrations of proper ARIA patterns for complex UI components and interactions.',
      },
    },
  },
};

export default meta;

export const LiveRegions: StoryObj = {
  render: () => {
    const [notifications, setNotifications] = useState<string[]>([]);
    const [status, setStatus] = useState('');

    const addNotification = (message: string) => {
      setNotifications(prev => [...prev, message]);
      setStatus(message);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== message));
      }, 5000);
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">ARIA Live Regions</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Polite Announcements</h4>
            <div className="space-y-2">
              <Button 
                onClick={() => addNotification('File saved successfully')}
                color="green"
                size="sm"
              >
                Save File
              </Button>
              <Button 
                onClick={() => addNotification('Settings updated')}
                color="blue"
                size="sm"
              >
                Update Settings
              </Button>
            </div>
            
            {/* Polite live region - waits for screen reader to finish */}
            <div 
              aria-live="polite" 
              aria-atomic="true"
              className="sr-only"
            >
              {status}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Assertive Alerts</h4>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setStatus('Error: Invalid input detected');
                  addNotification('Error: Invalid input detected');
                }}
                color="red"
                size="sm"
              >
                Trigger Error
              </Button>
              <Button 
                onClick={() => {
                  setStatus('Warning: Low disk space');
                  addNotification('Warning: Low disk space');
                }}
                color="orange"
                size="sm"
              >
                Show Warning
              </Button>
            </div>
            
            {/* Assertive live region - interrupts screen reader */}
            <div 
              role="alert"
              aria-live="assertive" 
              aria-atomic="true"
              className="sr-only"
            >
              {status.includes('Error') || status.includes('Warning') ? status : ''}
            </div>
          </div>
        </div>
        
        {/* Visual notifications */}
        <div className="fixed bottom-4 right-4 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-lg animate-slide-in ${
                notification.includes('Error') ? 'bg-red-600 text-white' :
                notification.includes('Warning') ? 'bg-orange-600 text-white' :
                'bg-green-600 text-white'
              }`}
            >
              {notification}
            </div>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Live Region Types</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <strong>aria-live="polite"</strong>: Waits for screen reader to finish current task
              </li>
              <li>
                <strong>aria-live="assertive"</strong>: Interrupts screen reader immediately
              </li>
              <li>
                <strong>role="alert"</strong>: Assertive with semantic meaning for errors
              </li>
              <li>
                <strong>role="status"</strong>: Polite with semantic meaning for status updates
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  },
};

export const FocusManagement: StoryObj = {
  render: () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const lastFocusedElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (isModalOpen && closeButtonRef.current) {
        // Store last focused element
        lastFocusedElement.current = document.activeElement as HTMLElement;
        
        // Focus close button when modal opens
        closeButtonRef.current.focus();
        
        // Trap focus within modal
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
          
          if (e.key === 'Escape') {
            closeModal();
          }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [isModalOpen]);

    const closeModal = () => {
      setIsModalOpen(false);
      // Return focus to last focused element
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Focus Management Patterns</h3>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Focus Trap Example</h4>
              <Button onClick={() => setIsModalOpen(true)}>
                Open Modal (Tab key trapped inside)
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Skip Links</h4>
              <a 
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-cyan-600 text-white px-4 py-2 rounded"
              >
                Skip to main content
              </a>
              <p className="text-sm text-neutral-600">
                Tab to reveal the skip link (screen reader users)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Focus Indicators</h4>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded border focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2">
                  Default Ring
                </button>
                <button className="px-4 py-2 rounded border focus:outline-none focus:border-cyan-600 focus:shadow-lg">
                  Custom Shadow
                </button>
                <button className="px-4 py-2 rounded border focus:outline-2 focus:outline-dashed focus:outline-offset-2 focus:outline-purple-600">
                  Dashed Outline
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Modal */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            aria-modal="true"
            role="dialog"
            aria-labelledby="modal-title"
          >
            <div 
              ref={modalRef}
              className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h2 id="modal-title" className="text-lg font-semibold mb-4">
                Focus Trap Modal
              </h2>
              
              <p className="mb-4 text-sm text-neutral-600">
                Try pressing Tab - focus will stay within this modal. 
                Press Escape to close.
              </p>
              
              <div className="space-y-3 mb-4">
                <input 
                  type="text" 
                  placeholder="Text input"
                  className="w-full px-3 py-2 border rounded"
                />
                <select className="w-full px-3 py-2 border rounded">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button ref={closeButtonRef} onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
};

export const FormAccessibility: StoryObj = {
  render: () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validate = (name: string, value: string) => {
      const newErrors = { ...errors };
      
      switch (name) {
        case 'email':
          if (!value) {
            newErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(value)) {
            newErrors.email = 'Email is invalid';
          } else {
            delete newErrors.email;
          }
          break;
        case 'password':
          if (!value) {
            newErrors.password = 'Password is required';
          } else if (value.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
          } else {
            delete newErrors.password;
          }
          break;
      }
      
      setErrors(newErrors);
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Accessible Form Patterns</h3>
        
        <form className="max-w-md space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : 'email-hint'}
              className={`w-full px-3 py-2 border rounded ${
                errors.email && touched.email ? 'border-red-500' : ''
              }`}
              onBlur={(e) => {
                setTouched({ ...touched, email: true });
                validate('email', e.target.value);
              }}
              onChange={(e) => validate('email', e.target.value)}
            />
            <p id="email-hint" className="text-xs text-neutral-600 mt-1">
              We'll never share your email
            </p>
            {errors.email && touched.email && (
              <p id="email-error" role="alert" className="text-sm text-red-600 mt-1">
                {errors.email}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
              <span className="text-red-500 ml-1" aria-label="required">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              className={`w-full px-3 py-2 border rounded ${
                errors.password && touched.password ? 'border-red-500' : ''
              }`}
              onBlur={(e) => {
                setTouched({ ...touched, password: true });
                validate('password', e.target.value);
              }}
              onChange={(e) => validate('password', e.target.value)}
            />
            <p id="password-hint" className="text-xs text-neutral-600 mt-1">
              Minimum 8 characters
            </p>
            {errors.password && touched.password && (
              <p id="password-error" role="alert" className="text-sm text-red-600 mt-1">
                {errors.password}
              </p>
            )}
          </div>
          
          <fieldset>
            <legend className="text-sm font-medium mb-2">Notification Preferences</legend>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifications" value="email" />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="notifications" value="sms" />
                <span>SMS notifications</span>
              </label>
            </div>
          </fieldset>
          
          <div className="pt-4">
            <Button type="submit" className="w-full">
              Submit Form
            </Button>
          </div>
        </form>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2">Form Accessibility Features</h4>
            <ul className="space-y-1 text-sm">
              <li>✅ Proper label associations with for/id</li>
              <li>✅ aria-required for required fields</li>
              <li>✅ aria-invalid for error states</li>
              <li>✅ aria-describedby for hints and errors</li>
              <li>✅ role="alert" for error messages</li>
              <li>✅ Fieldset/legend for grouped inputs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  },
};

export const NavigationPatterns: StoryObj = {
  render: () => {
    const [activeTab, setActiveTab] = useState(0);
    const tabs = ['Profile', 'Settings', 'Billing', 'Security'];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Navigation ARIA Patterns</h3>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Tab Navigation</h4>
            
            <div role="tablist" aria-label="Account settings">
              <div className="flex border-b">
                {tabs.map((tab, index) => (
                  <button
                    key={tab}
                    role="tab"
                    id={`tab-${index}`}
                    aria-controls={`panel-${index}`}
                    aria-selected={activeTab === index}
                    tabIndex={activeTab === index ? 0 : -1}
                    onClick={() => setActiveTab(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        setActiveTab((index + 1) % tabs.length);
                      } else if (e.key === 'ArrowLeft') {
                        setActiveTab((index - 1 + tabs.length) % tabs.length);
                      }
                    }}
                    className={`px-4 py-2 border-b-2 transition-colors ${
                      activeTab === index
                        ? 'border-cyan-600 text-cyan-600'
                        : 'border-transparent hover:text-neutral-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {tabs.map((tab, index) => (
                <div
                  key={tab}
                  role="tabpanel"
                  id={`panel-${index}`}
                  aria-labelledby={`tab-${index}`}
                  hidden={activeTab !== index}
                  tabIndex={0}
                  className="p-4"
                >
                  <h3 className="font-medium mb-2">{tab} Content</h3>
                  <p className="text-sm text-neutral-600">
                    This is the content for the {tab.toLowerCase()} tab. 
                    Use arrow keys to navigate between tabs.
                  </p>
                </div>
              ))}
            </div>
            
            <p className="text-xs text-neutral-600 mt-4">
              Keyboard: Use arrow keys to navigate, Tab to enter panel
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Breadcrumb Navigation</h4>
            
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <a href="#" className="text-cyan-600 hover:underline">Home</a>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <a href="#" className="text-cyan-600 hover:underline">Patients</a>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <span aria-current="page" className="text-neutral-700">
                    John Doe
                  </span>
                </li>
              </ol>
            </nav>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Menu Navigation</h4>
            
            <nav role="navigation" aria-label="Main menu">
              <ul role="menu" className="space-y-1">
                <li role="none">
                  <a 
                    href="#"
                    role="menuitem"
                    className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Dashboard
                  </a>
                </li>
                <li role="none">
                  <a 
                    href="#"
                    role="menuitem"
                    aria-current="page"
                    className="block px-3 py-2 rounded bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600"
                  >
                    Patients
                  </a>
                </li>
                <li role="none">
                  <a 
                    href="#"
                    role="menuitem"
                    className="block px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Appointments
                  </a>
                </li>
              </ul>
            </nav>
          </CardContent>
        </Card>
      </div>
    );
  },
};

export const LoadingStates: StoryObj = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const simulateLoading = () => {
      setLoading(true);
      setProgress(0);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setLoading(false);
            return 0;
          }
          return prev + 10;
        });
      }, 300);
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Accessible Loading States</h3>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Loading Button with Live Region</h4>
            
            <Button 
              onClick={simulateLoading}
              disabled={loading}
              aria-busy={loading}
              aria-live="polite"
            >
              {loading ? (
                <>
                  <span className="sr-only">Loading, please wait</span>
                  <span aria-hidden="true">Loading...</span>
                </>
              ) : (
                'Load Data'
              )}
            </Button>
            
            <div 
              role="status" 
              aria-live="polite" 
              aria-atomic="true"
              className="mt-2 text-sm text-neutral-600"
            >
              {loading ? `Loading progress: ${progress}%` : 'Ready to load'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Progress Bar with ARIA</h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span id="upload-label">Upload Progress</span>
                  <span>{progress}%</span>
                </div>
                <div 
                  role="progressbar"
                  aria-labelledby="upload-label"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden"
                >
                  <div 
                    className="h-full bg-cyan-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <Button onClick={simulateLoading} size="sm">
                Start Progress
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Skeleton Loading</h4>
            
            <div className="space-y-3">
              <div 
                className="animate-pulse"
                role="status"
                aria-label="Loading content"
              >
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
                <span className="sr-only">Loading...</span>
              </div>
              
              <p className="text-xs text-neutral-600">
                Screen readers announce "Loading content"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
};