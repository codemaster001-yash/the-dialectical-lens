import { GoogleGenAI, Type } from "@google/genai";
import type { PersonaInput, Persona, ChatMessage, Conclusion } from "../types";

declare global {
  interface Window {
    CONVOLUTION_API_KEY: string;
  }
}

// --- API Key Management ---
const PLACEHOLDER_KEY = "%%GEMINI_API_KEY%%";

export const isApiKeyConfigured = (): boolean => {
  const key = window.CONVOLUTION_API_KEY;
  return !!key && key.trim() !== "" && key !== PLACEHOLDER_KEY;
};

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (ai) return ai;

  if (!isApiKeyConfigured()) {
    throw new Error("API key is not configured.");
  }
  ai = new GoogleGenAI({ apiKey: window.CONVOLUTION_API_KEY });
  return ai;
};

// --- Helper Functions ---
const cleanAiText = (text: string): string => {
  if (!text) return "";
  // Removes markdown formatting characters like asterisks for bold/italic and hashes for headers.
  // Also removes surrounding quotation marks which the model sometimes adds.
  return text.replace(/[*#]/g, "").replace(/^"|"$/g, "").trim();
};

// --- Model Schemas ---
const textModel = "gemini-2.5-flash";

const personaSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    title: {
      type: Type.STRING,
      description:
        "A concise, descriptive expert role like 'Pragmatic Environmental Scientist'",
    },
    summary: {
      type: Type.STRING,
      description:
        "A 2-3 sentence overview of their core philosophy and stance on the conflict.",
    },
    full_description: {
      type: Type.STRING,
      description:
        "A detailed, internally consistent persona description considering their background, goals, and societal context.",
    },
  },
  required: ["name", "title", "summary", "full_description"],
};

const conclusionSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A one-sentence summary for each viewpoint.",
    },
    agreement_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of core agreements found during the debate.",
    },
    conflict_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of primary disagreements.",
    },
    bridging_questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "3-5 questions that could help resolve the remaining conflict.",
    },
    conclusion: {
      type: Type.STRING,
      description:
        "A final, balanced conclusion and suggested next steps for the participants.",
    },
    action_items: {
      type: Type.ARRAY,
      description: "A list of actionable suggestions for each participant.",
      items: {
        type: Type.OBJECT,
        properties: {
          personaName: {
            type: Type.STRING,
            description: "The name of the participant.",
          },
          suggestions: {
            type: Type.ARRAY,
            description:
              "A list of two concrete action items for this participant.",
            items: { type: Type.STRING },
          },
        },
        required: ["personaName", "suggestions"],
      },
    },
  },
  required: [
    "summary",
    "agreement_points",
    "conflict_points",
    "bridging_questions",
    "conclusion",
    "action_items",
  ],
};

// --- API Functions ---
export const getWelcomeMessage = async (): Promise<string> => {
  try {
    const client = getAiClient();
    const prompt =
      "Translate the word 'Welcome' into a random language (including english). Provide only the single, translated word as a plain string, without any additional text, formatting, or quotation marks.";
    const response = await client.models.generateContent({
      model: textModel,
      contents: prompt,
      config: { temperature: 0.9 },
    });
    return cleanAiText(response.text);
  } catch (error) {
    console.error("Error fetching welcome message:", error);
    throw new Error(
      "Could not connect to AI services. This could be a network issue or a problem with the Gemini API (e.g. invalid key)."
    );
  }
};

export const generateDebateTitle = async (topic: string): Promise<string> => {
  try {
    const client = getAiClient();
    const prompt = `Generate a single short, descriptive title (5 words or less) for a debate about the following topic. The title should be like a book or article title. Do not use quotation marks. Topic: "${topic}"`;
    const response = await client.models.generateContent({
      model: textModel,
      contents: prompt,
      config: { temperature: 0.7 },
    });
    return cleanAiText(response.text);
  } catch (error) {
    console.error("Error generating debate title:", error);
    throw new Error("Could not generate a title for the debate.");
  }
};

