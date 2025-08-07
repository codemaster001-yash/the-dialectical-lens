import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
    "Analyzing the core conflict...",
    "Crafting unique AI perspectives...",
    "Setting the stage for a productive conversation...",
    "Finding common ground and potential friction points...",
    "Building empathetic personas...",
    "One moment, the AI is pondering...",
];

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (!message) { // Only cycle if no specific message is provided
            interval = setInterval(() => {
                setMessageIndex(prevIndex => (prevIndex + 1) % LOADING_MESSAGES.length);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [message]);

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <svg className="animate-spin h-12 w-12 text-light-accent dark:text-dark-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-gray-500 dark:text-gray-400 transition-opacity duration-500 text-center max-w-sm">
                {message || LOADING_MESSAGES[messageIndex]}
            </p>
        </div>
    );
};