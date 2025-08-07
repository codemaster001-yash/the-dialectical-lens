import React from 'react';
import { Logo } from '@/components/Logo';
import type { AppScreen } from '@/types';

interface HomePageProps {
    navigateTo: (screen: AppScreen) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigateTo }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center animate-fade-in">
            <Logo className="h-24 w-24 text-light-accent dark:text-dark-accent mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome to The Dialectical Lens</h1>
            <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300 mb-8">
                Resolve conflicts and explore complex topics through simulated, empathetic AI-driven debates. Uncover new perspectives and find common ground by letting AI personas navigate the conversation.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                    onClick={() => navigateTo('setup')}
                    className="bg-light-accent dark:bg-dark-accent text-white font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
                >
                    Start New Debate
                </button>
                <button
                    onClick={() => navigateTo('history')}
                    className="bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg"
                >
                    View History
                </button>
            </div>
             <div className="mt-16 p-6 rounded-lg bg-light-surface dark:bg-dark-surface border border-gray-200 dark:border-gray-700 w-full max-w-3xl">
                <h2 className="text-2xl font-bold mb-4 text-light-accent dark:text-dark-accent">How It Works</h2>
                <ol className="text-left space-y-4 text-gray-700 dark:text-gray-300">
                    <li className="flex items-start">
                        <div className="bg-light-accent dark:bg-dark-accent text-white rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold mr-4">1</div>
                        <div><span className="font-bold">Define Your Conflict:</span> Clearly state the topic you want to explore.</div>
                    </li>
                    <li className="flex items-start">
                        <div className="bg-light-accent dark:bg-dark-accent text-white rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold mr-4">2</div>
                        <div><span className="font-bold">Detail the Perspectives:</span> Answer AI-generated questions to build nuanced personas for the debate.</div>
                    </li>
                     <li className="flex items-start">
                        <div className="bg-light-accent dark:bg-dark-accent text-white rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold mr-4">3</div>
                        <div><span className="font-bold">Witness the Debate:</span> Watch as the AI personas engage in a structured, real-time conversation.</div>
                    </li>
                    <li className="flex items-start">
                        <div className="bg-light-accent dark:bg-dark-accent text-white rounded-full w-8 h-8 flex-shrink-0 flex items-center justify-center font-bold mr-4">4</div>
                        <div><span className="font-bold">Receive Your Synthesis:</span> Get a detailed report summarizing viewpoints, agreements, and next steps.</div>
                    </li>
                </ol>
            </div>
        </div>
    );
};