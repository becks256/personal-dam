// renderer/src/App.tsx
import React, { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Browse from './pages/Browse';
import Settings from './pages/Settings';
import { useUiStore } from './store/uiStore';

export default function App() {
  const activePage = useUiStore(s => s.activePage);
  const setCrawlerProgress = useUiStore(s => s.setCrawlerProgress);

  useEffect(() => {
    const unsub = window.dam.onCrawlerProgress(setCrawlerProgress);
    return unsub;
  }, [setCrawlerProgress]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {activePage === 'browse' ? <Browse /> : <Settings />}
      </main>
    </div>
  );
}
