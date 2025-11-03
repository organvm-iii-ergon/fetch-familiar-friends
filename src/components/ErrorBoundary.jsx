import { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorLog = {
      message: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to localStorage for debugging
    this.logErrorToStorage(errorLog);

    // Update state
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
      lastErrorTime: Date.now()
    }));

    // Could integrate with error tracking service here
    // Example: Sentry.captureException(error);
  }

  logErrorToStorage(errorLog) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('dogtale-error-logs') || '[]');
      const logs = [...existingLogs, errorLog].slice(-10); // Keep last 10 errors
      localStorage.setItem('dogtale-error-logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log error to storage:', e);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearErrors = () => {
    try {
      localStorage.removeItem('dogtale-error-logs');
      alert('Error logs cleared successfully');
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  };

  getErrorMessage() {
    const { error } = this.state;
    if (!error) return 'An unexpected error occurred';

    const errorString = error.toString().toLowerCase();

    // Categorize errors for user-friendly messages
    if (errorString.includes('network') || errorString.includes('fetch')) {
      return 'Network connection error. Please check your internet connection.';
    } else if (errorString.includes('quota') || errorString.includes('storage')) {
      return 'Storage quota exceeded. Try clearing your browser cache or deleting old data.';
    } else if (errorString.includes('permission')) {
      return 'Permission denied. Please check your browser settings.';
    } else if (errorString.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    return 'We encountered an unexpected error.';
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.getErrorMessage();
      const { errorCount } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <span className="text-6xl">{errorCount > 3 ? '😵' : '😔'}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
              {errorCount > 3 ? 'Multiple Errors Detected' : 'Oops! Something went wrong'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
              {errorMessage}
            </p>

            {errorCount > 3 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> {errorCount} errors have occurred. Consider clearing your data or contacting support.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Try to Recover
              </button>
              <button
                onClick={this.handleReload}
                className="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <>
                <button
                  onClick={this.handleClearErrors}
                  className="w-full mt-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Clear Error Logs
                </button>
                <details className="mt-4 text-xs text-gray-600 dark:text-gray-400">
                  <summary className="cursor-pointer font-semibold">Error Details (Dev Mode)</summary>
                  <div className="mt-2 space-y-2">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded">
                      <p className="font-semibold mb-1">Error Message:</p>
                      <pre className="overflow-auto">{this.state.error.toString()}</pre>
                    </div>
                    {this.state.error.stack && (
                      <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded">
                        <p className="font-semibold mb-1">Stack Trace:</p>
                        <pre className="overflow-auto max-h-40">{this.state.error.stack}</pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded">
                        <p className="font-semibold mb-1">Component Stack:</p>
                        <pre className="overflow-auto max-h-40">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded">
                      <p className="font-semibold mb-1">Error Count: {errorCount}</p>
                      <p className="font-semibold">Last Error: {this.state.lastErrorTime ? new Date(this.state.lastErrorTime).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                </details>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;
