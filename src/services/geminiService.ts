import { GoogleGenAI, Type } from "@google/genai";
import type { PersonaDetails, Persona, ChatMessage, SynthesisReport } from '@/types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

/**
 * Safely parses a JSON string, providing a more informative error on failure.
 * @param text The JSON string to parse.
 * @returns The parsed object.
 */
const safeJsonParse = <T>(text: string): T => {
    try {
        if (!text || text.trim() === '') {
            // The API returned an empty response. This often happens with API key issues or content filtering.
            throw new Error("AI returned an empty response. Please check your API key and ensure the prompt content complies with safety policies.");
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse AI JSON response:", text);
        // The API returned something, but it's not valid JSON.
        throw new Error("AI returned a malformed response. The model may have failed to generate valid JSON.");
    }
};


/**
 * Generates probing questions to set up the personas.
 */
export const generateQuestionsForPersonaSetup = async (topic: string, participantCount: number) => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the conflict topic "${topic}", generate ${participantCount} distinct sets of 3 probing questions each. These questions will be used to understand the perspectives of the participants. The goal is to gather information that will help create empathetic and nuanced AI personas for a debate.
        The first question should always be "What is this persona's name?". The other two questions should be about their role, and their primary goal.
        Return the questions in a JSON array, where each element is an object with a "personaName" (e.g., 'Participant 1', 'Participant 2') and a "questions" array of 3 strings.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        personaName: { type: Type.STRING },
                        questions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        }
    });

    return safeJsonParse(response.text);
};

/**
 * Creates the initial AI personas based on user answers.
 */
export const createInitialPersonas = async (topic: string, details: PersonaDetails[]): Promise<Persona[]> => {
    const prompt = `You are an expert in conflict resolution and psychology. Based on the conflict topic "${topic}" and the following participant details, create a set of AI personas.
    For each participant, develop:
    1. A short, descriptive "title".
    2. A "philosophy": A rich, internal monologue (2-3 sentences) for the AI to use as its guiding principle. This should capture their core beliefs and motivations.
    3. A "summary": A single, concise sentence that summarizes their viewpoint for the UI.

    The "philosophy" is the most critical part for the AI's internal context.
    
    Participant Details:
    ${details.map((p, i) => `
    Participant ${i + 1}:
    - Name: ${p.name}
    - Role/Stance: ${p.role}
    - Goal/Desired Outcome: ${p.goal}
    - Grievance/Frustration: ${p.grievance}
    `).join('')}

    Return a JSON array of personas.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.INTEGER },
                        name: { type: Type.STRING },
                        title: { type: Type.STRING },
                        philosophy: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    }
                }
            }
        }
    });
    
    const personasFromAI = safeJsonParse<any[]>(response.text);
    
    // Combine AI-generated data with original details
    return personasFromAI.map((p: any, index: number) => ({
        ...p,
        id: index + 1,
        name: details[index].name, // Ensure name from user input is used
        initialDetails: details[index]
    }));
};

/**
 * Generates a single turn in the debate using low-latency streaming.
 */
export const streamDebateTurn = async (chatHistory: ChatMessage[], persona: Persona) => {
    const historyString = chatHistory.map(m => `${m.personaName}: ${m.message}`).join('\n');
    
    const prompt = `You are ${persona.name}, with the title "${persona.title}". Your core, private philosophy is: "${persona.philosophy}".
    Continue the following debate. Your response MUST be concise (under 70 words), stay in character, and aim towards finding a resolution or deeper understanding. Do not simply restate your position. Build on or respond to the last message.
    
    Conversation so far:
    ${historyString}
    
    Your turn, ${persona.name}:`;

    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            // Optimization: Disable thinking for very low latency, ideal for chat/debate turns
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
};

/**
 * Generates the final synthesis report for the entire debate.
 */
export const synthesizeConclusion = async (chatHistory: ChatMessage[], personas: Persona[]): Promise<SynthesisReport> => {
    const historyString = chatHistory.map(m => `${m.personaName}: ${m.message}`).join('\n\n');
    const personaString = personas.map(p => `- ${p.name} (${p.title}): ${p.summary}`).join('\n');

    const prompt = `You are an expert mediator and conflict resolution analyst. You have observed a debate. Your task is to analyze the entire conversation and provide a comprehensive, objective synthesis report. Do not take sides. Your goal is to help the real-world participants find common ground.

    The debate was between:
    ${personaString}

    Full conversation history:
    ${historyString}

    Please generate the report in the specified JSON format.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    viewpointSummaries: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                personaName: { type: Type.STRING },
                                summary: { type: Type.STRING, description: "A one-sentence summary of this persona's final stance." }
                            }
                        }
                    },
                    pointsOfAgreement: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "List 2-4 key points or underlying values where personas found common ground."
                    },
                    pointsOfConflict: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "List 2-4 core areas of disagreement that remained at the end."
                    },
                    bridgingQuestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Provide 3 thoughtful, open-ended questions the real participants can ask each other to bridge their divide."
                    },
                    finalConclusion: {
                        type: Type.STRING,
                        description: "A final, empathetic paragraph summarizing the debate's outcome and suggesting a path forward."
                    }
                }
            }
        }
    });

    return safeJsonParse<SynthesisReport>(response.text);
};