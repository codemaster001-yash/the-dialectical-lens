import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { DebateSession } from '../../types';
import useSpeech from '../../hooks/useSpeech';
import { PlayIcon, PauseIcon, AudioOnIcon, AudioOffIcon } from '../icons/Icons';

interface ReplayScreenProps {
  session: DebateSession;
  onBack: () => void;
}

const ReplayScreen: React.FC<ReplayScreenProps> = ({ session, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioOn, setIsAudioOn] = useState(false);
    
    const { speak, cancel, isSpeaking } = useSpeech();
    const intervalRef = useRef<number | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const personaIndices = new Map(session.personas.map((p, i) => [p.name, i]));
    const displayedChatLog = session.chatLog.slice(0, currentIndex + 1);

    const stopPlayback = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsPlaying(false);
        cancel();
    }, [cancel]);

    const startPlayback = useCallback(() => {
        setIsPlaying(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        const tick = () => {
             setCurrentIndex(prev => {
                const nextIndex = prev + 1;
                if (nextIndex >= session.chatLog.length) {
                    stopPlayback();
                    return prev;
                }
                return nextIndex;
            });
        };
        
        tick(); // First message immediately
        intervalRef.current = window.setInterval(tick, 2500);
    }, [session.chatLog.length, stopPlayback]);
    
    useEffect(() => {
        if (isPlaying && isAudioOn && currentIndex >= 0 && currentIndex < session.chatLog.length) {
            const currentMessage = session.chatLog[currentIndex];
            const pIndex = personaIndices.get(currentMessage.personaName) ?? 0;
            speak(currentMessage.message, pIndex);
        }
    }, [currentIndex, isPlaying, isAudioOn, session.chatLog, speak, personaIndices]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayedChatLog.length]);

    const handlePlayPause = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            if (currentIndex >= session.chatLog.length - 1) {
                setCurrentIndex(-1);
                 setTimeout(startPlayback, 100);
            } else {
                startPlayback();
            }
        }
    };
    
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        stopPlayback();
        setCurrentIndex(parseInt(e.target.value, 10));
    };

    const toggleAudio = () => {
        if (isAudioOn && isSpeaking) cancel();
        setIsAudioOn(!isAudioOn);
    };

    return (
        <div className="max-w-4xl mx-auto h-[75vh] flex flex-col bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-2xl animate-slide-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&larr; Back to History</button>
                <h2 className="text-lg font-bold truncate px-4" title={session.topic}>Replay: {session.title}</h2>
            </div>
            
            <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                {displayedChatLog.map((chat, index) => {
                    const personaIndex = personaIndices.get(chat.personaName);
                    const isSelf = (personaIndex ?? 0) % 2 === 0;

                    return (
                        <div key={`${chat.timestamp}-${index}`} className={`flex items-end gap-3 ${isSelf ? 'justify-end' : ''} animate-fade-in`}>
                            {!isSelf && <div className="w-8 h-8 rounded-full bg-light-accent text-white flex items-center justify-center font-bold flex-shrink-0">{chat.personaName.charAt(0)}</div>}
                            <div className={`max-w-md p-3 rounded-lg shadow-sm ${isSelf ? 'bg-light-accent text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 rounded-bl-none'}`}>
                                {!isSelf && <p className="font-bold text-sm mb-1">{chat.personaName}</p>}
                                <p className="text-base">{chat.message}</p>
                            </div>
                            {isSelf && <div className="w-8 h-8 rounded-full bg-indigo-300 text-indigo-800 flex items-center justify-center font-bold flex-shrink-0">{chat.personaName.charAt(0)}</div>}
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center gap-4">
                <button onClick={handlePlayPause} className="p-2 rounded-full bg-light-accent text-white hover:bg-indigo-700 transition-colors">
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <input
                    type="range"
                    min="-1"
                    max={session.chatLog.length - 1}
                    value={currentIndex}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                 <span className="text-sm font-mono w-24 text-center">{currentIndex + 1} / {session.chatLog.length}</span>
                <button onClick={toggleAudio} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                    {isAudioOn ? <AudioOnIcon /> : <AudioOffIcon />}
                </button>
            </div>
        </div>
    );
};

export default ReplayScreen;