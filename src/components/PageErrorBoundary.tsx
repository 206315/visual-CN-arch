import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PageErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  description: string;
};

type PageErrorBoundaryState = {
  hasError: boolean;
};

class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PageErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-imperial-dark px-6 text-white">
          <div className="w-full max-w-xl rounded-2xl border border-imperial-gold/20 bg-imperial-deeper/90 p-8 text-center shadow-[0_0_40px_rgba(0,0,0,0.35)]">
            <h1 className="text-2xl font-bold tracking-wider text-imperial-gold">{this.props.title}</h1>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">{this.props.description}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-imperial-gold px-4 py-2 text-sm font-bold text-imperial-dark transition-all hover:scale-105"
              >
                刷新当前页面
              </button>
              <Link
                to="/"
                className="rounded-lg border border-imperial-gold/30 px-4 py-2 text-sm font-bold text-imperial-gold transition-all hover:bg-imperial-gold/10"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
