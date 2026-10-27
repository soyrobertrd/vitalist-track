import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary atrapó un error no controlado:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 text-foreground">
          <div className="max-w-md w-full border border-border bg-card rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">Ocurrió un error inesperado</h2>
              <p className="text-xs text-muted-foreground">
                La aplicación encontró una excepción inesperada durante la carga. Tus datos guardados están seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-muted/50 p-3 rounded-lg text-[11px] font-mono text-muted-foreground overflow-auto max-h-32 border">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center">
              <Button
                variant="default"
                size="sm"
                onClick={this.handleReload}
                className="gap-1.5 shadow-none"
              >
                <RefreshCw className="h-4 w-4" /> Recargar página
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                className="gap-1.5 shadow-none"
              >
                <Home className="h-4 w-4" /> Ir al inicio
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
