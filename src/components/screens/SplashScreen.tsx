
import React, { useState, useEffect } from 'react';
import { getWelcomeMessage } from '../../services/geminiService';
import { Spinner } from '../icons/Icons';

interface SplashScreenProps {
  onComplete: () => void;
  onError: (message: string) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onError }) => {
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fetchMessage = async () => {
      try {
        const msg = await getWelcomeMessage();
        setWelcomeMessage(msg);
      } catch (e) {
        console.error(e);
        if (e instanceof Error) {
            onError(e.message);
        } else {
            onError("An unknown error occurred while contacting AI services.");
        }
        setWelcomeMessage("Welcome");
      }
    };
    fetchMessage();
  }, [onError]);

  useEffect(() => {
    if (welcomeMessage) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 1000); // Wait for fade out animation
      }, 3000); // Display splash for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [welcomeMessage, onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-light-primary dark:bg-dark-primary transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="flex items-center gap-4 mb-4">
        <svg width="64" height="64" viewBox="0 0 100 100" className="fill-light-text dark:fill-dark-text animate-fade-in"><path d="M50,10A40,40,0,0,0,14.6,25.4L30,40.8A20,20,0,1,1,30,60l-15.4,15.4A40,40,0,1,0,50,10Z"/></svg>
        <h1 className="text-5xl font-bold animate-fade-in" style={{animationDelay: '0.2s'}}>Convolution</h1>
      </div>
      <div className="h-12 mt-4 text-center">
        {welcomeMessage ? (
          <h2 className="text-3xl font-semibold text-light-text/70 dark:text-dark-text/70 animate-fade-in" style={{animationDelay: '0.5s'}}>
            {welcomeMessage}
          </h2>
        ) : (
          <Spinner className="text-light-accent dark:text-dark-accent h-8 w-8"/>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
