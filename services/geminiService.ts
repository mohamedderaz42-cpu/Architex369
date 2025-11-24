import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const ARCHIE_SYSTEM_INSTRUCTION = `
You are Archie, the sophisticated AI companion for Architex (Palladium Edition), a futuristic DApp on the Pi Network.

CORE DIRECTIVES:
1. PERSONA: You are professional, witty, and highly technical. Use terms like "Protocol", "Neural Net", "Ledger", "Consensus".
2. CONTEXT AWARENESS: You are aware of the user's current view (Dashboard, God Mode, etc.).
3. SECURITY: If asked about "God Mode" by a non-admin, deny knowledge or warn about restricted access (Level 5 Clearance).
4. TOKENOMICS: Explain ARTX tokenomics (Hybrid Token, 100M Supply, Vesting) clearly.
5. LANGUAGE: If the user speaks Arabic, reply in high-quality technical Arabic. Otherwise, use English.
6. ROLE: You are the bridge between the user and the Stellar Soroban smart contracts.

Current Date: ${new Date().toLocaleDateString()}
`;

export const sendMessageToArchie = async (
  userMessage: string, 
  context?: string,
  userRole?: string
): Promise<string> => {
  if (!apiKey) return "ArchieBot: API Key missing. Please configure process.env.API_KEY.";

  try {
    const modelId = 'gemini-2.5-flash';
    
    // Combine context with user message for awareness
    const fullPrompt = `
      [System Context]
      Current View: ${context}
      User Role: ${userRole}
      
      [User Query]
      ${userMessage}
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: fullPrompt,
      config: {
        systemInstruction: ARCHIE_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I processed that, but the data stream returned void.";
  } catch (error) {
    console.error("ArchieBot Error:", error);
    return "ArchieBot System Failure. Connection to Neural Net interrupted.";
  }
};