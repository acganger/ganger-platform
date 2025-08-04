import { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

/**
 * Props for the Button component
 * @extends ButtonHTMLAttributes<HTMLButtonElement>
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   * @default 'primary'
   * - primary: Blue background for main actions
   * - secondary: Gray background for secondary actions
   * - outline: White background with border
   * - ghost: Transparent background with hover effect
   * - destructive/danger: Red background for dangerous actions
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
  
  /**
   * Size of the button
   * @default 'md'
   * - sm: Small button with min-height 44px (accessible touch target)
   * - md: Medium button with min-height 44px
   * - lg: Large button with min-height 48px
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Whether the button is in a loading state
   * Shows a spinner and disables interaction
   * @default false
   */
  loading?: boolean;
  
  /**
   * Whether the button should take full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Icon to display on the left side of the button text
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icon to display on the right side of the button text
   */
  rightIcon?: React.ReactNode;
}

/**
 * Props for the Input component
 * @extends InputHTMLAttributes<HTMLInputElement>
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text displayed above the input
   * Automatically associated with input via generated ID
   */
  label?: string;
  
  /**
   * Error message displayed below the input
   * When present, input border turns red
   */
  error?: string;
  
  /**
   * Helper text displayed below the input
   * Hidden when error is present
   */
  helper?: string;
}

/**
 * Props for the Checkbox component
 * @extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Label text displayed next to the checkbox
   */
  label?: string;
  
  /**
   * Additional description text below the label
   */
  description?: string;
  
  /**
   * Error message displayed below the checkbox
   */
  error?: string;
}

/**
 * Option item for Select component
 */
export interface SelectOption {
  /**
   * The value submitted when this option is selected
   */
  value: string;
  
  /**
   * The text displayed to the user
   */
  label: string;
  
  /**
   * Whether this option is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Props for the Select component
 * @extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'>
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /**
   * Label text displayed above the select
   */
  label?: string;
  
  /**
   * Error message displayed below the select
   * When present, select border turns red
   */
  error?: string;
  
  /**
   * Helper text displayed below the select
   * Hidden when error is present
   */
  helper?: string;
  
  /**
   * Array of options to display in the dropdown
   */
  options: SelectOption[];
  
  /**
   * Placeholder text shown when no option is selected
   */
  placeholder?: string;
}

/**
 * Props for the Badge component
 * @extends React.HTMLAttributes<HTMLSpanElement>
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Visual style variant of the badge
   * @default 'primary'
   * - primary: Blue background for general information
   * - secondary: Gray background for less emphasis
   * - success: Green background for positive states
   * - warning: Yellow background for caution states
   * - destructive: Red background for error/danger states
   * - outline: Transparent with border for subtle emphasis
   */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  
  /**
   * Size of the badge
   * @default 'md'
   * - sm: Small badge with xs text
   * - md: Medium badge with sm text
   * - lg: Large badge with base text
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Content to display inside the badge
   */
  children: React.ReactNode;
}

/**
 * Props for the Avatar component
 * @extends React.HTMLAttributes<HTMLDivElement>
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * URL of the avatar image
   * If not provided or fails to load, falls back to initials
   */
  src?: string;
  
  /**
   * Alt text for the image, also used to generate initials
   * First two words are used to create initials (e.g., "John Doe" → "JD")
   */
  alt?: string;
  
  /**
   * Size of the avatar
   * @default 'md'
   * - xs: 24x24px with xs text
   * - sm: 32x32px with sm text
   * - md: 40x40px with base text
   * - lg: 48x48px with lg text
   * - xl: 64x64px with xl text
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Custom initials to display instead of auto-generated ones
   * Overrides the initials generated from alt text
   */
  initials?: string;
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
}

/**
 * Props for the Switch component
 */
export interface SwitchProps {
  /**
   * Whether the switch is checked
   * This is a controlled component, so this prop is required
   */
  checked: boolean;
  
  /**
   * Callback when the switch state changes
   * @param checked - The new checked state
   */
  onChange: (checked: boolean) => void;
  
  /**
   * Whether the switch is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Size of the switch
   * @default 'md'
   * - sm: Small switch
   * - md: Medium switch
   * - lg: Large switch
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  
  /**
   * HTML id attribute
   */
  id?: string;
  
  /**
   * Accessibility label for screen readers
   * Important for switches without visible labels
   */
  'aria-label'?: string;
  
  /**
   * ID of element that describes the switch
   * Used for additional context for screen readers
   */
  'aria-describedby'?: string;
}