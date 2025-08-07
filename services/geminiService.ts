import { GoogleGenAI, Type } from "@google/genai";
import type { PersonaInput, Persona, ChatMessage, Conclusion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set. This is required to communicate with the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';

const personaSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING },
        title: { type: Type.STRING, description: "A concise, descriptive expert role like 'Pragmatic Environmental Scientist'" },
        summary: { type: Type.STRING, description: "A 2-3 sentence overview of their core philosophy and stance on the conflict." },
        full_description: { type: Type.STRING, description: "A detailed, internally consistent persona description considering their background, goals, and societal context." },
    },
    required: ["name", "title", "summary", "full_description"]
};

const conclusionSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A one-sentence summary for each viewpoint." },
        agreement_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of core agreements found during the debate." },
        conflict_points: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of primary disagreements." },
        bridging_questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 questions that could help resolve the remaining conflict." },
        conclusion: { type: Type.STRING, description: "A final, balanced conclusion and suggested next steps for the participants." },
        action_items: {
            type: Type.ARRAY,
            description: "A list of actionable suggestions for each participant.",
            items: {
                type: Type.OBJECT,
                properties: {
                    personaName: { type: Type.STRING, description: "The name of the participant." },
                    suggestions: {
                        type: Type.ARRAY,
                        description: "A list of two concrete action items for this participant.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["personaName", "suggestions"]
            }
        }
    },
    required: ["summary", "agreement_points", "conflict_points", "bridging_questions", "conclusion", "action_items"]
};


export const getWelcomeMessage = async (): Promise<string> => {
    try {
        const prompt = "Translate the word 'Welcome' into a random, non-English language. Provide only the single, translated word as a plain string, without any additional text, formatting, or quotation marks.";
        const response = await ai.models.generateContent({
            model: textModel,
            contents: prompt,
            config: { temperature: 0.9 }
        });
        return response.text.replace(/["'.]/g, '').trim(); // Clean up quotes, periods, and whitespace
    } catch (error) {
        console.error("Error fetching welcome message:", error);
        return "Welcome";
    }
};

export const generatePersona = async (input: PersonaInput, conflict: string): Promise<Persona> => {
    const prompt = `You are a creative writer specializing in character development. Based on the following user-provided details, create a rich, empathetic, and detailed expert persona. User Details: ${JSON.stringify(input)}. The central conflict is: "${conflict}". Your output MUST be a valid JSON object matching the provided schema.`;

    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: personaSchema,
        }
    });

    const personaJson = JSON.parse(response.text);
    return { ...personaJson, userInput: input };
};

export async function* runDebateTurnStream(
    topic: string,
    personas: Persona[],
    chatLog: ChatMessage[]
): AsyncGenerator<ChatMessage, void, void> {
    const turn = chatLog.length;
    const currentPersona = personas[turn % personas.length];
    const recentHistory = chatLog.slice(-5).map(m => `${m.personaName}: "${m.message}"`).join('\n');

    const prompt = `You are playing the role of ${currentPersona.title}, ${currentPersona.name}.
Your core identity and beliefs are: ${currentPersona.full_description}.

The group is discussing: '${topic}'.
Here's the conversation so far:
${recentHistory}

It's your turn. Your goal is to help everyone converge on a shared understanding. Instead of just countering the last point, try to find common ground, ask a clarifying question, or offer a perspective that builds on what others have said. Your response should be natural, concise, and under 40 words. Speak as a person would, not a bot. Avoid formal greetings. Your response:`;

    const stream = await ai.models.generateContentStream({
        model: textModel,
        contents: prompt,
    });

    let fullMessage = "";
    let messageChunk: ChatMessage = { personaName: currentPersona.name, message: "", timestamp: Date.now() };

    for await (const chunk of stream) {
        const textChunk = chunk.text;
        fullMessage += textChunk;
        messageChunk = { ...messageChunk, message: fullMessage };
        yield messageChunk;
    }
}


export const synthesizeConclusion = async (topic: string, chatLog: ChatMessage[]): Promise<Conclusion> => {
    const transcript = chatLog.map(m => `${m.personaName}: ${m.message}`).join('\n');
    const synthesisPrompt = `You are a master moderator and synthesis expert. The following is a transcript of a debate on the topic: '${topic}'.
Transcript:
${transcript}

Your task is to provide a final analysis as a JSON object matching the provided schema. This includes summarizing agreements, conflicts, and proposing bridging questions. Crucially, you must also provide an 'action_items' array. For each participant, provide a 'personaName' and a 'suggestions' array containing exactly two concrete, actionable next steps they could take to help resolve the conflict.`;

    const response = await ai.models.generateContent({
        model: textModel,
        contents: synthesisPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: conclusionSchema,
        }
    });

    return JSON.parse(response.text) as Conclusion;
}