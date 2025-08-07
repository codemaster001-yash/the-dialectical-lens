# The Dialectical Lens

## Project Overview

The Dialectical Lens is an AI-powered Single Page Application (SPA) designed to help users resolve conflicts and understand complex topics by simulating a structured, multi-persona debate. It fosters empathy by creating AI personas based on user-provided details and guides a conversation towards resolution or synthesis.

The application is built with React, TypeScript, and Tailwind CSS. It uses the Google Gemini API directly on the client and IndexedDB for local data storage, making it a powerful, modern, and easily deployable web application.

## Core Features

- **AI-Powered Debate Simulation:** Generates empathetic AI personas to debate a user-defined conflict.
- **Structured Conflict Setup:** A step-by-step wizard to gather context and perspectives, guided by AI-generated questions.
- **Real-time Streaming Debate:** Watch the AI-driven conversation unfold with low-latency, streamed responses.
- **Actionable Synthesis:** Receive a detailed report with summaries, points of agreement, and bridging questions.
- **Client-Side Storage:** All data is stored locally in your browser using IndexedDB. No user accounts needed.
- **Dark/Light Mode:** A beautiful, responsive interface with theme toggling.
- **Export to PDF:** Save your debate conclusions for offline viewing and sharing.

## Technical Stack

- **Frontend:** React 19 (with Vite), TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (`@google/genai`)
- **Database:** IndexedDB (via `idb` library)

---

## Local Development Setup

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A Google Gemini API Key

### 2. Clone the Repository

```bash
git clone <repository-url>
cd the-dialectical-lens
```

### 3. Install Dependencies

Install the necessary npm packages.

```bash
npm install
```

### 4. Set Up Environment Variables

The application requires a Gemini API key. Create a `.env` file in the root of the project:

```
API_KEY=your_gemini_api_key_here
```

When deploying to a static hosting provider like Netlify or Vercel, you will need to set this as a build-time environment variable with the name `API_KEY`.

### 5. Run the Development Server

```bash
npm run dev
```

This will start a local server, typically at `http://localhost:5173`. You can now access the application in your browser.

---

## File Structure

```
/
├── public/
│   └── ...
├── src/
│   ├── components/                 # Reusable UI components
│   ├── hooks/                      # Custom React hooks (e.g., useDB)
│   ├── pages/                      # Top-level screen components
│   ├── services/                   # Services for external interactions
│   │   ├── db.ts                   # IndexedDB service
│   │   └── geminiService.ts        # Gemini API service
│   ├── App.tsx                     # Main application component and routing
│   ├── index.css                   # Global styles (via Tailwind directives)
│   ├── index.tsx                   # Application entry point
│   └── types.ts                    # Global TypeScript types
├── .env                            # Environment variables (local only)
├── index.html                      # Main HTML file
├── package.json
└── README.md
```

## Core Logic & Prompt Engineering (`src/services/geminiService.ts`)

The magic of this application lies in its structured use of the Gemini API, all orchestrated from the client-side.

### 1. Persona Question Generation (`generateQuestionsForPersonaSetup`)

- **Trigger:** User provides a conflict topic and number of participants.
- **Prompt:** The AI is asked to generate relevant, probing questions for each participant based on the conflict. This ensures the data gathered is targeted and useful for creating distinct personas. It is asked to return a specific JSON structure for reliability.

### 2. Persona Creation (`createInitialPersonas`)

- **Trigger:** User submits the completed persona forms with answers to the AI-generated questions.
- **Prompt:** The service sends the topic and detailed answers to the AI, instructing it to act as an expert in psychology. It creates a "core philosophy" (an internal monologue for richness), a public title, and a UI summary for each persona. This gives the AI a rich, internal context to draw from during the debate.

### 3. Debate Turn Streaming (`streamDebateTurn`)

- **Trigger:** The debate is running, and it's a new persona's turn to speak.
- **Optimization:** This function uses the `generateContentStream` method with `thinkingConfig: { thinkingBudget: 0 }` on the `gemini-2.5-flash` model. This is a key optimization that provides very low-latency responses, making the debate feel fast and interactive.
- **Prompt:** The AI is reminded of its persona, its core philosophy, and the recent chat history. It's prompted to provide a concise, in-character response that moves the conversation forward.

### 4. Synthesis and Conclusion (`synthesizeConclusion`)

- **Trigger:** The debate concludes after a set number of turns.
- **Prompt:** This function sends the *entire* conversation history to the AI with a "master moderator" prompt. It asks the AI to act as an expert mediator and analyze the full debate to produce a structured report containing persona summaries, points of agreement, points of conflict, bridging questions, and a final conclusion. It uses `responseSchema` to guarantee a well-formed JSON object.

This multi-step, prompt-chained approach, now running entirely on the client, allows the application to move from broad context to specific details, to a dynamic exchange, and finally to a high-level, actionable summary.
