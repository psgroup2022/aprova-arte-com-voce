import React from 'react';
import { captureException } from '@/lib/monitoring/sentry';
import { Button } from '@/components/ui/button';

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error } as ErrorBoundaryState;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Captura erro no Sentry com contexto adicional
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
    });

    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-lg text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-foreground">Algo deu errado</h1>
              <p className="text-muted-foreground">
                Encontramos um erro inesperado. Tente recarregar a página ou voltar para a página
                inicial.
              </p>
            </div>

            {/* Mostrar detalhes do erro em desenvolvimento */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-left">
                <p className="font-mono text-sm text-destructive">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReload} variant="default">
                Recarregar página
              </Button>
              <Button onClick={this.handleGoHome} variant="outline">
                Voltar ao início
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
