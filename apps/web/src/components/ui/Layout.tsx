import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'default' | 'narrow' | 'wide';
  className?: string;
}

export function PageContainer({
  children,
  size = 'default',
  className = '',
  ...props
}: PageContainerProps) {
  const sizeClasses = {
    narrow: 'max-w-3xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
  };

  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ContentColumnProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function ContentColumn({
  children,
  size = 'md',
  className = '',
  ...props
}: ContentColumnProps) {
  const sizeClasses = {
    sm: 'max-w-xl',
    md: 'max-w-2xl',
  };

  return (
    <div className={`mx-auto w-full ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface SplitLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  left: React.ReactNode;
  right: React.ReactNode;
  ratio?: '7-5' | '8-4' | '6-6';
  className?: string;
}

export function SplitLayout({
  left,
  right,
  ratio = '7-5',
  className = '',
  ...props
}: SplitLayoutProps) {
  const ratioClasses = {
    '7-5': {
      left: 'lg:col-span-7',
      right: 'lg:col-span-5',
    },
    '8-4': {
      left: 'lg:col-span-8',
      right: 'lg:col-span-4',
    },
    '6-6': {
      left: 'lg:col-span-6',
      right: 'lg:col-span-6',
    },
  };

  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start ${className}`}
      {...props}
    >
      <div className={ratioClasses[ratio].left}>{left}</div>
      <div className={ratioClasses[ratio].right}>{right}</div>
    </div>
  );
}
