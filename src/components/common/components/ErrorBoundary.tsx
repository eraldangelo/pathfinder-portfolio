import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/20">
            <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-red-200 dark:border-red-700">
                <h1 className="text-2xl font-bold text-red-700 dark:text-red-400">Something went wrong.</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">An unexpected error occurred. Please try refreshing the page. If the problem persists, please contact support.</p>
                <details className="mt-4 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-400">Error Details</summary>
                    <pre className="mt-2 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap overflow-auto">
                        {this.state.error?.toString()}
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </details>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
