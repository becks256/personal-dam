// renderer/src/App.tsx
import React, { useEffect, Component, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Browse from './pages/Browse';
import Settings from './pages/Settings';
import { useUiStore } from './store/uiStore';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex items-center justify-center h-screen text-red-400 text-sm p-8">
          <div>
            <div className="font-semibold mb-2">Something went wrong</div>
            <div className="text-zinc-500 text-xs">{(this.state.error as Error).message}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const activePage = useUiStore(s => s.activePage);
  const setCrawlerProgress = useUiStore(s => s.setCrawlerProgress);

  useEffect(() => {
    const unsub = window.dam.onCrawlerProgress(setCrawlerProgress);
    return unsub;
  }, [setCrawlerProgress]);

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {activePage === 'browse' ? <Browse /> : <Settings />}
        </main>
      </div>
    </ErrorBoundary>
  );
}
