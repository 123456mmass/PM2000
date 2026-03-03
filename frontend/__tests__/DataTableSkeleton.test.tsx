/**
 * Tests for DataTableSkeleton component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataTableSkeleton } from '../components/common/DataTableSkeleton';

describe('DataTableSkeleton', () => {
  it('should render table with default rows and columns', () => {
    render(<DataTableSkeleton />);

    const table = document.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('should render header row by default', () => {
    render(<DataTableSkeleton />);

    const thead = document.querySelector('thead');
    expect(thead).toBeInTheDocument();
  });

  it('should not render header when showHeader is false', () => {
    render(<DataTableSkeleton showHeader={false} />);

    const thead = document.querySelector('thead');
    expect(thead).not.toBeInTheDocument();
  });

  it('should render custom number of columns', () => {
    render(<DataTableSkeleton columns={6} />);

    const headerCells = document.querySelectorAll('th');
    expect(headerCells).toHaveLength(6);
  });

  it('should render custom number of rows', () => {
    render(<DataTableSkeleton rows={10} />);

    const bodyRows = document.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(10);
  });

  it('should render skeleton cells in body', () => {
    render(<DataTableSkeleton rows={3} columns={4} />);

    const skeletonCells = document.querySelectorAll(
      'td > div.animate-pulse'
    );
    expect(skeletonCells.length).toBeGreaterThan(0);
  });

  it('should apply pulse animation to header cells', () => {
    render(<DataTableSkeleton />);

    const headerSkeletons = document.querySelectorAll('th > div.animate-pulse');
    expect(headerSkeletons.length).toBeGreaterThan(0);
  });

  it('should apply proper styling classes', () => {
    render(<DataTableSkeleton />);

    const table = document.querySelector('.overflow-hidden.rounded-lg');
    expect(table).toBeInTheDocument();
  });

  it('should render with dark mode support', () => {
    render(<DataTableSkeleton />);

    const tableContainer = document.querySelector('.dark\\:border-gray-700');
    expect(tableContainer).toBeInTheDocument();
  });
});
