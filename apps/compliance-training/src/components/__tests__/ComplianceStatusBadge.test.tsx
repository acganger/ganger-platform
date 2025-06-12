import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComplianceStatusBadge } from '@/components/shared/ComplianceStatusBadge';

describe('ComplianceStatusBadge', () => {
  it('renders completed status correctly', () => {
    render(<ComplianceStatusBadge status="completed" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders overdue status correctly', () => {
    render(<ComplianceStatusBadge status="overdue" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders due_soon status correctly', () => {
    render(<ComplianceStatusBadge status="due_soon" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    expect(screen.getByText('Due Soon')).toBeInTheDocument();
  });

  it('renders not_started status correctly', () => {
    render(<ComplianceStatusBadge status="not_started" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<ComplianceStatusBadge status="completed" size="sm" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('renders with large size', () => {
    render(<ComplianceStatusBadge status="completed" size="lg" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('shows icon when showIcon is true', () => {
    render(<ComplianceStatusBadge status="completed" showIcon={true} />);
    
    expect(screen.getByTestId('status-icon')).toBeInTheDocument();
  });

  it('hides text when showText is false', () => {
    render(<ComplianceStatusBadge status="completed" showText={false} />);
    
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<ComplianceStatusBadge status="completed" onClick={handleClick} />);
    
    const badge = screen.getByRole('button');
    badge.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is not clickable when no onClick handler', () => {
    render(<ComplianceStatusBadge status="completed" />);
    
    const element = screen.getByText('Completed').closest('span');
    expect(element).not.toHaveClass('cursor-pointer');
  });

  it('applies custom className', () => {
    render(<ComplianceStatusBadge status="completed" className="custom-class" />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders with interactive states when clickable', () => {
    const handleClick = jest.fn();
    render(<ComplianceStatusBadge status="completed" onClick={handleClick} />);
    
    const badge = screen.getByRole('button');
    expect(badge).toHaveClass('cursor-pointer', 'hover:shadow-sm');
  });
});