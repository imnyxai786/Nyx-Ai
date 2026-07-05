import { useEffect, useRef, useCallback } from "react";
import type * as Monaco from "monaco-editor";

interface UseInlineCompletionOptions {
  editor: Monaco.editor.IStandaloneCodeEditor | null;
  monaco: typeof Monaco | null;
  fileName?: string;
  language?: string;
  enabled?: boolean;
}

export function useInlineCompletion({
  editor,
  monaco,
  fileName,
  language,
  enabled = true,
}: UseInlineCompletionOptions) {
  const providerRef = useRef<Monaco.IDisposable | null>(null);
  const fetchingRef = useRef(false);

  const fetchCompletion = useCallback(
    async (
      content: string,
      cursorLine: number,
      cursorColumn: number,
      lang: string,
      fname: string
    ): Promise<string> => {
      try {
        fetchingRef.current = true;
        const res = await fetch("/api/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            cursorLine,
            cursorColumn,
            language: lang,
            fileName: fname,
          }),
        });

        if (!res.ok) return "";

        const data = await res.json();
        return data.completion || "";
      } catch {
        return "";
      } finally {
        fetchingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (!editor || !monaco || !enabled) {
      if (providerRef.current) {
        providerRef.current.dispose();
        providerRef.current = null;
      }
      return;
    }

    // Register the inline completions provider for all languages
    const provider = monaco.languages.registerInlineCompletionsProvider("*", {
      provideInlineCompletions: async (
        model: Monaco.editor.ITextModel,
        position: Monaco.Position,
        _context: Monaco.languages.InlineCompletionContext,
        token: Monaco.CancellationToken
      ) => {
        if (fetchingRef.current) {
          return { items: [] };
        }

        const content = model.getValue();
        const cursorLine = position.lineNumber;
        const cursorColumn = position.column;
        const lang = language || "plaintext";
        const fname = fileName || "untitled";

        const completion = await fetchCompletion(
          content,
          cursorLine,
          cursorColumn,
          lang,
          fname
        );

        if (!completion || token.isCancellationRequested) {
          return { items: [] };
        }

        return {
          items: [
            {
              insertText: completion,
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              },
            },
          ],
        };
      },
      disposeInlineCompletions: () => {},
    });

    providerRef.current = provider;

    return () => {
      provider.dispose();
      providerRef.current = null;
    };
  }, [editor, monaco, fileName, language, enabled, fetchCompletion]);

  return {
    isFetching: fetchingRef.current,
  };
}