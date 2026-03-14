"use client";

import Link from "next/link";
import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
} from "./hooks";

export default function Home() {
  const toolOutput = useWidgetProps<{
    name?: string;
    result?: { structuredContent?: { name?: string } };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const isChatGptApp = useIsChatGptApp();

  const name = toolOutput?.result?.structuredContent?.name || toolOutput?.name;

  return (
    <div
      className="relative min-h-screen font-sans overflow-hidden bg-background text-foreground"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      {/* Animated gradient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite 2s",
          }}
        />
      </div>

      {/* Fullscreen toggle */}
      {displayMode !== "fullscreen" && (
        <button
          aria-label="Enter fullscreen"
          className="fixed top-4 right-4 z-50 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 shadow-lg ring-1 ring-slate-900/10 dark:ring-white/10 p-2.5 hover:bg-white dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer backdrop-blur-sm hover:scale-105"
          onClick={() => requestDisplayMode("fullscreen")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 py-16 sm:px-12 sm:py-24">
        {/* ChatGPT app detection banner */}
        {!isChatGptApp && (
          <div
            className="mb-10 w-full max-w-2xl rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/70 dark:bg-blue-950/40 px-5 py-4 backdrop-blur-sm"
            style={{ animation: "fadeInDown 0.5s ease-out" }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/60">
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  AI Session Required
                </p>
                <p className="mt-1 text-sm text-blue-800/80 dark:text-blue-200/70">
                  This app relies on data from an AI session. No{" "}
                  <a
                    href="https://developers.openai.com/apps-sdk/reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono underline decoration-blue-400/50 hover:decoration-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300 transition-colors"
                  >
                    window.openai
                  </a>{" "}
                  property detected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero section */}
        <div
          className="flex flex-col items-center text-center max-w-3xl"
          style={{ animation: "fadeInUp 0.6s ease-out" }}
        >
          {/* Logo mark */}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
              />
            </svg>
          </div>

          <h1 className="text-5xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Blackbox AI
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-foreground/60 max-w-xl leading-relaxed">
            Your intelligent AI assistant powered by the Model Context Protocol.
            Build, integrate, and deploy AI-powered experiences.
          </p>
        </div>

        {/* Feature cards */}
        <div
          className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3"
          style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
        >
          {/* MCP Server */}
          <div className="group relative rounded-2xl border border-foreground/[0.06] bg-white/50 dark:bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:scale-110">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground tracking-tight">
              MCP Server
            </h3>
            <p className="mt-2 text-sm text-foreground/50 leading-relaxed">
              Built-in Model Context Protocol server at{" "}
              <code className="font-mono text-xs bg-foreground/[0.05] px-1.5 py-0.5 rounded">
                /mcp
              </code>
            </p>
          </div>

          {/* AI Integration */}
          <div className="group relative rounded-2xl border border-foreground/[0.06] bg-white/50 dark:bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-transform duration-300 group-hover:scale-110">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground tracking-tight">
              AI Integration
            </h3>
            <p className="mt-2 text-sm text-foreground/50 leading-relaxed">
              Seamless integration with ChatGPT and OpenAI&apos;s app ecosystem.
            </p>
          </div>

          {/* Developer Tools */}
          <div className="group relative rounded-2xl border border-foreground/[0.06] bg-white/50 dark:bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 hover:-translate-y-0.5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 transition-transform duration-300 group-hover:scale-110">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground tracking-tight">
              Developer Tools
            </h3>
            <p className="mt-2 text-sm text-foreground/50 leading-relaxed">
              TypeScript-first with Next.js, Zod validation, and hot reload.
            </p>
          </div>
        </div>

        {/* Status card */}
        <div
          className="mt-12 w-full max-w-2xl rounded-2xl border border-foreground/[0.06] bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden"
          style={{ animation: "fadeInUp 0.8s ease-out 0.2s both" }}
        >
          <div className="border-b border-foreground/[0.06] px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
              Session Status
            </h2>
          </div>
          <div className="divide-y divide-foreground/[0.04]">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-foreground/50">Tool Call Name</span>
              <span className="font-mono text-sm font-medium text-foreground/80 bg-foreground/[0.04] px-3 py-1 rounded-lg">
                {name ?? (
                  <span className="text-foreground/30 italic">
                    awaiting session...
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-foreground/50">MCP Endpoint</span>
              <span className="font-mono text-sm font-medium text-foreground/80 bg-foreground/[0.04] px-3 py-1 rounded-lg">
                /mcp
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-sm text-foreground/50">Status</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                    style={{ animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Online
              </span>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          style={{ animation: "fadeInUp 0.9s ease-out 0.3s both" }}
        >
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 hover:brightness-110"
            prefetch={false}
            href="/custom-page"
          >
            Explore Pages
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/10 bg-white/60 dark:bg-white/[0.04] px-7 py-3 text-sm font-semibold text-foreground/80 backdrop-blur-sm transition-all duration-200 hover:border-foreground/20 hover:bg-white/80 dark:hover:bg-white/[0.08] hover:-translate-y-0.5"
            href="https://modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            MCP Documentation
          </a>
        </div>

        {/* Footer */}
        <div
          className="mt-20 text-center text-xs text-foreground/30"
          style={{ animation: "fadeInUp 1s ease-out 0.4s both" }}
        >
          <p>
            Built with Next.js, Tailwind CSS &amp; the Model Context Protocol
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.05);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes ping {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
