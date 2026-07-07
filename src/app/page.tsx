
import React from "react";
import Link from "next/link";
import { GlobeIcon, CodeIcon, GitPullRequestIcon } from "lucide-react"; // Example icons

const HomePage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-onyx text-gold overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-600 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-80 h-80 bg-deep-onyx rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8 text-center">
        {/* Hero Section */}
        <h1 className="text-7xl md:text-8xl font-extrabold mb-6 tracking-tight leading-none">
          <span className="block text-gold">Nyx AI</span>
          <span className="block text-gray-200 text-5xl md:text-6xl mt-4">Elite Global AI Laboratory</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl leading-relaxed">
          Architecting the future of code with unparalleled intelligence and anonymous precision. Built for developers, by AI.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link href="/dashboard">
            <button className="flex items-center justify-center px-8 py-4 bg-gold text-onyx font-bold rounded-lg text-lg shadow-lg hover:bg-amber-600 transition-colors duration-300 transform hover:scale-105">
              <CodeIcon className="w-6 h-6 mr-3" /> Download Beta / Launch Workspace
            </button>
          </Link>
          <Link href="/pricing">
            <button className="flex items-center justify-center px-8 py-4 border-2 border-gold text-gold font-bold rounded-lg text-lg shadow-lg hover:bg-gold hover:text-onyx transition-colors duration-300 transform hover:scale-105">
              <GlobeIcon className="w-6 h-6 mr-3" /> View Pricing / Read Docs
            </button>
          </Link>
        </div>

        {/* Interactive Preview Mockup */}
        <div className="w-full max-w-5xl bg-deep-onyx rounded-lg shadow-2xl border border-gray-700 p-6 opacity-90 backdrop-filter backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-sm text-gray-500">Nyx AI Workspace - main.ts</span>
            <div className="w-8"></div>
          </div>
          <div className="font-mono text-left text-sm text-gray-300">
            <pre>
              <code className="language-typescript">
{`1 <span className="text-vsc-token-keyword">import</span> { <span className="text-vsc-token-type">AI</span> } <span className="text-vsc-token-keyword">from</span> <span className="text-vsc-token-string">'nyx-ai'</span>;
2 
3 <span className="text-vsc-token-keyword">const</span> <span className="text-vsc-token-variable">nyx</span> = <span className="text-vsc-token-keyword">new</span> <span className="text-vsc-token-type">AI</span>();
4 
5 <span className="text-vsc-token-keyword">async function</span> <span className="text-vsc-token-function">generateCode</span>(<span className="text-vsc-token-variable">prompt</span>: <span className="text-vsc-token-type">string</span>) {
6   <span className="text-vsc-token-keyword">const</span> <span className="text-vsc-token-variable">result</span> = <span className="text-vsc-token-keyword">await</span> <span className="text-vsc-token-variable">nyx</span>.<span className="text-vsc-token-function">complete</span>(<span className="text-vsc-token-variable">prompt</span>, {
7     <span className="text-vsc-token-attr">model</span>: <span className="text-vsc-token-string">'glm-5'</span>,
8     <span className="text-vsc-token-attr">temperature</span>: <span className="text-vsc-token-number">0.7</span>,
9   });
10   <span className="text-vsc-token-function">console</span>.<span className="text-vsc-token-function">log</span>(<span className="text-vsc-token-variable">result</span>.<span className="text-vsc-token-variable">code</span>);
11 }
12 
13 <span className="text-vsc-token-function">generateCode</span>(<span className="text-vsc-token-string">'Create a React component for a dark mode button.'</span>);
14 `}
              </code>
            </pre>
            <div className="flex items-center justify-between text-gray-500 text-xs mt-4">
              <span>Ln 6, Col 15</span>
              <span>TypeScript</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
