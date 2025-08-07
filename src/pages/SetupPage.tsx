import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import * as geminiService from '@/services/geminiService';
import * as db from '@/services/db';
import type { AppScreen, PersonaDetails, Conflict } from '@/types';

interface SetupPageProps {
  navigateTo: (screen: AppScreen, conflictId?: number) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

type SetupStep = 'topic' | 'personas' | 'loading';

interface GeneratedQuestionSet {
    personaName: string;
    questions: string[];
}

export const SetupPage: React.FC<SetupPageProps> = ({ navigateTo, addToast }) => {
  const [step, setStep] = useState<SetupStep>('topic');
  const [topic, setTopic] = useState('');
  const [participantCount, setParticipantCount] = useState(2);
  const [personaDetails, setPersonaDetails] = useState<PersonaDetails[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 10) {
      addToast('Please provide a more detailed topic for the conflict.', 'error');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Generating tailored questions for each perspective...');
    try {
      const questions = await geminiService.generateQuestionsForPersonaSetup(topic, participantCount);
      setGeneratedQuestions(questions);
      setPersonaDetails(questions.map(() => ({ name: '', role: '', goal: '', grievance: '' })));
      setStep('personas');
    } catch (error) {
      console.error('Failed to generate questions:', error);
      addToast('Could not generate questions. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailChange = (index: number, field: keyof PersonaDetails, value: string) => {
    const newDetails = [...personaDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setPersonaDetails(newDetails);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     if (personaDetails.some(p => !p.name || !p.role || !p.goal || !p.grievance)) {
      addToast('Please fill out all fields for each participant.', 'error');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Creating empathetic AI personas...');
    setStep('loading');

    try {
        const newConflict: Omit<Conflict, "id"> = {
            topic,
            createdAt: new Date(),
            participantCount,
            personaDetails,
        };

        const conflictId = await db.addConflict(newConflict);
        addToast('Conflict saved. Now creating personas...', 'success');
        
        const personas = await geminiService.createInitialPersonas(topic, personaDetails);
        
        const fullConflict: Conflict = { ...newConflict, id: conflictId, personas, chatHistory: [] };
        await db.updateConflict(fullConflict);
        
        addToast('Personas created successfully!', 'success');
        navigateTo('debate', conflictId);

    } catch (error) {
        console.error('Failed to create conflict or personas:', error);
        addToast('A failure occurred during setup. Please try again.', 'error');
        setStep('personas'); // Go back to the form
    } finally {
        setIsLoading(false);
    }
  };
  
  const renderTopicStep = () => (
    <div className="animate-fade-in w-full max-w-2xl">
      <h2 className="text-3xl font-bold mb-2 text-center">Define the Conflict</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">What is the core issue you want to explore?</p>
      <form onSubmit={handleTopicSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Conflict Topic
          </label>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., A city council debates whether to fund a new public park or a tech incubator."
            className="w-full p-3 rounded-md bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
            rows={4}
            required
          />
        </div>
        <div>
          <label htmlFor="participants" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            Number of Perspectives
          </label>
          <select
            id="participants"
            value={participantCount}
            onChange={(e) => setParticipantCount(Number(e.target.value))}
            className="w-full p-3 rounded-md bg-light-surface dark:bg-dark-surface border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
          >
            <option value={2}>2</option>
            <option value={3}>3 (Recommended)</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="bg-light-accent dark:bg-dark-accent text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity">
            Next: Define Perspectives
          </button>
        </div>
      </form>
    </div>
  );
  
  const renderPersonaStep = () => (
     <div className="animate-fade-in w-full">
      <h2 className="text-3xl font-bold mb-2 text-center">Detail the Perspectives</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Flesh out each viewpoint. Your answers will shape the AI personas.</p>
      <form onSubmit={handleFinalSubmit} className="space-y-12">
        {generatedQuestions.map((qSet, index) => (
          <div key={index} className="p-6 rounded-lg bg-light-surface dark:bg-dark-surface border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-light-accent dark:text-dark-accent">{qSet.personaName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{qSet.questions[0]}</label>
                <input
                  type="text"
                  placeholder="Give this persona a name"
                  value={personaDetails[index].name}
                  onChange={(e) => handleDetailChange(index, 'name', e.target.value)}
                  className="w-full p-2 rounded-md bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
               <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{qSet.questions[1]}</label>
                <textarea
                  placeholder="Describe their primary role or stance."
                  value={personaDetails[index].role}
                  onChange={(e) => handleDetailChange(index, 'role', e.target.value)}
                  className="w-full p-2 rounded-md bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{qSet.questions[2]}</label>
                 <textarea
                  placeholder="What is their main goal or desired outcome?"
                  value={personaDetails[index].goal}
                  onChange={(e) => handleDetailChange(index, 'goal', e.target.value)}
                  className="w-full p-2 rounded-md bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600"
                  rows={2}
                  required
                />
              </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">What is their key frustration or grievance in this conflict?</label>
                 <textarea
                  placeholder="What is their primary complaint or issue?"
                  value={personaDetails[index].grievance}
                  onChange={(e) => handleDetailChange(index, 'grievance', e.target.value)}
                  className="w-full p-2 rounded-md bg-light-bg dark:bg-dark-bg border border-gray-300 dark:border-gray-600"
                  rows={2}
                  required
                />
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center mt-8">
            <button type="button" onClick={() => setStep('topic')} className="text-gray-600 dark:text-gray-400 hover:underline">
                Back to Topic
            </button>
            <button type="submit" className="bg-light-accent dark:bg-dark-accent text-white font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity text-lg">
                Create Personas & Begin Debate
            </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {isLoading ? (
        <LoadingSpinner message={loadingMessage} />
      ) : (
        <>
          {step === 'topic' && renderTopicStep()}
          {step === 'personas' && renderPersonaStep()}
          {step === 'loading' && <LoadingSpinner message={loadingMessage} />}
        </>
      )}
    </div>
  );
};