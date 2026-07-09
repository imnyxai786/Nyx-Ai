import React from "react";
import Link from "next/link";
import { GlobeIcon, CodeIcon, TerminalIcon, CpuIcon, LayersIcon } from "lucide-react";
import CodeBlock from "@/components/CodeBlock";

const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-editor-surface text-editor-text overflow-hidden font-sans">
      {/* Subtle editor-style grid background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1f1f23_1px,transparent_1px),linear-gradient(to_bottom,#1f1f23_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

      {/* Subtle radial light leak to represent the workspace compiler state */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[rgba(137,106,216,0.08)] to-transparent rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Header / Nav */}
      <header className="relative z-10 flex justify-between items-center px-8 py-4 border-b border-editor-border bg-editor-surface/80 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-editor-accent-purple flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-editor-accent-purple/50">
            N
          </div>
          <span className="font-mono font-semibold tracking-tight text-white text-sm">Nyx AI</span>
        </div>
        <nav className="flex items-center space-x-6 text-sm">
          <Link href="/pricing" className="text-editor-text-dim hover:text-white transition-colors duration-150">
            Pricing
          </Link>
          <Link href="/terms-of-service" className="text-editor-text-dim hover:text-white transition-colors duration-150">
            Terms
          </Link>
          <Link href="/privacy-policy" className="text-editor-text-dim hover:text-white transition-colors duration-150">
            Privacy
          </Link>
          <Link href="/dashboard" className="px-3 py-1 bg-editor-surface-2 border border-editor-border hover:border-editor-text-subtle text-white font-medium rounded text-xs transition-colors duration-150">
            Launch Editor
          </Link>
        </nav>
      </header>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-60px)] px-4 py-16 md:py-24 text-center max-w-6xl mx-auto">
        {/* Lab/Editor Status Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-editor-border bg-editor-surface-2/50 backdrop-blur-sm text-xs font-mono text-editor-text-dim mb-8">
          <span className="w-2 h-2 rounded-full bg-editor-accent-blue animate-pulse"></span>
          <span>v1.2.0-beta // Global AI Workspace</span>
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl md:text-7xl font-semibold mb-6 tracking-tight leading-none text-white max-w-4xl">
          The AI-First Code Editor of the Future
        </h1>
        <p className="text-lg md:text-xl text-editor-text-dim mb-10 max-w-2xl font-normal leading-relaxed">
          Unparalleled intelligence. Editor-grade autocomplete, custom MCP clients, and deep inline diagnostics. Built for elite software engineering.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-20 w-full justify-center">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center px-6 py-3 bg-editor-accent-blue hover:bg-blue-600 text-white font-medium rounded border border-blue-500/30 text-sm shadow-md transition-all duration-150">
              <CodeIcon className="w-4 h-4 mr-2" /> Launch Workspace
            </button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <button className="w-full flex items-center justify-center px-6 py-3 bg-editor-surface-2 border border-editor-border hover:border-editor-text-subtle text-editor-text hover:text-white font-medium rounded text-sm transition-all duration-150">
              <GlobeIcon className="w-4 h-4 mr-2" /> View Plans / Docs
            </button>
          </Link>
        </div>

        {/* Interactive Preview Mockup (Perfectly mimicking Cursor window aesthetics) */}
        <div className="w-full max-w-4xl bg-editor-surface border border-editor-border rounded-lg shadow-2xl overflow-hidden text-left mb-20">
          {/* Editor Header Bar */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-editor-border bg-editor-surface-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 bg-editor-border rounded-full flex items-center justify-center"></div>
              <div className="w-3 h-3 bg-editor-border rounded-full flex items-center justify-center"></div>
              <div className="w-3 h-3 bg-editor-border rounded-full flex items-center justify-center"></div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-editor-text-dim font-mono">
              <span>Nyx Workspace</span>
              <span className="text-editor-text-subtle">/</span>
              <span className="text-white">main.ts</span>
            </div>
            <div className="w-12"></div>
          </div>

          {/* Editor Body */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] min-h-[350px]">
            {/* Sidebar tab effect */}
            <div className="hidden md:flex flex-col border-r border-editor-border bg-editor-surface-2 p-3 font-mono text-xs text-editor-text-dim space-y-4 select-none">
              <div className="font-semibold uppercase tracking-wider text-[10px] text-editor-text-subtle">Workspace</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-editor-accent-purple">🗂️</span>
                  <span>src/</span>
                </div>
                <div className="flex items-center space-x-2 pl-4 text-white">
                  <span>📄</span>
                  <span>main.ts</span>
                </div>
                <div className="flex items-center space-x-2 pl-4">
                  <span>📄</span>
                  <span>components.ts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>⚙️</span>
                  <span>tsconfig.json</span>
                </div>
              </div>
            </div>

            {/* Code Block Content */}
            <div className="p-6 bg-editor-surface overflow-hidden font-mono text-sm leading-6">
              {/* Note: shiki's standard behavior wraps everything in its own styled pre, so CodeBlock will replace it */}
              <CodeBlock
                code={`import { AI } from 'nyx-ai';

const nyx = new AI();

async function generateCode(prompt: string) {
  const result = await nyx.complete(prompt, {
    model: 'glm-5',
    temperature: 0.7,
  });
  console.log(result.code);
}

generateCode('Create a React component for a dark mode button.');`}
                language="typescript"
              />
              <div className="flex items-center justify-between text-editor-text-subtle text-xs mt-6 pt-4 border-t border-editor-border">
                <span>Ln 12, Col 1</span>
                <span>TypeScript</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid with clean workspace aesthetics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 border border-editor-border rounded-lg bg-editor-surface-2/40 hover:border-editor-accent-purple/30 transition-colors duration-150">
            <CpuIcon className="w-5 h-5 text-editor-accent-purple mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">High-Fidelity Autocomplete</h3>
            <p className="text-sm text-editor-text-dim leading-relaxed">
              Ultra-fast model serving predictions inline, tailored dynamically to your codebase semantics.
            </p>
          </div>
          <div className="p-6 border border-editor-border rounded-lg bg-editor-surface-2/40 hover:border-editor-accent-blue/30 transition-colors duration-150">
            <TerminalIcon className="w-5 h-5 text-editor-accent-blue mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">Integrated Terminal & MCP</h3>
            <p className="text-sm text-editor-text-dim leading-relaxed">
              Run external tools directly inside your editor surface through standardized Model Context Protocols.
            </p>
          </div>
          <div className="p-6 border border-editor-border rounded-lg bg-editor-surface-2/40 hover:border-editor-text-dim/30 transition-colors duration-150">
            <LayersIcon className="w-5 h-5 text-editor-text-dim mb-4" />
            <h3 className="text-base font-semibold text-white mb-2">Subtle Editor Surfaces</h3>
            <p className="text-sm text-editor-text-dim leading-relaxed">
              Clean panel boundaries, ultra-crisp line rendering, and high contrast design for deep work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
