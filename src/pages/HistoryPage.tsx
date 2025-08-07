import React, { useState, useEffect } from 'react';
import * as db from '@/services/db';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AppScreen, Conflict } from '@/types';

interface HistoryPageProps {
  navigateTo: (screen: AppScreen, conflictId?: number) => void;
  onViewConclusion: (conflictId: number) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ navigateTo, onViewConclusion }) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const data = await db.getAllConflicts();
        setConflicts(data.reverse()); // Show most recent first
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message="Loading history..." /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conflict History</h1>
        <button
            onClick={() => navigateTo('home')}
            className="bg-light-accent dark:bg-dark-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
            Back to Home
        </button>
      </div>

      {conflicts.length === 0 ? (
        <div className="text-center py-16 px-6 bg-light-surface dark:bg-dark-surface rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="mt-2 text-xl font-semibold">No Debates Yet</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">When you complete a debate, it will appear here.</p>
          <button
              onClick={() => navigateTo('setup')}
              className="mt-6 bg-light-accent dark:bg-dark-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
              Start Your First Debate
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {conflicts.map(conflict => (
            <div key={conflict.id} className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <p className="font-bold text-lg">{conflict.topic}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(conflict.createdAt).toLocaleString()} | {conflict.participantCount} Perspectives
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                {conflict.synthesisReport ? (
                  <button
                    onClick={() => onViewConclusion(conflict.id!)}
                    className="bg-light-accent dark:bg-dark-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    View Report
                  </button>
                ) : (
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 py-1 px-3 rounded-full">In Progress</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};