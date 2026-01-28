import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get specialized client based on provider
async function getAICompletion(prompt: string, systemPrompt: string = "You output JSON only.", overrideProvider?: string) {
  const provider = (overrideProvider || process.env.AI_PROVIDER || 'openai').toLowerCase();

  try {
    if (provider === 'groq') {
      const groq = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
      });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: process.env.AI_MODEL_GROQ || "llama3-8b-8192",
        response_format: { type: "json_object" },
      });
      return JSON.parse(completion.choices[0].message.content || "{}");
    }

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: process.env.AI_MODEL_GEMINI || "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(`${systemPrompt}\n\n${prompt}`);
      return JSON.parse(result.response.text() || "{}");
    }

    // Default: OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: process.env.AI_MODEL_OPENAI || "gpt-4o-mini",
      response_format: { type: "json_object" },
    });
    return JSON.parse(completion.choices[0].message.content || "{}");

  } catch (error: any) {
    console.error(`❌ ${provider.toUpperCase()} Error:`, error.message);
    throw error;
  }
}

export async function generateScript({
  niche,
  language,
  duration_sec,
  cta,
  provider
}: {
  niche: string;
  language: string;
  duration_sec: number;
  cta: boolean;
  provider?: string;
}) {
  const prompt = `
    Create a script for a ${duration_sec} second video in ${language}.
    Niche: ${niche}.
    Structure:
    {
      "hook": "string",
      "body_lines": ["string", "string", "string"],
      "cta": "string"
    }
  `;

  try {
    return await getAICompletion(prompt, "You are a viral short-form video script writer. You output JSON only.", provider);
  } catch (error) {
    // Fallback to mock data if all providers fail
    return {
      hook: `Stop scrolling! Here is a secret about ${niche}.`,
      body_lines: [
        `Did you know that ${niche} is popular in ${language}?`,
        "It is one of the most interesting things to learn about.",
        "Most people don't know the third fact about this topic."
      ],
      cta: "Subscribe for more amazing content!"
    };
  }
}

export async function generateMetadata({ niche, language, script, provider }: { niche: string, language: string, script: string, provider?: string }) {
  const prompt = `
    Based on this script: "${script}"
    Generate Title, Caption, and 5 Hashtags.
    Return JSON:
    {
      "title": "string",
      "caption": "string",
      "hashtags": "string"
    }
  `;

  try {
    return await getAICompletion(prompt, "You are a social media expert. You output JSON only.", provider);
  } catch (error) {
    return {
      title: `The Truth About ${niche}`,
      caption: `I bet you didn't know this about ${niche}! Follow for more.`,
      hashtags: `#${niche.replace(/\s+/g, '')} #${language} #viral #shorts #reels`
    };
  }
}
