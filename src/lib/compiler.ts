// ── In-Browser Compilation Engine ──────────────────────────────────────────
// Reads workspace file strings, evaluates HTML/CSS/JS client-side,
// and produces a complete HTML document string for the sandbox iframe.
// Zero server cost — everything runs client-side.

import type { WorkspaceFile } from "@/store/workspace";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CompilationResult {
  html: string;          // The full HTML document to render in the iframe
  entryFile: string;     // The path of the entry file used
  cssFiles: string[];    // Paths of CSS files included
  jsFiles: string[];     // Paths of JS/TS files included
  htmlFiles: string[];   // Paths of HTML files found
  warnings: string[];    // Any warnings during compilation
  errors: string[];      // Any errors during compilation
  fileCount: number;     // Total number of files processed
  totalSize: number;     // Total size of all files in bytes
}

// ── Iframe Console Interception Script ─────────────────────────────────────
// This script is injected into the sandbox iframe to capture console output
// and pipe it back to the parent window via postMessage.

const IFRAME_CONSOLE_SCRIPT = `
<script>
(function() {
  const __nyx_originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  function __nyx_sendToParent(level, args) {
    try {
      const message = Array.prototype.slice.call(args).map(function(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); }
          catch(e) { return String(arg); }
        }
        return String(arg);
      }).join(' ');
      window.parent.postMessage({
        type: '__nyx_console',
        level: level,
        message: message
      }, '*');
    } catch(e) {}
  }

  console.log = function() {
    __nyx_originalConsole.log.apply(console, arguments);
    __nyx_sendToParent('log', arguments);
  };
  console.warn = function() {
    __nyx_originalConsole.warn.apply(console, arguments);
    __nyx_sendToParent('warn', arguments);
  };
  console.error = function() {
    __nyx_originalConsole.error.apply(console, arguments);
    __nyx_sendToParent('error', arguments);
  };
  console.info = function() {
    __nyx_originalConsole.info.apply(console, arguments);
    __nyx_sendToParent('info', arguments);
  };

  // Capture unhandled errors
  window.addEventListener('error', function(e) {
    __nyx_sendToParent('error', ['Uncaught: ' + (e.message || e) + (e.filename ? ' (' + e.filename + ':' + (e.lineno || '?') + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function(e) {
    __nyx_sendToParent('error', ['Unhandled Promise Rejection: ' + (e.reason || e)]);
  });

  // Signal ready
  window.parent.postMessage({ type: '__nyx_console', level: 'info', message: '⚡ Sandbox initialized — console output captured' }, '*');
})();
<\/script>
`;

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Simple JSX-like transpilation for basic React patterns.
 * Strips TypeScript type annotations and converts JSX to h() calls.
 * This is a lightweight approach — not a full Babel replacement.
 */
function transpileJsx(code: string): string {
  let result = code;

  // Remove TypeScript type imports
  result = result.replace(/import\s+type\s+[^;]+;?/g, "");

  // Remove TypeScript interface/type declarations
  result = result.replace(/(?:export\s+)?(?:interface|type)\s+\w+[^{]*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, "");

  // Remove TypeScript type annotations on function params (simple cases)
  result = result.replace(/:\s*(?:React\.)?(?:ReactNode|JSX\.Element|string|number|boolean|void|null|undefined)(?:\s*\|\s*(?:React\.)?(?:ReactNode|JSX\.Element|string|number|boolean|void|null|undefined))*[,)\]]/g, (match) => {
    return match.charAt(0) === ":" ? match.charAt(match.length - 1) : match;
  });

  // Remove `as Type` assertions
  result = result.replace(/\s+as\s+\w+/g, "");

  // Remove React default exports that reference components
  result = result.replace(/export\s+default\s+function\s+(\w+)/g, "function $1");

  // Remove named exports
  result = result.replace(/export\s+(function|const|let|var|class)/g, "$1");

  // Remove "use client" / "use server" directives
  result = result.replace(/"use client"/g, "");
  result = result.replace(/"use server"/g, "");
  result = result.replace(/'use client'/g, "");
  result = result.replace(/'use server'/g, "");

  return result.trim();
}

