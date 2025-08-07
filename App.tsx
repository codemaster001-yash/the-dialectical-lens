import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { SetupPage } from '@/pages/SetupPage';
import { DebatePage } from '@/pages/DebatePage';
import { ConclusionPage } from '@/pages/ConclusionPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ToastContainer, Toast } from '@/components/Toast';
import { FloatingGameButton } from '@/components/FloatingGameButton';
import { GamePanel } from '@/components/GamePanel';
import type { AppScreen } from '@/types';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  });

  const [screen, setScreen] = useState<AppScreen>('home');
  const [activeConflictId, setActiveConflictId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'error' | 'success' }[]>([]);
  const [isGamePanelOpen, setGamePanelOpen] = useState(false);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };
  
  const addToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const navigateTo = (newScreen: AppScreen, conflictId?: number) => {
    if (conflictId) {
      setActiveConflictId(conflictId);
    } else {
      setActiveConflictId(null);
    }
    setScreen(newScreen);
    window.scrollTo(0, 0);
  };
  
  const handleViewConclusion = (conflictId: number) => {
    setActiveConflictId(conflictId);
    setScreen('conclusion');
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <HomePage navigateTo={navigateTo} />;
      case 'setup':
        return <SetupPage navigateTo={navigateTo} addToast={addToast} />;
      case 'debate':
        if (!activeConflictId) {
          addToast("Error: No active conflict selected.");
          navigateTo('home');
          return null;
        }
        return <DebatePage navigateTo={navigateTo} conflictId={activeConflictId} addToast={addToast} />;
      case 'conclusion':
         if (!activeConflictId) {
          addToast("Error: No active conflict selected.");
          navigateTo('home');
          return null;
        }
        return <ConclusionPage navigateTo={navigateTo} conflictId={activeConflictId} />;
      case 'history':
        return <HistoryPage navigateTo={navigateTo} onViewConclusion={handleViewConclusion} />;
      default:
        return <HomePage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text min-h-screen font-sans">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderScreen()}
      </main>
      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(current => current.filter(t => t.id !== toast.id))} />
        ))}
      </ToastContainer>
      <FloatingGameButton onClick={() => setGamePanelOpen(true)} />
      <GamePanel isOpen={isGamePanelOpen} onClose={() => setGamePanelOpen(false)} />
    </div>
  );
};

export default App;