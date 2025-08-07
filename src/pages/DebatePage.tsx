import React, { useState, useEffect, useRef } from 'react';
import * as db from '@/services/db';
import * as geminiService from '@/services/geminiService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PersonaCard } from '@/components/PersonaCard';
import type { AppScreen, Conflict, ChatMessage } from '@/types';

interface DebatePageProps {
  conflictId: number;
  navigateTo: (screen: AppScreen, conflictId?: number) => void;
  addToast: (message: string, type?: 'success' | 'error') => void;
}

type DebateStatus = 'ready' | 'debating' | 'finished' | 'loading' | 'error';
const DEBATE_TURNS = 3; // 3 rounds total, so 3 messages per persona

export const DebatePage: React.FC<DebatePageProps> = ({ conflictId, navigateTo, addToast }) => {
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [status, setStatus] = useState<DebateStatus>('loading');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<ChatMessage | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConflict = async () => {
      try {
        const data = await db.getConflict(conflictId);
        if (data && data.personas) {
          setConflict(data);
          setChatHistory(data.chatHistory || []);
          if ((data.chatHistory?.length || 0) >= data.personas.length * DEBATE_TURNS) {
            setStatus('finished');
          } else {
            setStatus('ready');
          }
        } else {
          throw new Error('Conflict data or personas are missing.');
        }
      } catch (error) {
        console.error('Failed to load conflict:', error);
        addToast('Could not load the debate. Returning home.', 'error');
        navigateTo('home');
        setStatus('error');
      }
    };
    loadConflict();
  }, [conflictId, navigateTo, addToast]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, currentMessage]);

  const startDebate = async () => {
    if (!conflict || !conflict.personas) return;
    setStatus('debating');

    let currentChat = [...chatHistory];

    for (let turn = 0; turn < DEBATE_TURNS; turn++) {
        for (const persona of conflict.personas) {
            const tempMessage: ChatMessage = { personaName: persona.name, message: '...' };
            setCurrentMessage(tempMessage);

            try {
                const stream = await geminiService.streamDebateTurn(currentChat, persona);
                let messageContent = '';
                for await (const chunk of stream) {
                    messageContent += chunk.text;
                    setCurrentMessage({ personaName: persona.name, message: messageContent + '...' });
                }

                const finalMessage: ChatMessage = { personaName: persona.name, message: messageContent };
                currentChat.push(finalMessage);
                setChatHistory([...currentChat]);
                setCurrentMessage(null);
                
                // Save progress after each turn
                const updatedConflict = { ...conflict, chatHistory: currentChat };
                await db.updateConflict(updatedConflict);
                
            } catch (error) {
                console.error(`Error during ${persona.name}'s turn:`, error);
                addToast(`An error occurred. Debate paused.`, 'error');
                setStatus('ready');
                return;
            }
        }
    }

    addToast('Debate concluded. Generating synthesis...', 'success');
    setStatus('loading');
    
    try {
        const synthesisReport = await geminiService.synthesizeConclusion(currentChat, conflict.personas);
        const finalConflict: Conflict = { ...conflict, chatHistory: currentChat, synthesisReport };
        await db.updateConflict(finalConflict);
        addToast('Synthesis complete!', 'success');
        setStatus('finished');
    } catch (error) {
        console.error('Error generating synthesis:', error);
        addToast('Could not generate the final synthesis.', 'error');
        setStatus('finished'); // Still finished, but without report
    }
  };

  if (status === 'loading' && !conflict) return <div className="flex justify-center items-center h-64"><LoadingSpinner message="Loading debate..." /></div>;
  if (status === 'error' || !conflict) return null;

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Debate Arena</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-6">{conflict.topic}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {conflict.personas?.map(p => <PersonaCard key={p.id} persona={p} />)}
      </div>

      <div className="bg-light-surface dark:bg-dark-surface p-4 sm:p-6 rounded-lg shadow-inner min-h-[300px]">
          <h2 className="text-2xl font-bold mb-4 text-center">Live Conversation</h2>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {chatHistory.map((msg, index) => (
                <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'items-start' : 'items-end'}`}>
                    <div className={`p-3 rounded-lg max-w-lg ${index % 2 === 0 ? 'bg-gray-200 dark:bg-gray-700 rounded-bl-none' : 'bg-light-accent/80 dark:bg-dark-accent/80 text-white rounded-br-none'}`}>
                        <p className="font-bold text-sm mb-1">{msg.personaName}</p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                </div>
            ))}
            {currentMessage && (
                <div className="flex items-start">
                    <div className="p-3 rounded-lg max-w-lg bg-gray-200 dark:bg-gray-700 rounded-bl-none animate-pulse">
                         <p className="font-bold text-sm mb-1">{currentMessage.personaName}</p>
                         <p className="whitespace-pre-wrap">{currentMessage.message}</p>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          {status === 'loading' && <div className="flex justify-center py-4"><LoadingSpinner message="Generating synthesis report..." /></div>}

          <div className="flex justify-center mt-8">
            {status === 'ready' && (
              <button onClick={startDebate} className="bg-light-accent dark:bg-dark-accent text-white font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity">
                {chatHistory.length > 0 ? 'Resume Debate' : 'Begin Debate'}
              </button>
            )}
            {status === 'debating' && (
               <div className="text-center">
                    <LoadingSpinner message={`${currentMessage?.personaName} is thinking...`} />
                    <p className="font-bold text-lg text-light-accent dark:text-dark-accent mt-4">Debate in Progress...</p>
               </div>
            )}
            {status === 'finished' && (
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold">Debate Concluded</h3>
                {conflict.synthesisReport ? (
                    <button onClick={() => navigateTo('conclusion', conflict.id)} className="bg-light-accent dark:bg-dark-accent text-white font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity">
                        View Conclusion & Synthesis
                    </button>
                ): (
                    <p className="text-red-500">The synthesis report could not be generated.</p>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};