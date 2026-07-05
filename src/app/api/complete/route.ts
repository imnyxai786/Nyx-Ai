import { NextRequest, NextResponse } from "next/server";

const COMPLETE_SYSTEM = `You are Nyx Complete, a hyper-fast inline code completion engine. You receive the code context around the cursor and must return ONLY the short code snippet that should be inserted at the cursor position. Rules:
- Return ONLY the completion text, no explanations, no markdown, no backticks.
- Keep completions short: 1-3 lines max, ideally just the rest of the current line.
- Match the existing code style, indentation, and naming conventions.
- If you can predict a full block (like a function body or JSX closing), you may include newlines but keep it concise.
- Never repeat code that already exists before the cursor.
- If you cannot confidently predict what comes next, return an empty string.`;

interface CompleteRequest {
  content: string;
  cursorLine: number;
  cursorColumn: number;
  language: string;
  fileName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, cursorLine, cursorColumn, language, fileName } =
      body as CompleteRequest;

    if (typeof content !== "string" || !cursorLine || !cursorColumn) {
      return NextResponse.json(
        { error: "content, cursorLine, and cursorColumn are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const completeModel =
      process.env.NYX_COMPLETE_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini";

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Build a focused prefix/suffix window around the cursor
    const lines = content.split("\n");
    const cursorLineIdx = cursorLine - 1;

    const startLine = Math.max(0, cursorLineIdx - 40);
    const endLine = Math.min(lines.length, cursorLineIdx + 11);

    const prefixLines = lines.slice(startLine, cursorLineIdx);
    const currentLine = lines[cursorLineIdx] || "";
    const prefixOnCurrentLine = currentLine.slice(0, cursorColumn - 1);
    const suffixOnCurrentLine = currentLine.slice(cursorColumn - 1);
    const suffixLines = lines.slice(cursorLineIdx + 1, endLine);

    const prefix = [...prefixLines, prefixOnCurrentLine].join("\n");
    const suffix = [suffixOnCurrentLine, ...suffixLines].join("\n");

    const langLabel =
      language === "typescript"
        ? "TypeScript/TSX"
        : language === "javascript"
          ? "JavaScript/JSX"
          : language;

    const userPrompt = `File: ${fileName || "untitled"} (${langLabel})

=== CODE BEFORE CURSOR ===
${prefix}
=== CODE AFTER CURSOR ===
${suffix}

Complete the code at the cursor position. Return ONLY the text to insert.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: completeModel,
        messages: [
          { role: "system", content: COMPLETE_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 150,
        stop: ["\n\n\n", "=== CODE"],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Complete API error:", response.status, errorData);
      return NextResponse.json({ completion: "" }, { status: 200 });
    }

    const data = await response.json();
    const completion = data.choices?.[0]?.message?.content?.trim() ?? "";

    return NextResponse.json({ completion });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ completion: "" });
    }
    console.error("Complete API error:", error);
    return NextResponse.json({ completion: "" });
  }
}