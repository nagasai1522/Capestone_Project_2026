import React from 'react';

// Error handler utility
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Global error handler
export const handleError = (error, context = '') => {
  console.error(`[${context}] Error:`, error);
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp
    };
  }
  
  // Handle network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection.',
      statusCode: 0,
      details: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      message: 'Validation error',
      statusCode: 400,
      details: error.message,
      timestamp: new Date().toISOString()
    };
  }
  
  // Default error response
  return {
    message: error.message || 'An unexpected error occurred',
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? error.stack : null,
    timestamp: new Date().toISOString()
  };
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error boundary for React components
export const withErrorBoundary = (Component, fallback = null) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return fallback || <div>Something went wrong.</div>;
      }

      return <Component {...this.props} />;
    }
  };
};
