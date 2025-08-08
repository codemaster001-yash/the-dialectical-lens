
import React, { useState } from 'react';
import type { PersonaInput, DebateSession } from '../../types';
import { LoadIcon, Spinner } from '../icons/Icons';
import LoadFromHistoryModal from '../modals/LoadFromHistoryModal';

interface SetupScreenProps {
  onSetupComplete: (topic: string, participants: PersonaInput[]) => void;
  isProcessing: boolean;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete, isProcessing }) => {
  const [topic, setTopic] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const participantOptions = [2, 3, 4];

  const canProceed = topic.trim().length > 10 && participantCount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed) return;
    const participants = Array.from({ length: participantCount }, (_, i) => ({
      id: i + 1,
      name: '', age: '', gender: '', profession: '', country: '', goals: '', perspective: ''
    }));
    onSetupComplete(topic, participants);
  };

  const handleLoadSession = (session: DebateSession) => {
      if (topic.trim() !== '' && !window.confirm('This will overwrite the current topic and participant count. Are you sure?')) {
          return;
      }
      setTopic(session.topic);
      setParticipantCount(session.personas.length);
      setIsLoadModalOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-in">
      {isLoadModalOpen && <LoadFromHistoryModal onLoad={handleLoadSession} onClose={() => setIsLoadModalOpen(false)} />}
      <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
        <div className="flex justify-between items-start mb-8">
            <div className='flex-grow'>
                <h2 className="text-3xl font-bold mb-2 text-center md:text-left">Start a New Convolution</h2>
                <p className="text-center md:text-left text-light-text/70 dark:text-dark-text/70">
                Define the central conflict or question you want the AI personas to explore.
                </p>
            </div>
            <button onClick={() => setIsLoadModalOpen(true)} className="p-2 ml-4 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Load from history">
                <LoadIcon />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium mb-2">
              Conflict or Question
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'Should automation in the workplace be embraced or regulated?' or 'Exploring the ethical implications of gene editing...'"
              className="w-full h-32 p-3 bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Participants
            </label>
            <div className="flex items-center justify-center space-x-2 bg-light-primary dark:bg-dark-primary p-1 rounded-lg">
              {participantOptions.map(count => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setParticipantCount(count)}
                  className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${
                    participantCount === count
                      ? 'bg-light-accent text-white shadow'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={!canProceed || isProcessing}
              className="px-8 py-3 bg-light-accent text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center min-w-[200px]"
            >
              {isProcessing ? <Spinner className="text-white"/> : 'Create Personas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
