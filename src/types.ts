export interface PersonaInput {
  id: number;
  name: string;
  age: string;
  gender: string;
  profession: string;
  country: string;
  goals: string;
  perspective: string;
}

export interface Persona {
  userInput: PersonaInput;
  name: string;
  title: string;
  summary: string;
  full_description: string;
}

export interface ChatMessage {
  personaName: string;
  message: string;
  timestamp: number;
}

export interface ActionItem {
  personaName: string;
  suggestions: string[];
}

export interface Conclusion {
  summary: string[];
  agreement_points: string[];
  conflict_points: string[];
  bridging_questions: string[];
  conclusion: string;
  action_items: ActionItem[];
}

export interface DebateSession {
  id: string;
  createdAt: string;
  topic: string;
  title: string;
  personas: Persona[];
  chatLog: ChatMessage[];
  conclusion: Conclusion | null;
}

export enum Screen {
  Splash,
  Setup,
  PersonaCreation,
  PersonaGallery,
  Debate,
  History,
  Replay,
  About,
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';