import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] uncaught render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center bg-background text-foreground">
        <p className="text-lg font-semibold">页面出了点问题</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          不用担心，数据还在。重新加载即可继续。
        </p>
        <Button type="button" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }
}
