
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
    
    const { speak, cancel } = useSpeech();
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Refs to hold current state for callbacks to avoid stale state
    const isPlayingRef = useRef(isPlaying);
    const isAudioOnRef = useRef(isAudioOn);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
        isAudioOnRef.current = isAudioOn;
    }, [isPlaying, isAudioOn]);

    const personaIndices = new Map(session.personas.map((p, i) => [p.name, i]));
    const displayedChatLog = session.chatLog.slice(0, currentIndex + 1);

    const stopPlayback = useCallback(() => {
        setIsPlaying(false);
        cancel();
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [cancel]);

    const playNextMessage = useCallback(() => {
        if (!isPlayingRef.current) return;

        setCurrentIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            if (nextIndex >= session.chatLog.length) {
                stopPlayback();
                return prevIndex;
            }

            const currentMessage = session.chatLog[nextIndex];
            const pIndex = personaIndices.get(currentMessage.personaName) ?? 0;

            if (isAudioOnRef.current) {
                // Event-driven playback with audio
                speak(currentMessage.message, pIndex, playNextMessage);
            } else {
                // Timer-driven playback without audio
                timeoutRef.current = window.setTimeout(playNextMessage, 2000);
            }
            
            return nextIndex;
        });
    }, [session.chatLog, speak, stopPlayback, personaIndices]);

    const startPlayback = useCallback(() => {
        setIsPlaying(true);
        // Use a timeout to ensure the isPlaying state has propagated before starting the recursive calls
        setTimeout(() => playNextMessage(), 0);
    }, [playNextMessage]);

    useEffect(() => {
        // Cleanup effect for unmount
        return () => stopPlayback();
    }, [stopPlayback]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [displayedChatLog.length]);

    const handlePlayPause = () => {
        if (isPlaying) {
            stopPlayback();
        } else {
            if (currentIndex >= session.chatLog.length - 1) {
                setCurrentIndex(-1); // Reset to start
                setTimeout(startPlayback, 100); // Start after state update
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
        setIsAudioOn(prev => !prev);
        // If it was playing and we turn audio off, cancel current speech
        if (isPlaying && isAudioOn) {
            cancel();
        }
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
