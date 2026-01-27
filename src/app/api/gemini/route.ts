import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const GeminiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  systemPrompt: z.string().optional(),
  model: z.enum(["gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite"]).default("gemini-2.0-flash"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8192).default(2048),
  imageData: z.string().optional(),
});

// ============================================================================
// GEMINI API ROUTE - Server-side execution
// ============================================================================

// Enable simulation mode (bypasses API, returns realistic responses)
// Default to false - always try real API first
const SIMULATION_MODE = process.env.GEMINI_SIMULATION_MODE === "true" || process.env.GEMINI_SIMULATION_MODE === "1";

// Support multiple API keys for rotation (comma-separated in .env)
const getAllApiKeys = (): string[] => {
  // Check multiple possible environment variable names
  const keySources = [
    process.env.GOOGLE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ].filter(Boolean) as string[];
  
  const allKeys: string[] = [];
  for (const source of keySources) {
    if (source.includes(",")) {
      allKeys.push(...source.split(",").map(k => k.trim()).filter(Boolean));
    } else {
      allKeys.push(source.trim());
    }
  }
  
  return allKeys.filter(Boolean);
};

// Generate realistic simulated response
const generateSimulatedResponse = (prompt: string, systemPrompt?: string, imageData?: string): string => {
  const hasImage = !!imageData;
  const promptLower = prompt.toLowerCase();
  
  // Smart simulation based on prompt content - clean responses without API mentions
  if (promptLower.includes("summarize") || promptLower.includes("summary")) {
    return `Summary:\n${prompt.substring(0, 200)}...\n\nThe content has been processed and summarized based on your request.`;
  }
  
  if (promptLower.includes("translate") || promptLower.includes("translation")) {
    return `Translation:\n"${prompt.substring(0, 100)}..." → [Translation would appear here]\n\nThe translation has been processed.`;
  }
  
  if (promptLower.includes("code") || promptLower.includes("programming") || promptLower.includes("function")) {
    return `Here's a code example:\n\n\`\`\`javascript\nfunction example() {\n  // ${prompt.substring(0, 50)}...\n  return "result";\n}\n\`\`\`\n\nCode has been generated based on your request.`;
  }
  
  if (hasImage) {
    return `I can see an image in your request. Analysis results:\n- Image content and objects detected\n- Text in the image processed\n- Colors and composition analyzed\n\nThe image has been processed successfully.`;
  }
  
  // Default intelligent response - clean and professional
  return `Based on your prompt: "${prompt.substring(0, 150)}..."\n\nI've processed your request and generated a response. The workflow continues normally.`;
};

// Track exhausted keys (reset after 1 hour)
const exhaustedKeys = new Map<string, number>();
const EXHAUSTED_RESET_TIME = 60 * 60 * 1000; // 1 hour

const getAvailableKeys = (): string[] => {
  const allKeys = getAllApiKeys();
  const now = Date.now();
  
  // Filter out exhausted keys (unless reset time passed)
  return allKeys.filter(key => {
    const exhaustedAt = exhaustedKeys.get(key);
    if (!exhaustedAt) return true;
    if (now - exhaustedAt > EXHAUSTED_RESET_TIME) {
      exhaustedKeys.delete(key);
      return true;
    }
    return false;
  });
};

const markKeyExhausted = (key: string) => {
  exhaustedKeys.set(key, Date.now());
  console.log(`[Gemini API] Marked key as exhausted: ${key.substring(0, 20)}...`);
};

// Clear all exhausted keys (useful for debugging)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clearExhaustedKeys() {
  exhaustedKeys.clear();
  console.log(`[Gemini API] Cleared all exhausted keys`);
}

// GET endpoint for debugging API key status
export async function GET() {
  const allKeys = getAllApiKeys();
  const availableKeys = getAvailableKeys();
  const exhausted = Array.from(exhaustedKeys.entries()).map(([key, timestamp]) => ({
    key: key.substring(0, 20) + "...",
    exhaustedAt: new Date(timestamp).toISOString(),
    resetIn: Math.max(0, Math.ceil((EXHAUSTED_RESET_TIME - (Date.now() - timestamp)) / 1000 / 60)),
  }));

  return NextResponse.json({
    totalKeys: allKeys.length,
    availableKeys: availableKeys.length,
    exhaustedKeys: exhaustedKeys.size,
    keys: {
      all: allKeys.map(k => k.substring(0, 20) + "..."),
      available: availableKeys.map(k => k.substring(0, 20) + "..."),
      exhausted,
    },
    cacheSize: responseCache.size,
  });
}

// Simple in-memory cache (in production, use Redis)
const responseCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (prompt: string, model: string, systemPrompt?: string): string => {
  return `${model}:${systemPrompt || ""}:${prompt.substring(0, 100)}`;
};

const getCachedResponse = (key: string): string | null => {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.text;
  }
  responseCache.delete(key);
  return null;
};

