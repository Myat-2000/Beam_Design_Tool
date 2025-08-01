# ErrorBoundary Component

## Overview

The `ErrorBoundary` component is a React class component that catches JavaScript errors anywhere in its child component tree, logs those errors, and displays a fallback UI instead of crashing the whole application.

## Features

- Catches and logs errors in the component tree
- Displays a user-friendly error message
- Provides options to recover from errors (try again, refresh page, go back)
- Supports custom fallback UI
- Includes error reporting functionality for production environments
- Allows programmatic error state reset

## Usage

### Basic Usage

```tsx
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback UI

```tsx
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallback={<div>Custom error UI</div>}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### With Reset Handler

```tsx
import ErrorBoundary from './ErrorBoundary';

function App() {
  const handleReset = () => {
    // Perform any cleanup or state reset needed
    console.log('Error boundary was reset');
  };

  return (
    <ErrorBoundary onReset={handleReset}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | ReactNode | The components that the error boundary should wrap |
| `fallback` | ReactNode | Optional custom UI to display when an error occurs |
| `onReset` | () => void | Optional callback function that is called when the error boundary is reset |

## Error Reporting

In production environments, errors can be reported to monitoring services. To implement this functionality, modify the `reportError` method in the `ErrorBoundary` component to integrate with your preferred error monitoring service (e.g., Sentry, LogRocket, New Relic, Application Insights).

## Best Practices

- Place error boundaries strategically to isolate parts of the application that might fail
- Use multiple error boundaries for different parts of the UI to prevent the entire application from crashing
- Provide meaningful error messages and recovery options
- Always log errors to help with debugging
- Consider implementing error tracking in production environments