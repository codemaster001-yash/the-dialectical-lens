import React from 'react';
import { HeartIcon, SpeechBubblesIcon, BrainIcon } from '../icons/Icons';

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-light-primary dark:bg-dark-primary p-6 rounded-xl shadow-md flex items-start space-x-4">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-light-text/70 dark:text-dark-text/70">{children}</p>
        </div>
    </div>
);

const AboutScreen: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto animate-slide-in space-y-12">
            <div className="text-center">
                <h1 className="text-5xl font-bold text-light-accent dark:text-dark-accent">Convolution</h1>
                <p className="mt-4 text-xl text-light-text/80 dark:text-dark-text/80">
                    A tool for deeper understanding through AI-driven structured dialogue.
                </p>
            </div>

            <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4">What is Convolution?</h2>
                <p className="text-light-text/70 dark:text-dark-text/70 leading-relaxed">
                    Convolution is an AI-powered application designed to help you explore complex, nuanced, or controversial topics from multiple perspectives. Instead of a simple Q&A, it simulates a structured conversation between different "expert" AI personas, each with a unique background and viewpoint. By observing their interaction and reading the final synthesized analysis, you can move beyond echo chambers and gain a richer, more holistic understanding of any issue.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <InfoCard icon={<HeartIcon />} title="Fosters Empathy">
                    By seeing a topic through the eyes of different AI personas, users develop a greater capacity to understand and share the feelings of others, even those with opposing views.
                </InfoCard>
                <InfoCard icon={<SpeechBubblesIcon />} title="Structured Dialogue">
                    The turn-based conversation ensures all viewpoints are heard, preventing interruptions and promoting a more thoughtful, constructive exchange of ideas than typical online debates.
                </InfoCard>
                <InfoCard icon={<BrainIcon />} title="Deeper Understanding">
                    The final AI analysis bridges gaps, highlights key agreements and conflicts, and provides actionable steps, moving the user from simple awareness to true comprehension.
                </InfoCard>
            </div>

            <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4">How It Works</h2>
                <ol className="list-decimal list-inside space-y-3 text-light-text/70 dark:text-dark-text/70">
                    <li><strong>Define the Conflict:</strong> Start by clearly stating the topic, question, or dilemma you want to explore.</li>
                    <li><strong>Create Participants:</strong> Define the basic characteristics for 2-4 participants. The more detail you provide, the richer the persona.</li>
                    <li><strong>AI Persona Generation:</strong> The AI takes your inputs and fleshes them out into complex personas with unique goals, motivations, and perspectives on the conflict.</li>
                    <li><strong>Simulated Conversation:</strong> The AI personas engage in a turn-by-turn debate, arguing their points based on their generated identities.</li>
                    <li><strong>Synthesis & Conclusion:</strong> Once the conversation concludes, a master AI moderator analyzes the entire transcript to provide a final summary, points of agreement/conflict, and actionable suggestions.</li>
                </ol>
            </div>

            <div className="bg-light-secondary dark:bg-dark-secondary p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Potential Applications & Best Practices</h2>
                <ul className="list-disc list-inside space-y-3 text-light-text/70 dark:text-dark-text/70">
                    <li><strong>Personal Decision Making:</strong> Explore the pros and cons of a major life choice (e.g., career change, moving).</li>
                    <li><strong>Creative Writing:</strong> Flesh out character motivations and dialogue for a story.</li>
                    <li><strong>Business Strategy:</strong> Simulate a board meeting with different stakeholders to anticipate objections and find consensus.</li>
                    <li><strong>Educational Tool:</strong> Help students understand historical debates or complex scientific theories from multiple viewpoints.</li>
                    <li><strong>Best Practice:</strong> Be specific in your topic and persona descriptions. The quality of the AI's output is directly related to the quality of your input.</li>
                </ul>
            </div>
        </div>
    );
};

export default AboutScreen;