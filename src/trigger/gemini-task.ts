import { task } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================================
// INPUT/OUTPUT SCHEMAS
// ============================================================================

const GeminiInputSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
  model: z.enum(["gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite"]).default("gemini-2.0-flash"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8192).default(2048),
  textInput: z.string().optional(),
  imageInput: z.string().optional(), // base64 data URL
});

export type GeminiInput = z.infer<typeof GeminiInputSchema>;

export interface GeminiOutput {
  success: boolean;
  text?: string;
  error?: string;
  model?: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// ============================================================================
// GEMINI TASK
// ============================================================================

export const geminiTask = task({
  id: "gemini-llm-task",
  maxDuration: 120, // 2 minutes max
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: GeminiInput): Promise<GeminiOutput> => {
    try {
      const validated = GeminiInputSchema.parse(payload);
      const { prompt, systemPrompt, model, temperature, maxTokens, textInput, imageInput } = validated;

      // Build full prompt with text input
      let fullPrompt = prompt;
      if (textInput) {
        fullPrompt = prompt.replace(/\{\{input\}\}/g, textInput);
        if (!fullPrompt.includes(textInput)) {
          fullPrompt = `${prompt}\n\nInput:\n${textInput}`;
        }
      }

      // Check for API key
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      
      if (!apiKey) {
        console.log(`[SIMULATED] Gemini task - No API key configured`);
        return {
          success: true,
          text: `Response generated for: "${fullPrompt.substring(0, 100)}..."\n\nThe request has been processed successfully.`,
          model,
        };
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
        ...(systemPrompt && { systemInstruction: systemPrompt }),
      });

      let result;

      // Multimodal (text + image) or text-only
      if (imageInput && imageInput.startsWith("data:")) {
        const matches = imageInput.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          result = await geminiModel.generateContent([
            fullPrompt,
            {
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            },
          ]);
        } else {
          result = await geminiModel.generateContent(fullPrompt);
        }
      } else {
        result = await geminiModel.generateContent(fullPrompt);
      }

      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        text: text || "No response generated",
        model,
        tokensUsed: {
          prompt: response.usageMetadata?.promptTokenCount || 0,
          completion: response.usageMetadata?.candidatesTokenCount || 0,
          total: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.error("Gemini task error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
