import React from 'react';

type ErrorBoundaryState = { hasError: boolean; error?: unknown };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error } as ErrorBoundaryState;
  }

  componentDidCatch(_error: unknown, _info: unknown) {
    // Hook for logging tools (e.g., Sentry)
    // console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg text-center">
            <h1 className="text-2xl font-semibold mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-4">
              Tente atualizar a página. Se o problema persistir, contate o suporte.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
