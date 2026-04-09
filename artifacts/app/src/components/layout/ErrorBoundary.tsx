import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * App-wide React error boundary. Catches render-time crashes in any
 * page so the user sees a friendly fallback with a reload button
 * instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to the console so the browser devtools pick it up even when
    // we're rendering the fallback. In prod you'd hook this into
    // Sentry / Bugsnag / similar.
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] render crash", error, info.componentStack);
  }

  private reload = () => {
    this.setState({ hasError: false, error: null });
    // Full reload clears any stale react-query state that might be
    // contributing to the crash.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-screen bg-background flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive text-2xl font-medium">
              !
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-medium text-foreground tracking-tight">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                The page crashed while rendering. Try reloading, and if the problem
                keeps happening let a director know.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <button
              onClick={this.reload}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
