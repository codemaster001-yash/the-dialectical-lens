
import React, { useState, useEffect, useRef } from 'react';
import { getAllSessions, deleteSession } from '../../services/dbService';
import type { DebateSession } from '../../types';
import { Spinner, TrashIcon, DownloadIcon } from '../icons/Icons';

declare var jspdf: any;
declare var html2canvas: any;

const HistoryDetailView: React.FC<{ session: DebateSession, onBack: () => void, onDownload: (id: string) => void }> = ({ session, onBack, onDownload }) => {
    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&larr; Back</button>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{session.topic}</h2>
                    <p className="text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
            </div>
            
            <div id={`pdf-content-${session.id}`} className="bg-light-primary dark:bg-dark-primary p-6 rounded-xl">
                 <h3 className="text-xl font-bold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Personas</h3>
                 <div className="space-y-6 mb-6">
                     {session.personas.map(p => (
                         <div key={p.name} className="bg-light-secondary dark:bg-dark-secondary p-4 rounded-xl shadow-sm">
                            <div className='mb-3'>
                                <p className="font-bold text-lg text-light-accent dark:text-dark-accent">{p.name}</p>
                                <p className="font-semibold text-md text-light-text/90 dark:text-dark-text/90">{p.title}</p>
                            </div>
                             
                            <div className='text-sm space-y-3'>
                                <div>
                                    <h4 className="font-bold text-light-text/80 dark:text-dark-text/80">AI Persona Description:</h4>
                                    <p className="text-light-text/70 dark:text-dark-text/70 mt-1">{p.full_description}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-light-text/80 dark:text-dark-text/80">User-Defined Goals:</h4>
                                    <p className="text-light-text/70 dark:text-dark-text/70 mt-1">{p.userInput.goals}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-light-text/80 dark:text-dark-text/80">User-Defined Perspective:</h4>
                                    <p className="text-light-text/70 dark:text-dark-text/70 mt-1">{p.userInput.perspective}</p>
                                </div>
                            </div>
                         </div>
                     ))}
                 </div>
                 
                 <h3 className="text-xl font-bold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">Transcript</h3>
                 <div className="space-y-4 max-h-[40vh] overflow-y-auto p-4 bg-light-secondary dark:bg-dark-secondary rounded-xl">
                     {session.chatLog.map((chat, i) => (
                         <div key={i} className="text-sm"><span className="font-bold">{chat.personaName}:</span> {chat.message}</div>
                     ))}
                 </div>
                 
                 {session.conclusion && (
                     <div className="mt-6 border-t border-gray-300 dark:border-gray-600 pt-4">
                         <h3 className="text-xl font-bold mb-4">Conclusion & Analysis</h3>
                         <div className="grid md:grid-cols-2 gap-6 text-sm">
                            <div>
                                <h4 className="font-bold mb-2">Key Agreements</h4>
                                <ul className="list-disc list-inside space-y-1 text-light-text/80 dark:text-dark-text/80">{session.conclusion.agreement_points.map((p,i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">Key Conflicts</h4>
                                <ul className="list-disc list-inside space-y-1 text-light-text/80 dark:text-dark-text/80">{session.conclusion.conflict_points.map((p,i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                            <div className="md:col-span-2">
                                <h4 className="font-bold mb-2">Bridging Questions</h4>
                                <ul className="list-disc list-inside space-y-1 text-light-text/80 dark:text-dark-text/80">{session.conclusion.bridging_questions.map((p,i) => <li key={i}>{p}</li>)}</ul>
                            </div>
                             <div className="md:col-span-2 border-t border-gray-300 dark:border-gray-600 pt-4 mt-2">
                                <h4 className="font-bold mb-2">Final Summary</h4>
                                <p className="text-light-text/80 dark:text-dark-text/80">{session.conclusion.conclusion}</p>
                            </div>
                            {session.conclusion.action_items && session.conclusion.action_items.length > 0 && (
                                <div className="md:col-span-2 border-t border-gray-300 dark:border-gray-600 pt-4 mt-2">
                                    <h4 className="font-bold mb-2">Actionable Suggestions</h4>
                                    <div className="space-y-3">
                                        {session.conclusion.action_items.map((item, index) => (
                                            <div key={index}>
                                                <p className="font-semibold text-light-text/90 dark:text-dark-text/90">{item.personaName}:</p>
                                                <ul className="list-disc list-inside pl-4 space-y-1 text-light-text/80 dark:text-dark-text/80">
                                                    {item.suggestions.map((suggestion, sIndex) => (
                                                        <li key={sIndex}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                 )}
            </div>

            <div className="text-center mt-8">
                <button onClick={() => onDownload(session.id)} className="px-6 py-3 bg-light-accent text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 mx-auto">
                    <DownloadIcon/> Download PDF
                </button>
            </div>
        </div>
    );
};

const HistoryScreen: React.FC = () => {
  const [sessions, setSessions] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedSession, setSelectedSession] = useState<DebateSession | null>(null);
  
  const fetchSessions = async () => {
    setLoading(true);
    const allSessions = await getAllSessions();
    setSessions(allSessions);
    setLoading(false);
  };
  
  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
        await deleteSession(id);
        if (selectedSession?.id === id) {
            setSelectedSession(null);
        }
        fetchSessions(); // Refresh list
    }
  };

  const handleDownloadPdf = async (sessionId: string) => {
    const { jsPDF } = jspdf;
    const content = document.getElementById(`pdf-content-${sessionId}`);
    if(content){
        const canvas = await html2canvas(content, { 
            scale: 2, 
            useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#F9F9F9'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = pdfWidth / imgWidth;
        const pdfHeight = imgHeight * ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`convolution-session-${sessionId}.pdf`);
    }
  };
  
  const filteredSessions = sessions
    .filter(s => s.topic.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  if (selectedSession) {
      return <HistoryDetailView session={selectedSession} onBack={() => setSelectedSession(null)} onDownload={handleDownloadPdf} />
  }

  return (
    <div className="max-w-5xl mx-auto animate-slide-in">
      <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Session History</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input type="text" placeholder="Filter by topic..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-light-accent"/>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-light-accent">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
            </select>
        </div>
        
        {loading ? <div className="flex justify-center p-8"><Spinner className="w-10 h-10 text-light-accent dark:text-dark-accent"/></div> : (
            <div className="space-y-4">
                {filteredSessions.length > 0 ? filteredSessions.map(session => (
                    <div key={session.id} className="bg-light-primary dark:bg-dark-primary p-4 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow">
                        <div onClick={() => setSelectedSession(session)} className="cursor-pointer flex-grow pr-4">
                            <h3 className="font-bold">{session.topic}</h3>
                            <p className="text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                             <button onClick={() => handleDelete(session.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"><TrashIcon/></button>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-8">No sessions found. Start a new convolution to see it here.</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;