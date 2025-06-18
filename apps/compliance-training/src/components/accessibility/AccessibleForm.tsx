'use client'

import { 
  createContext, 
  useContext, 
  useState, 
  useRef, 
  useCallback, 
  useEffect,
  forwardRef,
  type ReactNode,
  type FormEvent,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type SelectHTMLAttributes
} from 'react';
import { cn } from '../../../lib/utils';
import { useAccessibility, generateA11yId, createFormFieldAssociation } from '../../utils/accessibility';
import { AlertTriangle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';

// Form context for managing field associations and validation
interface FormContextValue {
  formId: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldError: (fieldName: string, error: string | null) => void;
  setFieldTouched: (fieldName: string, touched: boolean) => void;
  registerField: (fieldName: string, element: HTMLElement) => void;
  unregisterField: (fieldName: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

// Hook to use form context
function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form components must be used within AccessibleForm');
  }
  return context;
}

// Main form component
interface AccessibleFormProps {
  children: ReactNode;
  onSubmit?: (e: FormEvent) => void;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  noValidate?: boolean;
}

export function AccessibleForm({
  children,
  onSubmit,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  noValidate = true,
  ...props
}: AccessibleFormProps) {
  const { announce } = useAccessibility();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [registeredFields] = useState<Map<string, HTMLElement>>(new Map());
  const formId = useRef(generateA11yId('form')).current;

  const setFieldError = useCallback((fieldName: string, error: string | null) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, []);

  const setFieldTouched = useCallback((fieldName: string, touched: boolean) => {
    setTouched(prev => ({ ...prev, [fieldName]: touched }));
  }, []);

  const registerField = useCallback((fieldName: string, element: HTMLElement) => {
    registeredFields.set(fieldName, element);
  }, [registeredFields]);

  const unregisterField = useCallback((fieldName: string) => {
    registeredFields.delete(fieldName);
  }, [registeredFields]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for errors before submission
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      // Focus first field with error
      const firstErrorField = Object.keys(errors)[0];
      const fieldElement = registeredFields.get(firstErrorField);
      if (fieldElement) {
        fieldElement.focus();
      }
      
      announce(
        `Form submission failed. ${errorCount} error${errorCount === 1 ? '' : 's'} found. Please correct the errors and try again.`,
        'assertive'
      );
      return;
    }
    
    onSubmit?.(e);
  }, [errors, registeredFields, announce, onSubmit]);

  const contextValue: FormContextValue = {
    formId,
    errors,
    touched,
    setFieldError,
    setFieldTouched,
    registerField,
    unregisterField
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate={noValidate}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Field group component for logical grouping
interface FieldGroupProps {
  children: React.ReactNode;
  legend?: string;
  description?: string;
  required?: boolean;
  className?: string;
}

export function FieldGroup({
  children,
  legend,
  description,
  required,
  className
}: FieldGroupProps) {
  const descriptionId = description ? generateA11yId('fieldgroup-desc') : undefined;

  return (
    <fieldset 
      className={cn('border-0 p-0 m-0', className)}
      aria-describedby={descriptionId}
    >
      {legend && (
        <legend className="sr-only">
          {legend}
          {required && ' (required)'}
        </legend>
      )}
      {description && (
        <div id={descriptionId} className="text-sm text-gray-600 mb-2">
          {description}
        </div>
      )}
      {children}
    </fieldset>
  );
}

// Label component with proper association
interface LabelProps {
  children: React.ReactNode;
  htmlFor: string;
  required?: boolean;
  className?: string;
}

export function Label({ children, htmlFor, required, className }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-gray-700 mb-1', className)}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

// Input component with comprehensive accessibility
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  validate?: (value: string) => string | null;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  name,
  label,
  description,
  required,
  validate,
  showPasswordToggle,
  type = 'text',
  className,
  onBlur,
  onChange,
  ...props
}, ref) => {
  const { errors, touched, setFieldError, setFieldTouched, registerField, unregisterField } = useFormContext();
  const { announce } = useAccessibility();
  
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(props.value || '');
  const fieldRef = useRef<HTMLInputElement>(null);
  const fieldId = generateA11yId(`field-${name}`);
  const descriptionId = description ? generateA11yId(`desc-${name}`) : undefined;
  const errorId = errors[name] ? generateA11yId(`error-${name}`) : undefined;
  
  const actualType = type === 'password' && showPassword ? 'text' : type;
  const hasError = errors[name] && touched[name];

  // Register field with form context
  useEffect(() => {
    const element = fieldRef.current;
    if (element) {
      registerField(name, element);
      return () => unregisterField(name);
    }
  }, [name, registerField, unregisterField]);

  // Set up field associations
  useEffect(() => {
    const element = fieldRef.current;
    if (element) {
      const labelElement = document.querySelector(`label[for="${fieldId}"]`) as HTMLLabelElement;
      const descElement = descriptionId ? document.getElementById(descriptionId) : null;
      const errorElement = errorId ? document.getElementById(errorId) : null;
      
      createFormFieldAssociation(
        element, 
        labelElement || undefined, 
        descElement || undefined, 
        errorElement || undefined
      );
    }
  }, [fieldId, descriptionId, errorId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalValue(value);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setFieldError(name, null);
    }
    
    onChange?.(e);
  }, [errors, name, setFieldError, onChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setFieldTouched(name, true);
    
    // Validate field
    if (validate) {
      const error = validate(e.target.value);
      setFieldError(name, error);
      
      if (error) {
        announce(`Validation error in ${label || name}: ${error}`, 'assertive');
      }
    }
    
    onBlur?.(e);
  }, [name, validate, setFieldTouched, setFieldError, label, announce, onBlur]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword);
    announce(
      `Password ${showPassword ? 'hidden' : 'visible'}`,
      'polite'
    );
  }, [showPassword, announce]);

  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      
      {description && (
        <div id={descriptionId} className="text-sm text-gray-600">
          {description}
        </div>
      )}
      
      <div className="relative">
        <input
          {...props}
          ref={(element) => {
            (fieldRef as React.MutableRefObject<HTMLInputElement | HTMLSelectElement | null>).current = element;
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | HTMLSelectElement | null>).current = element;
            }
          }}
          type={actualType}
          id={fieldId}
          name={name}
          required={required}
          value={internalValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            hasError && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            showPasswordToggle && 'pr-10',
            className
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-required={required}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
      
      {hasError && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1 text-sm text-red-600"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {errors[name]}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Select component with accessibility
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  name,
  label,
  description,
  required,
  options,
  placeholder,
  className,
  onChange,
  ...props
}, ref) => {
  const { errors, touched, setFieldTouched, registerField, unregisterField } = useFormContext();
  const { announce } = useAccessibility();
  
  const fieldRef = useRef<HTMLSelectElement>(null);
  const fieldId = generateA11yId(`select-${name}`);
  const descriptionId = description ? generateA11yId(`desc-${name}`) : undefined;
  const errorId = errors[name] ? generateA11yId(`error-${name}`) : undefined;
  
  const hasError = errors[name] && touched[name];

  // Register field with form context
  useEffect(() => {
    const element = fieldRef.current;
    if (element) {
      registerField(name, element);
      return () => unregisterField(name);
    }
  }, [name, registerField, unregisterField]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = options.find(opt => opt.value === e.target.value);
    announce(
      `Selected ${selectedOption?.label || e.target.value}`,
      'polite'
    );
    onChange?.(e);
  }, [options, announce, onChange]);

  const handleBlur = useCallback(() => {
    setFieldTouched(name, true);
  }, [name, setFieldTouched]);

  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}
      
      {description && (
        <div id={descriptionId} className="text-sm text-gray-600">
          {description}
        </div>
      )}
      
      <select
        {...props}
        ref={(element) => {
          (fieldRef as React.MutableRefObject<HTMLSelectElement | null>).current = element;
          if (typeof ref === 'function') {
            ref(element);
          } else if (ref) {
            ref.current = element;
          }
        }}
        id={fieldId}
        name={name}
        required={required}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          hasError && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-required={required}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      
      {hasError && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1 text-sm text-red-600"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {errors[name]}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Checkbox component with accessibility
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  name,
  label,
  description,
  required,
  className,
  ...props
}, ref) => {
  const { errors, touched, setFieldTouched, registerField, unregisterField } = useFormContext();
  
  const fieldRef = useRef<HTMLInputElement>(null);
  const fieldId = generateA11yId(`checkbox-${name}`);
  const descriptionId = description ? generateA11yId(`desc-${name}`) : undefined;
  const errorId = errors[name] ? generateA11yId(`error-${name}`) : undefined;
  
  const hasError = errors[name] && touched[name];

  // Register field with form context
  useEffect(() => {
    const element = fieldRef.current;
    if (element) {
      registerField(name, element);
      return () => unregisterField(name);
    }
  }, [name, registerField, unregisterField]);

  const handleBlur = useCallback(() => {
    setFieldTouched(name, true);
  }, [name, setFieldTouched]);

  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <input
          {...props}
          ref={(element) => {
            (fieldRef as React.MutableRefObject<HTMLInputElement | HTMLSelectElement | null>).current = element;
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | HTMLSelectElement | null>).current = element;
            }
          }}
          type="checkbox"
          id={fieldId}
          name={name}
          required={required}
          onBlur={handleBlur}
          className={cn(
            'h-4 w-4 mt-0.5 text-blue-600 border-gray-300 rounded',
            'focus:ring-2 focus:ring-blue-500',
            hasError && 'border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={hasError ? 'true' : 'false'}
          aria-required={required}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        />
        
        <div className="flex-1">
          <label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
          
          {description && (
            <div id={descriptionId} className="text-sm text-gray-600 mt-1">
              {description}
            </div>
          )}
        </div>
      </div>
      
      {hasError && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          className="flex items-center gap-1 text-sm text-red-600"
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {errors[name]}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Form message component for success/info messages
interface FormMessageProps {
  type: 'success' | 'info' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

export function FormMessage({ type, children, className }: FormMessageProps) {
  const icons = {
    success: CheckCircle,
    info: Info,
    warning: AlertTriangle,
    error: AlertTriangle
  };
  
  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  };
  
  const Icon = icons[type];
  
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn(
        'flex items-center gap-2 p-3 border rounded-md',
        styles[type],
        className
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <div className="text-sm">{children}</div>
    </div>
  );
}