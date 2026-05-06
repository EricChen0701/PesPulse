import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  urgency: number;
  department: string;
  warning_label: string;
}

export async function analyzeSymptoms(symptoms: string): Promise<AnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: symptoms }]
        }
      ],
      config: {
        systemInstruction: `You are a pet emergency dispatcher. Analyze the symptoms and return a JSON object.
        - urgency: integer 1-10
        - department: string (e.g., "Surgery", "Internal Medicine", "Toxicology", "ER")
        - warning_label: string (Short warning if urgency > 7, otherwise empty)
        ALWAYS respond in valid JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            urgency: { type: Type.INTEGER },
            department: { type: Type.STRING },
            warning_label: { type: Type.STRING }
          },
          required: ["urgency", "department", "warning_label"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      urgency: 5,
      department: "General ER",
      warning_label: "Unable to analyze symptoms. Please proceed to the nearest clinic."
    };
  }
}
