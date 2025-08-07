import React from 'react';
import { TicTacToe } from './TicTacToe';

interface GamePanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const GamePanel: React.FC<GamePanelProps> = ({ isOpen, onClose }) => {
    return (
        <div 
            className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-light-surface dark:bg-dark-surface shadow-2xl transform transition-transform duration-300 ease-in-out z-[60] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">Just for Fun</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-grow p-4 flex items-center justify-center">
                    <TicTacToe />
                </div>
                 <div className="p-4 text-center text-xs text-gray-400">
                    <p>Your main task is still running in the background!</p>
                </div>
            </div>
        </div>
    );
};