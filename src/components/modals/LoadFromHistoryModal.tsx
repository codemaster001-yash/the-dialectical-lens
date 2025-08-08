
import React, { useState, useEffect } from 'react';
import { getAllSessions } from '../../services/dbService';
import type { DebateSession } from '../../types';
import { Spinner } from '../icons/Icons';

interface LoadFromHistoryModalProps {
  onLoad: (session: DebateSession) => void;
  onClose: () => void;
}

const LoadFromHistoryModal: React.FC<LoadFromHistoryModalProps> = ({ onLoad, onClose }) => {
    const [sessions, setSessions] = useState<DebateSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            const allSessions = await getAllSessions();
            setSessions(allSessions.filter(s => s.title)); // Only show sessions with a title
            setLoading(false);
        };
        fetchSessions();
    }, []);

    const handleSelect = (session: DebateSession) => {
        onLoad(session);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-2xl shadow-xl max-w-lg w-full max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold p-4 text-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">Load from History</h2>
                <div className="p-4 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center p-8"><Spinner className="w-8 h-8 text-light-accent dark:text-dark-accent"/></div>
                    ) : sessions.length > 0 ? (
                        <ul className="space-y-3">
                            {sessions.map(session => (
                                <li key={session.id} onClick={() => handleSelect(session)} className="p-3 bg-light-primary dark:bg-dark-primary rounded-lg cursor-pointer hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 transition-colors">
                                    <p className="font-semibold">{session.title}</p>
                                    <p className="text-xs text-gray-500">{new Date(session.createdAt).toLocaleDateString()}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No past sessions available to load.</p>
                    )}
                </div>
                 <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-700 text-center flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
export default LoadFromHistoryModal;
