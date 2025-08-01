'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };
  
  constructor(props: Props) {
    super(props);
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError(error: Error, errorInfo: ErrorInfo) {
    // In a production environment, you would send this to your error tracking service
    // Example with a hypothetical error tracking service:
    // errorTrackingService.captureException(error, { extra: errorInfo });
    
    // For now, we'll just log that we would report this in production
    if (process.env.NODE_ENV === 'production') {
      // This would be replaced with actual error reporting in production
      console.log('Would report this error to monitoring service in production');
      
      // You could implement actual error reporting here using services like:
      // - Sentry
      // - LogRocket
      // - New Relic
      // - Application Insights
    }
  }
  
  handleReset() {
    // Reset the error state
    this.setState({ hasError: false, error: undefined });
    
    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-md max-w-2xl mx-auto my-8" role="alert">
          <div className="flex items-center gap-3">
            <svg 
              className="h-6 w-6 text-red-500" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            <h3 className="text-xl font-semibold text-red-800">
              Something went wrong
            </h3>
          </div>
          
          <div className="mt-4 p-3 bg-white rounded border border-red-100">
            <p className="text-sm font-medium text-gray-700 mb-1">Error details:</p>
            <p className="text-sm text-red-700 font-mono break-words">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>We've logged this error and our team will look into it.</p>
            <p className="mt-1">You can try the following:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Refresh the page</li>
              <li>Clear your browser cache</li>
              <li>Try again later</li>
            </ul>
          </div>
          
          <div className="mt-5 flex gap-3">
            <button 
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Try again
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Refresh page
            </button>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Go back
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;