const setCachedResponse = (key: string, text: string) => {
  responseCache.set(key, { text, timestamp: Date.now() });
  
  // Clean old cache entries (keep last 100)
  if (responseCache.size > 100) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    responseCache.clear();
    entries.slice(0, 100).forEach(([k, v]) => responseCache.set(k, v));
  }
};

export async function POST(request: NextRequest) {
  let body: unknown = null;
  
  try {
    // Parse and validate request body first
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }
    
    const validationResult = GeminiRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { prompt, systemPrompt, model, temperature, maxTokens, imageData } = validationResult.data;

    // SIMULATION MODE: Only use if explicitly enabled
    if (SIMULATION_MODE) {
      const simulatedText = generateSimulatedResponse(prompt, systemPrompt, imageData);
      return NextResponse.json({
        success: true,
        text: simulatedText,
        model: "simulated",
      });
    }

    // Check cache first (only for text-only, no image)
    if (!imageData) {
      const cacheKey = getCacheKey(prompt, model, systemPrompt);
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return NextResponse.json({
          success: true,
          text: cached,
          model: model,
          cached: true,
        });
      }
    }

    // Get available API keys
    const allKeys = getAllApiKeys();
    let availableKeys = getAvailableKeys();
    
    // Debug logging
    console.log(`[Gemini API] Total keys: ${allKeys.length}, Available: ${availableKeys.length}, Exhausted: ${exhaustedKeys.size}`);
    
    // If no keys available, try to clear exhausted cache and retry
    if (availableKeys.length === 0 && allKeys.length > 0) {
      console.log(`[Gemini API] Clearing exhausted keys cache - trying fresh...`);
      exhaustedKeys.clear();
      availableKeys = getAvailableKeys();
    }
    
    // If still no keys, try to make API call anyway (maybe key is in a different format)
    // Only return simulated if we truly have no keys AND simulation mode is not explicitly disabled
    const keysToTry = availableKeys.length > 0 ? availableKeys : (allKeys.length > 0 ? allKeys : []);

    // If no keys at all, return error instead of simulation
    if (keysToTry.length === 0) {
      console.error(`[Gemini API] No API keys found. Checked: GOOGLE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY`);
      return NextResponse.json(
        {
          success: false,
          error: "API configuration required",
        },
        { status: 503 }
      );
    }

    // Throttle requests - small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try each available key until one works
    for (const currentKey of keysToTry) {
      console.log(`[Gemini API] Trying key: ${currentKey.substring(0, 20)}...`);
      try {
        // Initialize Gemini with current API key
        const genAI = new GoogleGenerativeAI(currentKey);
        
        // Get model with configuration
        const geminiModel = genAI.getGenerativeModel({
          model: model,
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: maxTokens,
          },
          ...(systemPrompt && {
            systemInstruction: systemPrompt,
          }),
        });

        let result;

        // Check if image is provided (multimodal)
        if (imageData && typeof imageData === "string") {
          // Extract base64 data from data URL if needed
          let mimeType = "image/jpeg";
          let base64Data = imageData;

          if (imageData.startsWith("data:")) {
            const matches = imageData.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1];
              base64Data = matches[2];
            }
          }

          // Multimodal generation (text + image)
          result = await geminiModel.generateContent([
            prompt,
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ]);
        } else {
          // Text-only generation
          result = await geminiModel.generateContent(prompt);
        }

        const response = await result.response;
        const text = response.text();

        // Cache the response (only for text-only, no image)
        if (!imageData && text) {
          const cacheKey = getCacheKey(prompt, model, systemPrompt);
          setCachedResponse(cacheKey, text);
        }

        return NextResponse.json({
          success: true,
          text: text || "No response generated",
          model: model,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount,
          },
        });

      } catch (keyError) {
        const errorMsg = keyError instanceof Error ? keyError.message : "Unknown error";
        
        // Check if this key is rate limited
        if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Too Many Requests") || errorMsg.includes("rate limit") || errorMsg.includes("exceeded")) {
          console.log(`[Gemini API] Key rate limited, marking exhausted and trying next...`);
          markKeyExhausted(currentKey);
          
          // If this is the last key, don't continue
          if (keysToTry.indexOf(currentKey) === keysToTry.length - 1) {
            // Last key exhausted - will return simulated response below
            break;
          }
          continue; // Try next key
        }
        
        // For other errors, throw immediately
        throw keyError;
      }
    }

    // All keys exhausted - return error instead of simulation
    console.error(`[Gemini API] All ${keysToTry.length} API key(s) exhausted or failed`);
    return NextResponse.json(
      {
        success: false,
        error: "All API keys exhausted. Please try again later.",
      },
      { status: 503 }
    );

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Return error instead of simulation
    return NextResponse.json(
      {
        success: false,
        error: `API error: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
