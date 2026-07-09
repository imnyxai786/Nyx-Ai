"use client";

import React, { useEffect, useState } from 'react';
import { createHighlighter, Highlighter } from 'shiki';

interface CodeBlockProps {
  code: string;
  language: string;
}

// Global cache to avoid re-initializing highlighter on every component mount
let highlighter: Highlighter | null = null;

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    async function highlight() {
      // 1. Initialize highlighter only once
      if (!highlighter) {
        highlighter = await createHighlighter({
          themes: ['vitesse-dark'],
          langs: [language as any],
        });
      }

      // 2. Generate HTML
      const result = highlighter.codeToHtml(code, {
        lang: language,
        theme: 'vitesse-dark',
      });
      
      setHtml(result);
    }

    highlight();
  }, [code, language]);

  // 3. Render raw code while highlighting, or empty div to prevent layout shift
  if (!html) {
    return <pre className="text-sm leading-5 font-mono p-4">{code}</pre>;
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="text-sm leading-5 font-mono"
    />
  );
};

export default CodeBlock;