/**
 * Detects basic syntax issues in code content.
 * Returns an array of error messages.
 */
function detectErrors(files: WorkspaceFile[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    const ext = file.path.split(".").pop()?.toLowerCase() ?? "";
    if (!["js", "jsx", "ts", "tsx"].includes(ext)) continue;

    // Check for unclosed brackets (very basic)
    const opens = (file.content.match(/[({[]/g) || []).length;
    const closes = (file.content.match(/[)}\]]/g) || []).length;
    if (Math.abs(opens - closes) > 2) {
      errors.push(`${file.path}: Possible unmatched brackets (${opens} open, ${closes} close)`);
    }

    // Check for common React import issues
    if (
      file.content.includes("useState") &&
      !file.content.includes("import") &&
      !file.content.includes("React")
    ) {
      errors.push(`${file.path}: Uses useState but may be missing React import`);
    }
  }

  return errors;
}

// ── Main Compiler ─────────────────────────────────────────────────────────

/**
 * Compiles workspace files into a single HTML document string
 * that can be rendered in a sandbox iframe via `srcdoc`.
 */
export function compileWorkspace(files: WorkspaceFile[]): CompilationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const cssFiles: string[] = [];
  const jsFiles: string[] = [];
  const htmlFiles: string[] = [];

  const totalSize = files.reduce((sum, f) => sum + new Blob([f.content]).size, 0);

  // Run basic error detection
  const detectedErrors = detectErrors(files);
  errors.push(...detectedErrors);

  // Categorize files
  const htmlFileMap = new Map<string, string>();
  const cssFileMap = new Map<string, string>();
  const jsFileMap = new Map<string, string>();

  for (const file of files) {
    const ext = file.path.split(".").pop()?.toLowerCase() ?? "";

    switch (ext) {
      case "html":
        htmlFileMap.set(file.path, file.content);
        htmlFiles.push(file.path);
        break;
      case "css":
      case "scss":
        cssFileMap.set(file.path, file.content);
        cssFiles.push(file.path);
        break;
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        jsFileMap.set(file.path, file.content);
        jsFiles.push(file.path);
        break;
      case "json":
        // JSON files are not directly executable but may be referenced
        break;
      default:
        break;
    }
  }

  // ── Strategy 1: If there's an index.html, use it as the entry point ──
  const indexHtml = htmlFileMap.get("index.html") ?? htmlFileMap.get("public/index.html");

  if (indexHtml) {
    let html = indexHtml;

    // Inject CSS files
    const styleTags = Array.from(cssFileMap.entries())
      .map(([path, content]) => `<!-- ${path} -->\n<style>\n${content}\n</style>`)
      .join("\n\n");

    // Inject JS files
    const scriptTags = Array.from(jsFileMap.entries())
      .map(([path, content]) => {
        const transpiled = transpileJsx(content);
        return `<!-- ${path} -->\n<script>\n${transpiled}\n<\/script>`;
      })
      .join("\n\n");

    // Insert styles before </head> and scripts before </body>
    if (styleTags) {
      html = html.replace("</head>", `${styleTags}\n</head>`);
    }
    // Inject console interception before other scripts
    if (scriptTags) {
      html = html.replace("</body>", `${IFRAME_CONSOLE_SCRIPT}\n${scriptTags}\n</body>`);
    } else {
      html = html.replace("</body>", `${IFRAME_CONSOLE_SCRIPT}\n</body>`);
    }

    return {
      html,
      entryFile: indexHtml ? "index.html" : htmlFiles[0],
      cssFiles,
      jsFiles,
      htmlFiles,
      warnings,
      errors,
      fileCount: files.length,
      totalSize,
    };
  }

  // ── Strategy 2: Generate an HTML document from workspace files ──

  // Collect all CSS
  const allCss = Array.from(cssFileMap.entries())
    .map(([path, content]) => `/* ${path} */\n${content}`)
    .join("\n\n");

  // Collect and transpile all JS
  const allJs = Array.from(jsFileMap.entries())
    .map(([path, content]) => {
      const transpiled = transpileJsx(content);
      return `// ${path}\n${transpiled}`;
    })
    .join("\n\n");

  // Try to find a "main" component to render
  const mainComponent = findMainComponent(files);

  if (mainComponent) {
    // We have a React-like project — set up React + ReactDOM
    const reactHtml = generateReactSandbox(allCss, allJs, mainComponent, files);
    return {
      html: reactHtml,
      entryFile: mainComponent.path,
      cssFiles,
      jsFiles,
      htmlFiles,
      warnings,
      errors,
      fileCount: files.length,
      totalSize,
    };
  }

  // ── Strategy 3: Plain HTML/CSS/JS project ──

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nyx Preview</title>
  ${allCss ? `<style>\n${allCss}\n</style>` : ""}
