import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// ============================================================================
// ZOD VALIDATION SCHEMA
// ============================================================================

const LLMRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  systemPrompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(8192).default(2048),
  imageData: z.string().optional(),
});

// ============================================================================
// MULTI-PROVIDER LLM API ROUTE
// ============================================================================

type Provider = "gemini" | "openai" | "anthropic" | "openrouter" | "groq" | "huggingface";

interface ProviderConfig {
  name: Provider;
  apiKey: string;
  priority: number;
}

// Get all available providers with their API keys
const getAvailableProviders = (): ProviderConfig[] => {
  const providers: ProviderConfig[] = [];

  // Gemini providers (multiple keys supported)
  const geminiKeys = [
    process.env.GOOGLE_AI_API_KEY,
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ]
    .filter(Boolean)
    .flatMap((key) => {
      if (!key) return [];
      return key.includes(",")
        ? key.split(",").map((k) => k.trim()).filter(Boolean)
        : [key.trim()];
    });

  geminiKeys.forEach((key, index) => {
    providers.push({
      name: "gemini",
      apiKey: key,
      priority: 10 + index, // Higher priority for first key
    });
  });

  // OpenAI
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      priority: 20,
    });
  }

  // Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      name: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      priority: 30,
    });
  }

  // OpenRouter (aggregates multiple APIs, good fallback)
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      priority: 40,
    });
  }

  // Groq (very generous free tier, very fast) - Higher priority for reliability
  if (process.env.GROQ_API_KEY) {
    providers.push({
      name: "groq",
      apiKey: process.env.GROQ_API_KEY,
      priority: 5, // Higher priority - try Groq early since it's free and reliable
    });
  }

  // Hugging Face Inference API (free tier available)
  if (process.env.HUGGINGFACE_API_KEY) {
    providers.push({
      name: "huggingface",
      apiKey: process.env.HUGGINGFACE_API_KEY,
      priority: 60,
    });
  }

  // Sort by priority (lower = tried first)
  return providers.sort((a, b) => a.priority - b.priority);
};

// ============================================================================
// MODEL NAME MAPPING
// ============================================================================

// Map model names based on provider
function getModelForProvider(requestedModel: string | undefined, provider: Provider): string {
  const model = requestedModel || "";
  
  // Provider-specific handling
  if (provider === "gemini") {
    if (!model || model.startsWith("gemini-")) {
      return model || "gemini-2.0-flash";
    }
    // Unknown model for Gemini, use default
    return "gemini-2.0-flash";
  }
  
  if (provider === "openai") {
    if (model.startsWith("gpt-") || model.startsWith("o1-")) {
      return model;
    }
    // Map Gemini/other models to OpenAI equivalent
    if (model.startsWith("gemini-")) {
      return "gpt-4o-mini"; // Fast and cheap equivalent
    }
    return "gpt-4o-mini"; // Default
  }
  
  if (provider === "anthropic") {
    if (model.startsWith("claude-")) {
      return model;
    }
    // Map Gemini/other models to Claude equivalent
    if (model.startsWith("gemini-")) {
      if (model.includes("flash")) {
        return "claude-3-5-haiku-20241022"; // Fast and cheap
      }
      return "claude-3-5-sonnet-20241022"; // Default
    }
    return "claude-3-5-sonnet-20241022"; // Default
  }
  
  if (provider === "openrouter") {
    // OpenRouter supports many models with provider prefix
    if (model.startsWith("openai/") || model.startsWith("anthropic/") || model.startsWith("google/")) {
      return model;
    }
    // Map common models to OpenRouter format
    if (model.startsWith("gemini-")) {
      return `google/${model}`;
    }
    if (model.startsWith("gpt-")) {
      return `openai/${model}`;
    }
    if (model.startsWith("claude-")) {
      return `anthropic/${model}`;
    }
    // Default to OpenAI GPT-4o-mini for unknown models
    return "openai/gpt-4o-mini";
  }
  
  if (provider === "groq") {
    // Groq supports Llama, Mixtral, Gemma models
    if (model.startsWith("llama") || model.startsWith("mixtral") || model.startsWith("gemma")) {
      return model;
    }
    // Map to Groq's fast models
    if (model.startsWith("gemini-")) {
      return "llama-3.1-70b-versatile"; // Fast and capable
    }
    return "llama-3.1-70b-versatile"; // Default - very fast and free
  }
  
  if (provider === "huggingface") {
    // Hugging Face supports many models
    if (model.includes("/")) {
      return model; // Already in format like "meta-llama/Llama-3-8b"
    }
    // Map to popular free models
    if (model.startsWith("gemini-")) {
      return "mistralai/Mistral-7B-Instruct-v0.2";
    }
    return "mistralai/Mistral-7B-Instruct-v0.2"; // Default free model
  }
  
  // Fallback (should never reach here)
  return "gpt-4o-mini";
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

async function callGemini(
  prompt: string,
  systemPrompt: string | undefined,
  requestedModel: string | undefined,
  temperature: number,
  maxTokens: number,
  imageData: string | undefined,
  apiKey: string
): Promise<{ text: string; model: string }> {
  const model = getModelForProvider(requestedModel, "gemini");
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({
    model: model,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
    ...(systemPrompt && { systemInstruction: systemPrompt }),
  });

  let result;
  if (imageData && typeof imageData === "string") {
    let mimeType = "image/jpeg";
    let base64Data = imageData;

    if (imageData.startsWith("data:")) {
      const matches = imageData.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

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
    result = await geminiModel.generateContent(prompt);
  }

  const response = await result.response;
  return {
    text: response.text(),
    model: model || "gemini-2.0-flash",
  };
}

async function callOpenAI(
  prompt: string,
  systemPrompt: string | undefined,
  requestedModel: string | undefined,
  temperature: number,
  maxTokens: number,
  imageData: string | undefined,
  apiKey: string
): Promise<{ text: string; model: string }> {
  const model = getModelForProvider(requestedModel, "openai");
  const messages: Array<{ role: string; content: string | Array<{ type: string; image_url?: { url: string }; text?: string }> }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  if (imageData) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageData } },
      ],
    });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || "No response",
      model: data.model || model,
    };
}

