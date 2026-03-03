/**
 * Tests for LoadingSpinner component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render spinner with default size', () => {
    render(<LoadingSpinner />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render spinner with small size', () => {
    render(<LoadingSpinner size="sm" />);

    const spinner = document.querySelector('.w-4.h-4');
    expect(spinner).toBeInTheDocument();
  });

  it('should render spinner with medium size', () => {
    render(<LoadingSpinner size="md" />);

    const spinner = document.querySelector('.w-8.h-8');
    expect(spinner).toBeInTheDocument();
  });

  it('should render spinner with large size', () => {
    render(<LoadingSpinner size="lg" />);

    const spinner = document.querySelector('.w-12.h-12');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with loading text when provided', () => {
    render(<LoadingSpinner text="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render in full screen mode when fullScreen is true', () => {
    render(<LoadingSpinner fullScreen />);

    const fullScreenContainer = document.querySelector('.fixed.inset-0');
    expect(fullScreenContainer).toBeInTheDocument();
  });

  it('should not render in full screen mode when fullScreen is false', () => {
    render(<LoadingSpinner fullScreen={false} />);

    const fullScreenContainer = document.querySelector('.fixed.inset-0');
    expect(fullScreenContainer).not.toBeInTheDocument();
  });

  it('should apply pulse animation to text', () => {
    render(<LoadingSpinner text="Loading..." />);

    const textElement = screen.getByText('Loading...');
    expect(textElement).toHaveClass('animate-pulse');
  });
});