export const generatePersona = async (
  input: PersonaInput,
  conflict: string
): Promise<Persona> => {
  const client = getAiClient();
  const prompt = `You are an expert creative writer and psycologist specializing in character development. Based on the following user-provided details, create a rich, empathetic, and detailed expert persona. User Details: ${JSON.stringify(
    input
  )}. The central conflict is: "${conflict}". Your output MUST be a valid JSON object matching the provided schema.`;

  const response = await client.models.generateContent({
    model: textModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: personaSchema,
    },
  });

  const personaJson = JSON.parse(response.text);
  const cleanedPersona = {
    name: cleanAiText(personaJson.name),
    title: cleanAiText(personaJson.title),
    summary: cleanAiText(personaJson.summary),
    full_description: cleanAiText(personaJson.full_description),
  };
  return { ...cleanedPersona, userInput: input };
};

export async function* runDebateTurnStream(
  topic: string,
  personas: Persona[],
  chatLog: ChatMessage[]
): AsyncGenerator<ChatMessage, void, void> {
  const client = getAiClient();
  const turn = chatLog.length;
  const currentPersona = personas[turn % personas.length];
  const recentHistory = chatLog
    .slice(-5)
    .map((m) => `${m.personaName}: "${m.message}"`)
    .join("\n");

  const prompt = `You are playing the role of ${currentPersona.title}, ${currentPersona.name}.
Your core identity and beliefs are: ${currentPersona.full_description}.

The group is discussing: '${topic}'.
Here's the conversation so far:
${recentHistory}

It's your turn. Your goal is to help everyone converge on a shared understanding. Instead of just countering the last point, try to find common ground, ask a clarifying question, or offer a perspective that builds on what others have said. Your response should be natural, concise, and under 40 words. Speak as a person would, not a bot. Avoid formal greetings. Your response:`;

  const stream = await client.models.generateContentStream({
    model: textModel,
    contents: prompt,
  });

  let fullMessage = "";
  let messageChunk: ChatMessage = {
    personaName: currentPersona.name,
    message: "",
    timestamp: Date.now(),
  };

  for await (const chunk of stream) {
    const textChunk = chunk.text;
    fullMessage += textChunk;
    // Clean the entire accumulated message so far on each yield
    messageChunk = { ...messageChunk, message: cleanAiText(fullMessage) };
    yield messageChunk;
  }
}

export const synthesizeConclusion = async (
  topic: string,
  chatLog: ChatMessage[]
): Promise<Conclusion> => {
  const client = getAiClient();
  const transcript = chatLog
    .map((m) => `${m.personaName}: ${m.message}`)
    .join("\n");
  const synthesisPrompt = `You are a master moderator and synthesis expert. The following is a transcript of a debate on the topic: '${topic}'.
Transcript:
${transcript}

Your task is to provide a final analysis as a JSON object matching the provided schema. This includes summarizing agreements, conflicts, and proposing bridging questions. Crucially, you must also provide an 'action_items' array. For each participant, provide a 'personaName' and a 'suggestions' array containing exactly two concrete, actionable next steps they could take to help resolve the conflict.`;

  const response = await client.models.generateContent({
    model: textModel,
    contents: synthesisPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: conclusionSchema,
    },
  });

  const conclusionJson = JSON.parse(response.text) as Conclusion;
  return {
    summary: conclusionJson.summary.map(cleanAiText),
    agreement_points: conclusionJson.agreement_points.map(cleanAiText),
    conflict_points: conclusionJson.conflict_points.map(cleanAiText),
    bridging_questions: conclusionJson.bridging_questions.map(cleanAiText),
    conclusion: cleanAiText(conclusionJson.conclusion),
    action_items: conclusionJson.action_items.map((item) => ({
      personaName: cleanAiText(item.personaName),
      suggestions: item.suggestions.map(cleanAiText),
    })),
  };
};
