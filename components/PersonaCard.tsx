import React from 'react';
import type { Persona } from '../types';

interface PersonaCardProps {
    persona: Persona;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({ persona }) => {
    return (
        <div className="bg-light-bg dark:bg-dark-bg p-6 rounded-lg shadow-md border-l-4 border-light-accent dark:border-dark-accent flex flex-col h-full animate-fade-in">
            <h3 className="text-xl font-bold text-light-accent dark:text-dark-accent">{persona.name}</h3>
            <p className="text-md font-semibold text-gray-600 dark:text-gray-300 mb-2">{persona.title}</p>
            <p className="text-gray-700 dark:text-gray-400 italic mt-4 flex-grow">"{persona.summary}"</p>
        </div>
    );
};