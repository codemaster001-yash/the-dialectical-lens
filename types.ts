
export type AppScreen = 'home' | 'setup' | 'debate' | 'conclusion' | 'history';

export type Theme = 'light' | 'dark';

export interface PersonaDetails {
  name: string;
  role: string;
  goal: string;
  grievance: string;
}

export interface Persona {
  id: number;
  name: string;
  title: string;
  philosophy: string; // The detailed internal monologue for the AI
  summary: string; // A brief summary for the UI card
  initialDetails: PersonaDetails;
}

export interface ChatMessage {
  personaName: string;
  message: string;
}

export interface SynthesisReport {
  viewpointSummaries: { personaName: string; summary: string }[];
  pointsOfAgreement: string[];
  pointsOfConflict: string[];
  bridgingQuestions: string[];
  finalConclusion: string;
}

export interface Conflict {
  id?: number;
  topic: string;
  createdAt: Date;
  participantCount: number;
  personaDetails: PersonaDetails[];
  personas?: Persona[];
  chatHistory?: ChatMessage[];
  synthesisReport?: SynthesisReport;
}