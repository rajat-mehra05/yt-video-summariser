'use client';

import { Component, ReactNode } from 'react';
import { ErrorBanner } from '@/components/ErrorBanner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <ErrorBanner message="Something went wrong while rendering the summary. Please try again." />
      );
    }
    return this.props.children;
  }
}
