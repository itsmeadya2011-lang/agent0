import { GoogleGenAI, ThinkingLevel } from "@google/genai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export type TaskComplexity = "complex" | "general" | "fast";

export interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  complexity?: TaskComplexity;
}

export async function executeAgentReasoning(options: GenerateOptions) {
  const ai = getGeminiClient();
  const complexity = options.complexity || "complex";

  let model: string;
  let config: any = {};

  if (options.systemInstruction) {
    config.systemInstruction = options.systemInstruction;
  }

  if (complexity === "complex") {
    // Mandated: gemini-3.1-pro-preview with thinkingLevel HIGH and no maxOutputTokens
    model = "gemini-3.1-pro-preview";
    config.thinkingConfig = {
      thinkingLevel: ThinkingLevel.HIGH,
    };
  } else if (complexity === "fast") {
    model = "gemini-3.1-flash-lite";
  } else {
    model = "gemini-3.5-flash";
  }

  const response = await ai.models.generateContent({
    model,
    contents: options.prompt,
    config,
  });

  return {
    text: response.text || "",
    modelUsed: model,
    thinkingLevel: complexity === "complex" ? "HIGH" : undefined,
  };
}

export async function generateSpeechAudio(text: string, voiceName: string = "Puck") {
  const ai = getGeminiClient();

  // Mandated: gemini-3.8-flash-tts
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash-tts",
    contents: [
      {
        role: "user",
        parts: [
          {
            text,
            speechMetadata: {
              speaker: "agent0",
              style: "Crisp, concise, futuristic autonomous AI assistant",
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName || "Puck" },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio was returned from gemini-3.8-flash-tts.");
  }

  return {
    audioData: base64Audio,
    mimeType: "audio/wav",
    modelUsed: "gemini-3.8-flash-tts",
  };
}

export async function runGithubCodeReview(codeDiffOrPr: string, repoName: string) {
  const ai = getGeminiClient();
  
  // Complex code reasoning uses gemini-3.1-pro-preview with HIGH thinking
  const prompt = `You are agent0, the autonomous AI engineer conducting an automated GitHub code review and security audit for repository "${repoName}".
Analyze the following code changes / PR diff carefully:

${codeDiffOrPr}

Provide a structured, deep diagnostic report with:
1. Executive Summary (Verdict: APPROVED, CHANGES_REQUESTED, or SECURITY_ALERT)
2. Quality & Security Score (0 to 100)
3. Critical Findings & Vulnerability Checks (OWASP, SQLi, XSS, memory/race conditions, logic bugs)
4. Suggested Improvements & Refactor Suggestions with code snippets
5. Automated CI/CD Deployment Assessment (Ready to ship or blocked)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
      systemInstruction: "You are agent0, a next-generation senior software engineer and security specialist. Be thorough, decisive, and precise.",
    },
  });

  return {
    review: response.text || "",
    modelUsed: "gemini-3.1-pro-preview",
    thinkingLevel: "HIGH",
  };
}

export async function planBrowserAndComputerActions(objective: string, currentContext: string) {
  const ai = getGeminiClient();

  const prompt = `Objective: ${objective}
Current Screen / Page State:
${currentContext}

Plan the next sequence of autonomous computer and browser actions. Return a JSON array of actions with properties:
- action: "navigate" | "click" | "type" | "keypress" | "scroll" | "screenshot" | "inspect" | "evaluate" | "complete"
- target: string (CSS selector, element text, or screen coordinates)
- value: string (optional, text to type or URL)
- reason: string (brief rationale for this step)`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      systemInstruction: "You are agent0 Computer & Browser Use Engine. Generate high-precision atomic OS/Browser steps.",
    },
  });

  return {
    actionsJson: response.text || "[]",
    modelUsed: "gemini-3.5-flash",
  };
}