async function callAnthropic(
  prompt: string,
  systemPrompt: string | undefined,
  requestedModel: string | undefined,
  temperature: number,
  maxTokens: number,
  imageData: string | undefined,
  apiKey: string
): Promise<{ text: string; model: string }> {
  const model = getModelForProvider(requestedModel, "anthropic");
  const messages: Array<{ role: string; content: string | Array<{ type: string; source?: { type: string; media_type: string; data: string }; text?: string }> }> = [];

  if (imageData) {
    let base64Data = imageData;
    let mediaType = "image/jpeg";

    if (imageData.startsWith("data:")) {
      const matches = imageData.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        mediaType = matches[1];
        base64Data = matches[2];
      }
    }

    messages.push({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64Data,
          },
        },
        { type: "text", text: prompt },
      ],
    });
  } else {
    messages.push({ role: "user", content: prompt });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      temperature,
      ...(systemPrompt && { system: systemPrompt }),
      messages,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.content[0]?.text || "No response",
    model: data.model || model,
  };
}

async function callOpenRouter(
  prompt: string,
  systemPrompt: string | undefined,
  requestedModel: string | undefined,
  temperature: number,
  maxTokens: number,
  imageData: string | undefined,
  apiKey: string
): Promise<{ text: string; model: string }> {
  const model = getModelForProvider(requestedModel, "openrouter");
  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  // OpenRouter supports image URLs but we'll use text for simplicity
  messages.push({ role: "user", content: imageData ? `${prompt}\n[Image provided]` : prompt });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Galaxy AI",
    },
    body: JSON.stringify({
      model: model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || "No response",
    model: data.model?.id || model,
  };
}

async function callGroq(
  prompt: string,
  systemPrompt: string | undefined,
  requestedModel: string | undefined,
  temperature: number,
  maxTokens: number,
  imageData: string | undefined,
  apiKey: string
): Promise<{ text: string; model: string }> {
  const model = getModelForProvider(requestedModel, "groq");
  const messages: Array<{ role: string; content: string }> = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  // Groq doesn't support images in free tier, so we'll just use text
  messages.push({ role: "user", content: imageData ? `${prompt}\n[Image provided - processing as text]` : prompt });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || "No response",
    model: data.model || model,
  };
}

