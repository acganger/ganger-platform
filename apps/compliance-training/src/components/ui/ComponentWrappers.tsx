// Component wrappers to fix TypeScript JSX issues
import React from 'react';
import { Button as OriginalButton } from '@ganger/ui';
import { Card as OriginalCard, Modal as OriginalModal } from '@ganger/ui-catalyst';
import { Input as OriginalInput, Select as OriginalSelect } from '@ganger/ui-catalyst';

// Extract types manually to avoid conflicts
interface CardWrapperProps {
  children?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  [key: string]: any;
}

interface ButtonWrapperProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  [key: string]: any;
}

interface ModalWrapperProps {
  children?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  [key: string]: any;
}

interface SelectWrapperProps {
  children?: React.ReactNode;
  className?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  [key: string]: any;
}

interface InputWrapperProps {
  className?: string;
  type?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  [key: string]: any;
}

// Wrapper components to fix React type incompatibilities
export const Card: React.FC<CardWrapperProps> = ({ children, ...props }) => (
  React.createElement(OriginalCard as any, props, children)
);

export const Button: React.FC<ButtonWrapperProps> = ({ children, ...props }) => (
  React.createElement(OriginalButton as any, props, children)
);

export const Modal: React.FC<ModalWrapperProps> = ({ children, ...props }) => (
  React.createElement(OriginalModal as any, props, children)
);

export const Select: React.FC<SelectWrapperProps> = ({ children, ...props }) => (
  React.createElement(OriginalSelect as any, props, children)
);

export const Input: React.FC<InputWrapperProps> = ({ ...props }) => (
  React.createElement(OriginalInput as any, props)
);