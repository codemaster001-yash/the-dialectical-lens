
import React, { useState, useEffect } from 'react';
import { generatePersona } from '../../services/geminiService';
import type { Persona, PersonaInput, DebateSession } from '../../types';
import { Spinner, LoadIcon } from '../icons/Icons';
import LoadFromHistoryModal from '../modals/LoadFromHistoryModal';

interface PersonaCreationScreenProps {
  session: {
    topic: string;
    title: string;
    personas: { userInput: PersonaInput }[];
  };
  onPersonasGenerated: (personas: Persona[]) => void;
  onPersonaUpdate: (personas: PersonaInput[]) => void;
  onError: (message: string) => void;
}

const PersonaCreationScreen: React.FC<PersonaCreationScreenProps> = ({ session, onPersonasGenerated, onPersonaUpdate, onError }) => {
  const [participants, setParticipants] = useState<PersonaInput[]>(session.personas.map(p => p.userInput));
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  useEffect(() => {
    // Sync internal state if the session prop changes (e.g., from loading history)
    setParticipants(session.personas.map(p => p.userInput));
  }, [session.personas]);

  const handleInputChange = (index: number, field: keyof Omit<PersonaInput, 'id'>, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setParticipants(newParticipants);
  };
  
  const currentParticipant = participants[activeTab];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError(''); // Clear previous errors
    try {
      // Use the internal, potentially edited state for generation
      const personaPromises = participants.map(p => generatePersona(p, session.topic));
      const generatedPersonas = await Promise.all(personaPromises);
      onPersonasGenerated(generatedPersonas);
    } catch (error) {
      console.error("Failed to generate personas:", error);
      onError("An error occurred while generating personas. Please try again.");
      setIsLoading(false);
    }
  };
  
  const handleLoadSession = (sessionToLoad: DebateSession) => {
    if (!window.confirm('This will overwrite all current participant data. Are you sure?')) {
        return;
    }
    // Update the central state in App.tsx
    onPersonaUpdate(sessionToLoad.personas.map(p => p.userInput));
    setActiveTab(0);
    setIsLoadModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-in">
      {isLoadModalOpen && <LoadFromHistoryModal onLoad={handleLoadSession} onClose={() => setIsLoadModalOpen(false)} />}
      <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
        <div className="flex justify-between items-start mb-2">
            <div className="flex-grow">
                <h2 className="text-3xl font-bold mb-2 text-center md:text-left">Create Participants</h2>
                <p className="text-center md:text-left text-light-text/70 dark:text-dark-text/70 mb-4">
                  Define the background and perspective for each participant. The AI will use this to build a detailed persona.
                </p>
            </div>
            <button onClick={() => setIsLoadModalOpen(true)} className="p-2 ml-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Load from history">
                <LoadIcon />
            </button>
        </div>

        <div className="border-b border-gray-300 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {participants.map((p, index) => (
              <button
                key={p.id}
                onClick={() => setActiveTab(index)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === index
                    ? 'border-light-accent dark:border-dark-accent text-light-accent dark:text-dark-accent'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Participant {index + 1}
              </button>
            ))}
          </nav>
        </div>

        {currentParticipant && <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {Object.keys(currentParticipant).filter(k => k !== 'id' && k !== 'goals' && k !== 'perspective').map((key) => (
                    <div key={key}>
                        <label htmlFor={`${key}-${currentParticipant.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{key}</label>
                        <input
                            type="text"
                            id={`${key}-${currentParticipant.id}`}
                            value={currentParticipant[key as keyof PersonaInput] as string}
                            onChange={e => handleInputChange(activeTab, key as keyof Omit<PersonaInput, 'id'>, e.target.value)}
                            className="mt-1 block w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-light-accent focus:border-light-accent sm:text-sm"
                        />
                    </div>
                ))}
            </div>
            <div>
                <label htmlFor={`goals-${currentParticipant.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goals/Desires</label>
                <textarea id={`goals-${currentParticipant.id}`} value={currentParticipant.goals} onChange={e => handleInputChange(activeTab, 'goals', e.target.value)} rows={3} className="mt-1 block w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-light-accent focus:border-light-accent sm:text-sm"></textarea>
            </div>
             <div>
                <label htmlFor={`perspective-${currentParticipant.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">Perspective on the Conflict</label>
                <textarea id={`perspective-${currentParticipant.id}`} value={currentParticipant.perspective} onChange={e => handleInputChange(activeTab, 'perspective', e.target.value)} rows={3} className="mt-1 block w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-light-accent focus:border-light-accent sm:text-sm"></textarea>
            </div>

            <div className="text-center pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-light-accent text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all duration-300 disabled:opacity-50 flex items-center justify-center mx-auto"
                >
                    {isLoading && <Spinner className="text-white" />}
                    {isLoading ? 'Generating...' : 'Generate & Review Personas'}
                </button>
            </div>
        </form>}
      </div>
    </div>
  );
};

export default PersonaCreationScreen;
