
import { GoogleGenAI, Type } from '@google/genai';
import { SensitivityStatus } from '../types';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initializing with the recommended pattern using process.env.API_KEY directly.
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeVideoSensitivity(title: string, description: string): Promise<SensitivityStatus> {
    try {
      // Using ai.models.generateContent with systemInstruction and responseSchema for robust JSON extraction.
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate the sensitivity of the following video:\nTitle: ${title}\nDescription: ${description}`,
        config: {
          systemInstruction: 'You are a content safety expert. Evaluate the sensitivity of a video. Classify it as either SAFE or FLAGGED based on potential harmful content, violence, or sensitive themes. If it sounds like a normal corporate, family, or educational video, it is SAFE. If it contains mentions of violence, illegal acts, or extreme adult themes, it is FLAGGED.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: {
                type: Type.STRING,
                description: 'Either SAFE or FLAGGED'
              },
              reason: {
                type: Type.STRING,
                description: 'Short reason for classification'
              }
            },
            required: ['classification']
          }
        }
      });

      // Extract the text content safely from the GenerateContentResponse.
      const jsonStr = response.text?.trim() || '{}';
      const result = JSON.parse(jsonStr);
      
      return result.classification === 'FLAGGED' ? SensitivityStatus.FLAGGED : SensitivityStatus.SAFE;
    } catch (error) {
      console.error('Gemini Analysis Error:', error);
      // Fallback to SAFE to prevent blocking flow if API fails.
      return SensitivityStatus.SAFE;
    }
  }
}

export const geminiService = new GeminiService();