</head>
<body>
  <div id="root"></div>
  ${IFRAME_CONSOLE_SCRIPT}
  ${allJs ? `<script>\n${allJs}\n<\/script>` : ""}
</body>
</html>`;

  return {
    html,
    entryFile: htmlFiles[0] || jsFiles[0] || cssFiles[0] || "workspace",
    cssFiles,
    jsFiles,
    htmlFiles,
    warnings,
    errors,
    fileCount: files.length,
    totalSize,
  };
}

// ── React Sandbox Generator ────────────────────────────────────────────────

interface ComponentInfo {
  name: string;
  path: string;
  content: string;
}

/**
 * Finds the main application component from workspace files.
 */
function findMainComponent(files: WorkspaceFile[]): ComponentInfo | null {
  const entryPatterns = [
    /App\.(tsx|jsx|ts|js)$/,
    /page\.(tsx|jsx|ts|js)$/,
    /Main\.(tsx|jsx|ts|js)$/,
    /index\.(tsx|jsx|ts|js)$/,
  ];

  for (const pattern of entryPatterns) {
    const match = files.find((f) => pattern.test(f.path));
    if (match) {
      const name = match.name.replace(/\.(tsx|jsx|ts|js)$/, "");
      return { name, path: match.path, content: match.content };
    }
  }

  const anyComponent = files.find(
    (f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx")
  );
  if (anyComponent) {
    const name = anyComponent.name.replace(/\.(tsx|jsx)$/, "");
    return { name, path: anyComponent.path, content: anyComponent.content };
  }

  return null;
}

/**
 * Generates a complete HTML document that loads React from CDN
 * and renders the main component in the sandbox.
 */
function generateReactSandbox(
  allCss: string,
  allJs: string,
  mainComponent: ComponentInfo,
  files: WorkspaceFile[]
): string {
  // Collect all component definitions
  const componentFiles = files.filter(
    (f) =>
      (f.path.endsWith(".tsx") || f.path.endsWith(".jsx") ||
       f.path.endsWith(".ts") || f.path.endsWith(".js")) &&
      !f.path.includes("node_modules") &&
      !f.path.includes(".config.")
  );

  // Build component script blocks
  const componentScripts = componentFiles.map((f) => {
    const transpiled = transpileJsx(f.content);
    return transpiled;
  }).join("\n\n");

  // Extract CSS content from globals.css and other CSS files
  const cssContent = files
    .filter((f) => f.path.endsWith(".css"))
    .map((f) => {
      let content = f.content
        .replace(/@tailwind\s+(base|components|utilities);/g, "/* @tailwind $1 — processed by Nyx */")
        .replace(/@import\s+[^;]+;/g, "/* @import processed by Nyx */");
      return content;
    })
    .join("\n\n");

  // Generate a sandbox HTML with React from CDN
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nyx Live Preview</title>
  <style>
    /* Base reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }

    /* Workspace CSS */
    ${cssContent}
  </style>

  <!-- React & ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>

  <!-- Babel Standalone for JSX transpilation in the browser -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
</head>
<body>
  <div id="root"></div>

  ${IFRAME_CONSOLE_SCRIPT}

  <script type="text/babel" data-presets="react">
    // ── Nyx Sandbox Runtime ──────────────────────────────────────
    const __nyx_modules = {};
    const __nyx_exports = {};

    function __nyx_require(path) {
      const resolved = path.replace(/^@\//, '').replace(/^\.\/$/, '');
      if (__nyx_modules[resolved]) return __nyx_modules[resolved];
      if (__nyx_modules[path]) return __nyx_modules[path];
      return {};
    }

    function __nyx_register(path, factory) {
      __nyx_modules[path] = factory();
    }

    // ── Mock External Dependencies ───────────────────────────────
    const lucideReact = new Proxy({}, {
      get: (target, prop) => {
        if (prop === '__esModule') return false;
        return (props) => React.createElement('span', {
          ...props,
          'data-lucide': prop,
          style: { display: 'inline-block', width: props?.size || 16, height: props?.size || 16 }
        }, prop);
      }
    });

    __nyx_modules['lucide-react'] = lucideReact;
    __nyx_modules['@monaco-editor/react'] = { default: () => null };
    __nyx_modules['next/link'] = { default: ({ children, ...props }) => React.createElement('a', props, children) };
    __nyx_modules['next/image'] = { default: ({ src, alt, ...props }) => React.createElement('img', { src, alt, ...props }) };
    __nyx_modules['next/navigation'] = { useRouter: () => ({ push: () => {}, back: () => {} }), usePathname: () => '/', useParams: () => ({}) };
    __nyx_modules['next/headers'] = { cookies: () => ({ get: () => null }), headers: () => ({ get: () => null }) };

    // ── Workspace Components ─────────────────────────────────────
    ${componentScripts}

    // ── Render Main Component ─────────────────────────────────────
    const root = ReactDOM.createRoot(document.getElementById('root'));
    try {
      if (typeof ${mainComponent.name} !== 'undefined') {
        root.render(React.createElement(${mainComponent.name}));
      } else {
        root.render(React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#1e1e1e',
            color: '#cccccc',
            fontFamily: 'monospace',
            flexDirection: 'column',
            gap: '12px'
          }
        },
          React.createElement('div', { style: { fontSize: '24px' } }, '⚡ Nyx Preview'),
          React.createElement('div', { style: { fontSize: '13px', color: '#858585' } }, 'Component: ${mainComponent.name}'),
          React.createElement('div', { style: { fontSize: '11px', color: '#6a6a6a' } }, 'Edit your files and see changes live')
        ));
      }
    } catch (err) {
      root.render(React.createElement('div', {
        style: {
          padding: '20px',
          background: '#1e1e1e',
          color: '#f44747',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-wrap'
        }
      }, '❌ Render Error:\\n' + err.message));
    }
  <\/script>
</body>
</html>`;

  return html;
}

// ── Quick Compile (for auto-refresh on file changes) ──────────────────────

let lastCompileHash = "";
let cachedResult: CompilationResult | null = null;

/**
 * Quick hash of file contents for change detection.
 */
function hashFiles(files: WorkspaceFile[]): string {
  return files
    .map((f) => `${f.path}:${f.content.length}`)
    .join("|");
}

/**
 * Compiles only if files have changed since last compilation.
 * Returns cached result if unchanged.
 */
export function compileIfChanged(files: WorkspaceFile[]): CompilationResult {
  const hash = hashFiles(files);
  if (hash === lastCompileHash && cachedResult) {
    return cachedResult;
  }
  lastCompileHash = hash;
  cachedResult = compileWorkspace(files);
  return cachedResult;
}

/**
 * Forces a recompilation on next call.
 */
export function invalidateCompilation(): void {
  lastCompileHash = "";
  cachedResult = null;
}