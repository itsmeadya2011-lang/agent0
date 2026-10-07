import type { IncomingMessage, ServerResponse } from "http";
import {
  executeAgentReasoning,
  generateSpeechAudio,
  runGithubCodeReview,
  planBrowserAndComputerActions,
} from "./geminiService.ts";

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || "";

  if (!url.startsWith("/api/")) {
    return false;
  }

  try {
    if (url === "/api/gemini/generate" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const result = await executeAgentReasoning({
        prompt: body.prompt,
        systemInstruction: body.systemInstruction,
        complexity: body.complexity || "complex",
      });
      sendJson(res, 200, result);
      return true;
    }

    if (url === "/api/gemini/tts" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const text = body.text || "agent0 system ready.";
      const voice = body.voice || "Puck";
      const result = await generateSpeechAudio(text, voice);
      sendJson(res, 200, result);
      return true;
    }

    if (url === "/api/gemini/code-review" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const diff = body.diff || "";
      const repo = body.repo || "agent0/core";
      const result = await runGithubCodeReview(diff, repo);
      sendJson(res, 200, result);
      return true;
    }

    if (url === "/api/gemini/browser-act" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const objective = body.objective || "Browse repository and verify test results";
      const context = body.context || "Initial homepage";
      const result = await planBrowserAndComputerActions(objective, context);
      sendJson(res, 200, result);
      return true;
    }

    if (url === "/api/gemini/file-edit" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const { filename, currentContent, instruction } = body;
      const prompt = `You are agent0, the autonomous coding agent.
File: "${filename}"
Current Content:
\`\`\`
${currentContent}
\`\`\`

Instruction for editing:
${instruction}

Output the modified full file content without extra markdown backticks, or if you provide backticks, output only the clean code. Also include a brief 1-line change summary.`;

      const result = await executeAgentReasoning({
        prompt,
        complexity: "complex",
        systemInstruction: "You are an expert engineer making precise local file changes. Provide the complete updated file content followed by '---SUMMARY---' and the summary.",
      });

      const parts = result.text.split("---SUMMARY---");
      let newCode = parts[0].trim();
      if (newCode.startsWith("```")) {
        newCode = newCode.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "");
      }
      const summary = parts[1]?.trim() || "Modified file per agent instructions";

      sendJson(res, 200, {
        updatedContent: newCode,
        summary,
        modelUsed: result.modelUsed,
        thinkingLevel: result.thinkingLevel,
      });
      return true;
    }

    sendJson(res, 404, { error: "API route not found" });
    return true;
  } catch (err: any) {
    console.error("API Error:", err);
    sendJson(res, 500, {
      error: err.message || "Internal server error occurred while invoking agent intelligence",
    });
    return true;
  }
}