async function callHuggingFace(
  prompt: string,
  systemPrompt: string | undefined,
  requestedModel: string | undefined,
  temperature: number,
  maxTokens: number,
  imageData: string | undefined,
  apiKey: string
): Promise<{ text: string; model: string }> {
  const model = getModelForProvider(requestedModel, "huggingface");
  
  // Build full prompt with system prompt
  let fullPrompt = prompt;
  if (systemPrompt) {
    fullPrompt = `${systemPrompt}\n\n${prompt}`;
  }

  // Hugging Face Inference API
  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: fullPrompt,
      parameters: {
        temperature,
        max_new_tokens: maxTokens,
        return_full_text: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Hugging Face API error: ${error}`);
  }

  const data = await response.json();
  
  // Hugging Face returns array of objects with generated_text
  let text = "No response";
  if (Array.isArray(data) && data[0]?.generated_text) {
    text = data[0].generated_text;
  } else if (data.generated_text) {
    text = data.generated_text;
  }

  return {
    text: text,
    model: model,
  };
}

// ============================================================================
// MAIN API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = LLMRequestSchema.safeParse(body);

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

    // Get all available providers
    const providers = getAvailableProviders();

    if (providers.length === 0) {
      // No keys - still return a temporary response so UI works
      const fallbackText = [
        "Sample response (no API keys configured):",
        prompt.length > 300 ? prompt.slice(0, 300) + "…" : prompt,
        "",
        "Add GROQ_API_KEY (free) or another provider key in Vercel env for real AI responses.",
      ].join("\n");
      return NextResponse.json({
        success: true,
        text: fallbackText,
        model: "fallback",
        provider: "fallback",
      });
    }

    // Try each provider in order until one succeeds
    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        console.log(`[LLM API] Trying provider: ${provider.name}...`);

        let result: { text: string; model: string };

        switch (provider.name) {
          case "gemini":
            result = await callGemini(prompt, systemPrompt, model, temperature, maxTokens, imageData, provider.apiKey);
            break;
          case "openai":
            result = await callOpenAI(prompt, systemPrompt, model, temperature, maxTokens, imageData, provider.apiKey);
            break;
          case "anthropic":
            result = await callAnthropic(prompt, systemPrompt, model, temperature, maxTokens, imageData, provider.apiKey);
            break;
          case "openrouter":
            result = await callOpenRouter(prompt, systemPrompt, model, temperature, maxTokens, imageData, provider.apiKey);
            break;
          case "groq":
            result = await callGroq(prompt, systemPrompt, model, temperature, maxTokens, imageData, provider.apiKey);
            break;
          case "huggingface":
            result = await callHuggingFace(prompt, systemPrompt, model, temperature, maxTokens, imageData, provider.apiKey);
            break;
          default:
            throw new Error(`Unknown provider: ${provider.name}`);
        }

        console.log(`[LLM API] Success with provider: ${provider.name}`);

        return NextResponse.json({
          success: true,
          text: result.text,
          model: result.model,
          provider: provider.name,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.log(`[LLM API] Provider ${provider.name} failed: ${errorMsg}`);

        // Check if it's a rate limit/quota error - be very thorough
        const isRateLimit = errorMsg.includes("429") ||
          errorMsg.includes("quota") ||
          errorMsg.includes("rate limit") ||
          errorMsg.includes("exceeded") ||
          errorMsg.includes("insufficient_quota") ||
          errorMsg.includes("Too Many Requests") ||
          errorMsg.includes("billing") ||
          errorMsg.includes("plan and billing") ||
          errorMsg.toLowerCase().includes("quota exceeded");

        if (isRateLimit) {
          // Continue to next provider
          lastError = error instanceof Error ? error : new Error(errorMsg);
          continue;
        }

        // For other errors, also try next provider (might be temporary)
        lastError = error instanceof Error ? error : new Error(errorMsg);
        continue;
      }
    }

    // All providers failed - return temporary fallback response so UI still works
    const fallbackText = [
      "Here’s a sample response based on your request:",
      prompt.length > 200 ? prompt.slice(0, 200) + "…" : prompt,
      "",
      "This is a temporary fallback because API providers are currently unavailable (quota/keys). Add or check GROQ_API_KEY (free tier) in Vercel env for real responses.",
    ].join("\n");

    console.log("[LLM API] All providers failed, returning temporary fallback response");

    return NextResponse.json({
      success: true,
      text: fallbackText,
      model: "fallback",
      provider: "fallback",
    });
  } catch (error) {
    console.error("LLM API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
