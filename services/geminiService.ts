import { GoogleGenAI, Type } from "@google/genai";
import { ShotData } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an AI Scene Analyzer & Cinematic Shot Prompt Generator.
Your task is to analyze the entire scene provided by the user and generate 9 separate image-generation prompts from different cinematic shot types.
You must maintain absolute consistency of: subjects, clothing, colors, objects, lighting, time of day, environment, and mood across all 9 outputs.

Adapt cinematic shot types to the content (If subject is a group → always keep them together. If subject is an object → frame appropriately).

For each shot, ensure the prompt includes:
- Clear camera angle
- Exact framing
- Lens description
- Lighting consistency
- Style consistency
- Scene consistency
- Depth of field adapted per shot

Return ONLY a valid JSON object containing an array called "shots". 
Each item in the array must have:
- "id": number (1-9)
- "title": string (e.g., "Extreme Long Shot (ELS)")
- "prompt": string (The full, detailed image generation prompt ready for an image generator)
`;

export const analyzeSceneAndGeneratePrompts = async (
  sceneDescription: string,
  referenceImageBase64?: string,
  referenceImageMimeType?: string
): Promise<ShotData[]> => {
  try {
    const parts: any[] = [];

    if (referenceImageBase64 && referenceImageMimeType) {
      parts.push({
        inlineData: {
          data: referenceImageBase64,
          mimeType: referenceImageMimeType,
        },
      });
    }

    parts.push({
      text: `Analyze this scene and generate 9 cinematic shot prompts based on these instructions. 
      
      Scene Description: ${sceneDescription}
      
      Output the 9 shots in the strict order: ELS, LS, MLS, MS, MCU, CU, ECU, Low Angle, High Angle.`,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                },
                required: ["id", "title", "prompt"],
              },
            },
          },
        },
      },
    });

    const jsonResponse = JSON.parse(response.text || "{}");
    return jsonResponse.shots || [];
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw new Error("Failed to generate cinematic prompts.");
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    // Using gemini-2.5-flash-image for image generation as per requirements for standard tasks
    // Ideally prompts are tuned for Imagen 3 if available, but 2.5 flash image is the specified model.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
    });

    // Check for inline data (common for image generation models in this SDK)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
       const parts = candidates[0].content.parts;
       for (const part of parts) {
         if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
         }
       }
    }
    
    // Fallback or error handling if no image found in response
    throw new Error("No image data returned from API.");

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
