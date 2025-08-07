import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as db from '@/services/db';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AppScreen, Conflict } from '@/types';

interface ConclusionPageProps {
  conflictId: number;
  navigateTo: (screen: AppScreen, conflictId?: number) => void;
}

export const ConclusionPage: React.FC<ConclusionPageProps> = ({ conflictId, navigateTo }) => {
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConflict = async () => {
      setIsLoading(true);
      try {
        const data = await db.getConflict(conflictId);
        if (data && data.synthesisReport) {
          setConflict(data);
        } else {
          // Handle case where report is not ready or conflict not found
          navigateTo('history');
        }
      } catch (error) {
        console.error('Failed to load conclusion:', error);
        navigateTo('history');
      } finally {
        setIsLoading(false);
      }
    };
    loadConflict();
  }, [conflictId, navigateTo]);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(reportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: document.documentElement.classList.contains('dark') ? '#121212' : '#F7F7F7',
            useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`dialetical-lens-report-${conflictId}.pdf`);
    } catch(error) {
        console.error("Error exporting to PDF", error)
    } finally {
        setIsExporting(false);
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner message="Loading conclusion..." /></div>;
  }

  if (!conflict) return null;
  
  const { topic, synthesisReport } = conflict;

  return (
    <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold">Synthesis Report</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">{topic}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
                 <button onClick={() => navigateTo('history')} className="bg-gray-200 dark:bg-gray-700 text-light-text dark:text-dark-text font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity">
                    Back to History
                </button>
                <button onClick={handleExport} disabled={isExporting} className="bg-light-accent dark:bg-dark-accent text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isExporting ? 'Exporting...' : 'Export as PDF'}
                </button>
            </div>
        </div>

        <div ref={reportRef} className="p-4 sm:p-8 bg-light-surface dark:bg-dark-surface rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-light-accent dark:text-dark-accent border-b pb-2 border-gray-300 dark:border-gray-700">Viewpoint Summaries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {synthesisReport!.viewpointSummaries.map((vp, i) => (
                    <div key={i} className="p-4 bg-light-bg dark:bg-dark-bg rounded-lg">
                        <h3 className="font-bold text-lg">{vp.personaName}</h3>
                        <p className="text-gray-600 dark:text-gray-400 italic">"{vp.summary}"</p>
                    </div>
                ))}
            </div>

            <h2 className="text-2xl font-bold mb-4 text-light-accent dark:text-dark-accent border-b pb-2 border-gray-300 dark:border-gray-700">Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold text-xl mb-3">Points of Agreement</h3>
                    <ul className="list-disc list-inside space-y-2 text-green-700 dark:text-green-400">
                        {synthesisReport!.pointsOfAgreement.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                </div>
                 <div>
                    <h3 className="font-bold text-xl mb-3">Points of Conflict</h3>
                    <ul className="list-disc list-inside space-y-2 text-red-700 dark:text-red-400">
                        {synthesisReport!.pointsOfConflict.map((pt, i) => <li key={i}>{pt}</li>)}
                    </ul>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-light-accent dark:text-dark-accent border-b pb-2 border-gray-300 dark:border-gray-700">Path Forward</h2>
            <div className="mb-8">
                 <h3 className="font-bold text-xl mb-3">Bridging Questions</h3>
                 <p className="mb-4 text-gray-600 dark:text-gray-400">To continue the conversation, consider discussing the following questions:</p>
                 <div className="space-y-3">
                    {synthesisReport!.bridgingQuestions.map((q, i) => (
                        <div key={i} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg border-l-4 border-light-accent dark:border-dark-accent">{q}</div>
                    ))}
                 </div>
            </div>

             <div>
                 <h3 className="font-bold text-xl mb-3">Final Conclusion</h3>
                 <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{synthesisReport!.finalConclusion}</p>
            </div>
        </div>
    </div>
  );
};