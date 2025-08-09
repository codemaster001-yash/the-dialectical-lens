import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { getAllSessions, deleteSession } from '../../services/dbService';
import type { DebateSession } from '../../types';
import { Spinner, TrashIcon, DownloadIcon, ReplayIcon } from '../icons/Icons';

const generatePdfDocument = (session: DebateSession) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxW = pageW - margin * 2;
    let y = margin;

    // Always use high-contrast colors for PDF output, regardless of app theme.
    const textColor = [17, 24, 39]; // Near-black
    const accentColor = [79, 70, 229]; // Indigo
    const subtleTextColor = [107, 114, 128]; // Gray
    
    const checkPageBreak = (requiredHeight: number) => {
        if (y + requiredHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
        }
    };

    // --- Content ---
    doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    const titleLines = doc.splitTextToSize(session.title, maxW);
    checkPageBreak(titleLines.length * 10);
    doc.text(titleLines, margin, y);
    y += (titleLines.length * 8) + 2;
    
    doc.setFont('helvetica', 'italic').setFontSize(9).setTextColor(subtleTextColor[0], subtleTextColor[1], subtleTextColor[2]);
    checkPageBreak(5);
    doc.text(`Session from: ${new Date(session.createdAt).toLocaleString()}`, margin, y);
    y += 10;

    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(textColor[0], textColor[1], textColor[2]);
    checkPageBreak(10);
    doc.text('Full Topic:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal').setFontSize(11);
    const topicLines = doc.splitTextToSize(session.topic, maxW);
    checkPageBreak(topicLines.length * 5);
    doc.text(topicLines, margin, y);
    y += (topicLines.length * 4) + 8;
    
    const addSection = (title: string, contentFn: () => void) => {
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(title, margin, y);
        y += 8;
        contentFn();
        y += 5;
    };
    
    const addList = (items: string[]) => {
        items.forEach(item => {
            const lines = doc.splitTextToSize(`• ${item}`, maxW - 5);
            checkPageBreak(lines.length * 5);
            doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(subtleTextColor[0], subtleTextColor[1], subtleTextColor[2]);
            doc.text(lines, margin + 5, y);
            y += (lines.length * 4) + 2;
        });
    };
    
    addSection('Participants', () => {
        session.personas.forEach(p => {
            checkPageBreak(40);
            doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text(p.name, margin, y);
            y += 5;
            doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(p.title, margin, y);
            y += 6;
            
            const printPersonaDetail = (label: string, text: string) => {
                doc.setFont('helvetica', 'bold').setFontSize(9);
                doc.text(label, margin, y);
                y += 4;
                doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(subtleTextColor[0], subtleTextColor[1], subtleTextColor[2]);
                const lines = doc.splitTextToSize(text, maxW);
                checkPageBreak(lines.length * 4);
                doc.text(lines, margin, y);
                y += (lines.length * 3.5) + 4;
            };

            printPersonaDetail('AI Persona Description:', p.full_description);
            printPersonaDetail('User-Defined Goals:', p.userInput.goals);
            printPersonaDetail('User-Defined Perspective:', p.userInput.perspective);
            y += 4;
        });
    });

    addSection('Transcript', () => {
        session.chatLog.forEach(chat => {
            const chatLine = `${chat.personaName}: ${chat.message}`;
            const lines = doc.splitTextToSize(chatLine, maxW);
            checkPageBreak(lines.length * 5);
            doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text(lines, margin, y);
            y += (lines.length * 4) + 3;
        });
    });

    if (session.conclusion) {
        // Create a new reference to the conclusion to satisfy TypeScript's strict null checks inside callbacks
        const conclusionData = session.conclusion; 
        addSection('Conclusion & Analysis', () => {
            const addSubSection = (title: string, contentFn: () => void) => {
                checkPageBreak(8);
                doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(title, margin, y);
                y += 6;
                contentFn();
                y+= 4;
            };
            
            addSubSection('Final Summary', () => {
                const lines = doc.splitTextToSize(conclusionData.conclusion, maxW);
                doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(subtleTextColor[0], subtleTextColor[1], subtleTextColor[2]);
                doc.text(lines, margin, y);
                y += (lines.length * 4);
            });
            
            if (conclusionData.action_items?.length > 0) {
                 addSubSection('Actionable Suggestions', () => {
                     conclusionData.action_items.forEach(item => {
                         checkPageBreak(15);
                         doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(textColor[0], textColor[1], textColor[2]);
                         doc.text(item.personaName + ':', margin, y);
                         y += 5;
                         addList(item.suggestions);
                     });
                 });
            }

            addSubSection('Key Agreements', () => addList(conclusionData.agreement_points));
            addSubSection('Key Conflicts', () => addList(conclusionData.conflict_points));
            addSubSection('Bridging Questions', () => addList(conclusionData.bridging_questions));
        });
    }

    doc.save(`convolution-session-${session.title.replace(/\s/g, '_')}.pdf`);
};

const HistoryDetailView: React.FC<{ session: DebateSession, onBack: () => void, onReplay: (session: DebateSession) => void, onDownload: (id: string) => void }> = ({ session, onBack, onReplay, onDownload }) => {
    return (
        <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
            <div className="flex justify-between items-start mb-6">
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">&larr; Back</button>
                <div className="text-right flex-grow ml-4">
                    <h2 className="text-2xl font-bold">{session.title}</h2>
                    <p className="text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</p>
                </div>
            </div>
            
            <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-xl">
                 <div className='mb-6'>
                    <h3 className="text-lg font-bold text-light-text/90 dark:text-dark-text/90">Full Topic</h3>
                    <p className="mt-1 text-light-text/70 dark:text-dark-text/70">{session.topic}</p>
                 </div>

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

            <div className="text-center mt-8 flex justify-center items-center gap-4">
                <button onClick={() => onDownload(session.id)} className="px-6 py-3 bg-light-accent text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2">
                    <DownloadIcon/> Download PDF
                </button>
                 <button onClick={() => onReplay(session)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                    <ReplayIcon/> Replay Conversation
                </button>
            </div>
        </div>
    );
};

const HistoryScreen: React.FC<{onReplay: (session: DebateSession) => void}> = ({ onReplay }) => {
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
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        console.error("Could not find session to download.");
        return;
    }
    generatePdfDocument(session);
  };
  
  const filteredSessions = sessions
    .filter(s => s.title.toLowerCase().includes(filter.toLowerCase()) || s.topic.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
        if (sortOrder === 'newest') {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  if (selectedSession) {
      return <HistoryDetailView session={selectedSession} onBack={() => setSelectedSession(null)} onReplay={onReplay} onDownload={handleDownloadPdf} />
  }

  return (
    <div className="max-w-5xl mx-auto animate-slide-in">
      <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Session History</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input type="text" placeholder="Filter by title..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-light-primary dark:bg-dark-primary border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:outline-none focus:ring-light-accent"/>
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
                            <h3 className="font-bold">{session.title}</h3>
                            <p className="text-sm text-gray-500">{new Date(session.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                             <button title="Replay" onClick={() => onReplay(session)} className="p-2 text-light-accent dark:text-dark-accent hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"><ReplayIcon/></button>
                             <button title="Download PDF" onClick={() => handleDownloadPdf(session.id)} className="p-2 text-light-accent dark:text-dark-accent hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"><DownloadIcon/></button>
                             <button title="Delete" onClick={() => handleDelete(session.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"><TrashIcon/></button>
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