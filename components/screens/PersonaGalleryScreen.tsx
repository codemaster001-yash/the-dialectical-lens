import React from 'react';
import type { Persona } from '../../types';

interface PersonaGalleryScreenProps {
  personas: Persona[];
  onDebateStart: () => void;
}

const PersonaCard: React.FC<{ persona: Persona; index: number }> = ({ persona, index }) => {
    return (
        <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-xl shadow-md flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300 animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
            <h3 className="text-xl font-bold text-light-accent dark:text-dark-accent">{persona.name}</h3>
            <p className="text-md font-semibold text-light-text/80 dark:text-dark-text/80 mb-4">{persona.title}</p>
            <p className="text-sm text-light-text/70 dark:text-dark-text/70 flex-grow">{persona.summary}</p>
        </div>
    );
};

const PersonaGalleryScreen: React.FC<PersonaGalleryScreenProps> = ({ personas, onDebateStart }) => {
  return (
    <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-slide-in">
            <h2 className="text-4xl font-bold">Meet the Participants</h2>
            <p className="mt-4 text-lg text-light-text/70 dark:text-dark-text/70">Review the AI-generated personas. When you're ready, start the conversation.</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${personas.length} gap-8 mb-12`}>
            {personas.map((p, i) => <PersonaCard key={p.name} persona={p} index={i} />)}
        </div>

        <div className="text-center animate-slide-in" style={{animationDelay: `${personas.length * 100}ms`}}>
            <button
              onClick={onDebateStart}
              className="px-10 py-4 bg-success text-white font-bold text-lg rounded-lg shadow-lg hover:bg-success-hover transition-all duration-300 transform hover:scale-105"
            >
              Start Conversation
            </button>
        </div>
    </div>
  );
};

export default PersonaGalleryScreen;