import React, { useState, useEffect, useCallback } from 'react';
import type { DebateSession, Persona, PersonaInput, Screen as ScreenEnum } from './types';
import { Screen } from './types';

import { isApiKeyConfigured, generateDebateTitle } from './services/geminiService';
import ApiKeyInstructionsScreen from './components/screens/ApiKeyInstructionsScreen';
import SplashScreen from './components/screens/SplashScreen';
import SetupScreen from './components/screens/SetupScreen';
import PersonaCreationScreen from './components/screens/PersonaCreationScreen';
import PersonaGalleryScreen from './components/screens/PersonaGalleryScreen';
import DebateScreen from './components/screens/DebateScreen';
import HistoryScreen from './components/screens/HistoryScreen';
import ReplayScreen from './components/screens/ReplayScreen';
import { SunIcon, MoonIcon, HistoryIcon, HomeIcon, FullscreenEnterIcon, FullscreenExitIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [screen, setScreen] = useState<ScreenEnum>(Screen.Splash);
  const [currentSession, setCurrentSession] = useState<Partial<DebateSession>>({});
  const [sessionToReplay, setSessionToReplay] = useState<DebateSession | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsKeyValid(isApiKeyConfigured());
    
    const isDark =
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newIsDark = !prev;
      if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newIsDark;
    });
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false));
      }
    }
  };

  const handleSetupComplete = async (topic: string, participants: PersonaInput[]) => {
    setIsProcessing(true);
    setError(null);
    try {
      const title = await generateDebateTitle(topic);
      setCurrentSession({ topic, title, personas: participants.map(p => ({ userInput: p } as Persona)) });
      setScreen(Screen.PersonaCreation);
    } catch (e) {
      console.error(e);
      setError("Failed to generate a title. Check your connection or API key.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePersonaUpdate = (participantInputs: PersonaInput[]) => {
    setCurrentSession(prev => ({ ...prev, personas: participantInputs.map(p => ({ userInput: p } as Persona)) }));
  };

  const handlePersonasGenerated = (personas: Persona[]) => {
    setCurrentSession(prev => ({ ...prev, personas }));
    setScreen(Screen.PersonaGallery);
  };

  const handleDebateStart = () => {
    setScreen(Screen.Debate);
  };
  
  const handleDebateComplete = (session: DebateSession) => {
    setCurrentSession(session);
    setScreen(Screen.History); 
  };
  
  const handleViewHistory = () => {
    setScreen(Screen.History);
  };

  const handleReplaySession = (session: DebateSession) => {
    setSessionToReplay(session);
    setScreen(Screen.Replay);
  };

  const resetToHome = () => {
    setCurrentSession({});
    setScreen(Screen.Setup);
  };

  const renderScreen = () => {
    switch (screen) {
      case Screen.Splash:
        return <SplashScreen onComplete={resetToHome} onError={setError} />;
      case Screen.Setup:
        return <SetupScreen onSetupComplete={handleSetupComplete} isProcessing={isProcessing} />;
      case Screen.PersonaCreation:
        return <PersonaCreationScreen 
                 session={currentSession as {topic: string, title: string, personas: {userInput: PersonaInput}[]}} 
                 onPersonasGenerated={handlePersonasGenerated} 
                 onPersonaUpdate={handlePersonaUpdate}
                 onError={setError} />;
      case Screen.PersonaGallery:
        return <PersonaGalleryScreen personas={currentSession.personas as Persona[]} onDebateStart={handleDebateStart} />;
      case Screen.Debate:
        return <DebateScreen session={currentSession as {topic: string, title: string, personas: Persona[]}} onDebateComplete={handleDebateComplete} onError={setError} />;
      case Screen.History:
        return <HistoryScreen onReplay={handleReplaySession} />;
      case Screen.Replay:
        if (!sessionToReplay) {
            resetToHome();
            return null;
        }
        return <ReplayScreen session={sessionToReplay} onBack={handleViewHistory} />;
      default:
        return <div>Unknown Screen</div>;
    }
  };

  if (!isKeyValid) {
    return <ApiKeyInstructionsScreen />;
  }

  return (
    <div className="min-h-screen w-full transition-colors duration-300">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-light-primary/80 dark:bg-dark-primary/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={resetToHome}>
            <svg width="32" height="32" viewBox="0 0 100 100" className="fill-light-text dark:fill-dark-text"><path d="M50,10A40,40,0,0,0,14.6,25.4L30,40.8A20,20,0,1,1,30,60l-15.4,15.4A40,40,0,1,0,50,10Z"/></svg>
            <h1 className="text-xl font-bold">Convolution</h1>
        </div>
        <nav className="flex items-center gap-4">
            {screen > Screen.Splash && <button onClick={resetToHome} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><HomeIcon /></button>}
            <button onClick={handleViewHistory} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><HistoryIcon /></button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
            <button onClick={toggleFullScreen} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                {isFullScreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
            </button>
        </nav>
      </header>
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        {error && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white py-2 px-4 rounded-md shadow-lg animate-fade-in" onClick={() => setError(null)}>{error}</div>}
        {renderScreen()}
      </main>
    </div>
  );
};

export default App;