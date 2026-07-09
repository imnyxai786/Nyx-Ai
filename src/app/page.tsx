import React from "react";
import Link from "next/link";
import { GlobeIcon, CodeIcon, TerminalIcon, CpuIcon, LayersIcon } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";

const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-editor-surface text-editor-text font-sans">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-4 border-b border-editor-border bg-editor-surface/80 backdrop-blur-sm sticky top-0">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-editor-accent-purple flex items-center justify-center text-xs font-bold text-white">N</div>
          <span className="font-mono font-semibold text-white text-sm">Nyx AI</span>
        </div>
        <nav className="flex items-center space-x-6 text-sm">
          <Link href="/pricing" className="text-editor-text-dim hover:text-white transition-colors">Pricing</Link>
          <Link href="/dashboard" className="px-3 py-1 bg-editor-surface-2 border border-editor-border text-white rounded text-xs hover:border-editor-text-subtle transition-colors">
            Launch Editor
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center px-4 py-24 text-center max-w-6xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight text-white max-w-4xl">
          The AI-First Code Editor of the Future
        </h1>
        <p className="text-xl text-editor-text-dim mb-12 max-w-2xl">
          Unparalleled intelligence. Editor-grade autocomplete, custom MCP clients, and deep inline diagnostics.
        </p>

        {/* Mockup */}
        <div className="w-full max-w-4xl bg-editor-surface border border-editor-border rounded-lg shadow-2xl overflow-hidden text-left mb-24">
          <div className="flex items-center px-4 py-2 border-b border-editor-border bg-editor-surface-2 gap-2">
            <div className="w-3 h-3 bg-editor-border rounded-full" />
            <span className="text-xs text-editor-text-dim font-mono">main.ts</span>
          </div>
          <div className="p-6 bg-editor-surface">
            <CodeBlock
              code={`import { AI } from 'nyx-ai';\n\nconst nyx = new AI();\n\nasync function generateCode(prompt: string) {\n  const result = await nyx.complete(prompt);\n  console.log(result.code);\n}`}
              language="typescript"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;