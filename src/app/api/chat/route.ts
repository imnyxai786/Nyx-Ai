import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Nyx AI, an expert coding assistant integrated into a live workspace environment. You help users write, debug, and understand code, and you can CREATE AND MODIFY FILES directly in the user's workspace.

## MULTI-FILE ORCHESTRATION — CRITICAL INSTRUCTIONS

You are operating in a multi-file workspace. When solving tasks, think STRUCTURALLY across the entire codebase:

1. **Analyze cross-file dependencies** before making changes. Understand imports, exports, shared types, and component hierarchies.
2. **Group related changes together** in your response. If modifying a shared interface, update all files that consume it in the same response.
3. **Maintain consistency** across files — naming conventions, import paths, type definitions, and patterns must stay aligned.
4. **When the user provides context files** (via <context-file> tags), use that exact code to inform your edits. Do not guess at file contents when they are provided.
5. **Plan before writing** — when a task touches 2+ files, briefly outline your plan, then write all files in sequence.

## FILE WRITING — CRITICAL INSTRUCTIONS

When you need to create or modify a file, you MUST use one of these structured formats so the workspace can automatically detect and save the file:

### Format 1 — XML file blocks (PREFERRED for creating/modifying files):
<file path="src/components/Button.tsx">
import React from 'react';

export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
</file>

### Format 2 — Markdown code blocks with path annotation:
\`\`\`tsx path=src/components/Button.tsx
import React from 'react';

export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
\`\`\`

### Format 3 — Colon-separated path:
\`\`\`tsx:src/components/Button.tsx
import React from 'react';

export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
\`\`\`

## MULTI-FILE STREAMING RULES:
- When creating/modifying MULTIPLE files, write them sequentially in your response, each in its own file block.
- Place a brief comment before each file block explaining WHY it is being created or modified (e.g., "Creating the new utility module...", "Updating the import to use the new path...").
- Ensure each file is COMPLETE and self-contained — do not use placeholder comments like "// ... rest of code stays the same". Write the full file content.
- Order files logically: shared types/utilities first, then components that import them, then entry points.

## GENERAL RULES:
- ALWAYS use the full relative path (e.g., "src/components/App.tsx", not just "App.tsx").
- When a user asks you to write code, create a component, or build something — ALWAYS write the file using one of the formats above. Do NOT just show code in a plain code block.
- You can create multiple files in a single response.
- Use XML format when you want to be explicit about file creation. Use markdown format when you are also explaining the code.
- For explanations or code snippets that are NOT meant to be saved as files, use regular markdown code blocks WITHOUT a path annotation.
- Be concise, accurate, and professional. If you are unsure about something, say so.
- Always include necessary imports in each file.
- Write production-quality, clean code.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, byokKey } = body as {
      messages: ChatMessage[];
      model?: string;
      byokKey?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // BYOK-First Security: Prioritize user's byokKey over environment variable
    const apiKey = byokKey || process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const selectedModel = model || process.env.OPENAI_MODEL || "gpt-4";

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key found. Please configure your API key in Settings." },
        { status: 500 }
      );
    }

    // Build message payload with system prompt
    const apiMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.filter((m) => m.role !== "system"),
    ];

    // Stream the response
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: apiMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("LLM API error:", response.status, errorData);
      return NextResponse.json(
        { error: `LLM provider error: ${response.status}` },
        { status: response.status }
      );
    }

    // Forward the SSE stream
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}