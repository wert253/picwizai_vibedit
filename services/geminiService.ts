import { GoogleGenAI } from "@google/genai";
import { MimicMode } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert clean base64
const cleanBase64 = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, "");

export const generateVibeCopy = async (
  sourceImageBase64: string,
  refImageBase64: string,
  mode: MimicMode
): Promise<string | null> => {
  const ai = getClient();

  // Construct a specific prompt based on the mode
  let modeInstruction = "";
  switch (mode) {
    case MimicMode.POSE:
      modeInstruction = "Redraw the person from the FIRST image, but strictly copy the body pose, gesture, and head angle of the person in the SECOND image. Keep the first person's identity.";
      break;
    case MimicMode.LIGHTING:
      modeInstruction = "Keep the subject and composition of the FIRST image, but completely change the lighting, color grading, and shadows to match the atmosphere of the SECOND image.";
      break;
    case MimicMode.OUTFIT:
      modeInstruction = "Redraw the person from the FIRST image wearing the clothes/outfit seen in the SECOND image. Keep the pose of the first image.";
      break;
    case MimicMode.SCENE:
      modeInstruction = "Place the subject from the FIRST image into the background environment/location shown in the SECOND image. Blend them naturally.";
      break;
    case MimicMode.COMPOSITION:
      modeInstruction = "Re-frame the subject of the FIRST image to match the camera angle, zoom level, and framing rule (e.g. rule of thirds) of the SECOND image.";
      break;
    default:
      modeInstruction = "Create a perfect fusion. Take the subject from the FIRST image and stylize it using the aesthetic, vibe, and style of the SECOND image.";
  }

  const prompt = `
    You are an expert visual editor.
    Image 1 is the USER SOURCE.
    Image 2 is the STYLE REFERENCE.
    
    Task: ${modeInstruction}
    
    Return a high-quality, photorealistic image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Optimized for image generation/editing tasks
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(sourceImageBase64)
            }
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(refImageBase64)
            }
          },
          { text: prompt }
        ]
      },
      config: {
         // Using a lower thinking budget or 0 for speed as this is a visual task
         // thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    console.warn("No image data returned, check API capabilities or prompt.");
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Helper to fetch a blob from a URL and convert to base64 (for the sample images)
export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};