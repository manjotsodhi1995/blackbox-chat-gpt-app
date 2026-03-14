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
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in-up-delay-1 { animation: fadeInUp 0.6s ease-out 0.1s forwards; opacity: 0; }
        .animate-fade-in-up-delay-2 { animation: fadeInUp 0.6s ease-out 0.2s forwards; opacity: 0; }
        .animate-fade-in-up-delay-3 { animation: fadeInUp 0.6s ease-out 0.3s forwards; opacity: 0; }
        .animate-fade-in-up-delay-4 { animation: fadeInUp 0.6s ease-out 0.4s forwards; opacity: 0; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
      `}</style>

      <div
        className="font-sans relative min-h-screen overflow-hidden"
        style={{
          maxHeight,
          height: displayMode === "fullscreen" ? maxHeight : undefined,
        }}
      >
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-float absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-3xl" />
          <div className="animate-float absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-500/15 to-cyan-500/15 blur-3xl" style={{ animationDelay: "-2s" }} />
          <div className="animate-float absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-3xl" style={{ animationDelay: "-4s" }} />
        </div>

        {/* Fullscreen toggle */}
        {displayMode !== "fullscreen" && (
          <button
            aria-label="Enter fullscreen"
            className="fixed top-4 right-4 z-50 rounded-xl bg-white/80 dark:bg-white/10 backdrop-blur-md text-slate-600 dark:text-slate-300 shadow-lg shadow-black/5 ring-1 ring-slate-900/5 dark:ring-white/10 p-2.5 hover:bg-white dark:hover:bg-white/20 transition-all duration-200 cursor-pointer hover:scale-105"
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
        <div className="relative z-10 flex flex-col items-center px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
          {/* ChatGPT detection banner */}
          {!isChatGptApp && (
            <div className="animate-fade-in-up w-full max-w-2xl mb-8">
              <div className="rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 backdrop-blur-sm border border-amber-200/60 dark:border-amber-800/40 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-amber-600 dark:text-amber-400"
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
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Running outside AI session
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                      No{" "}
                      <a
                        href="https://developers.openai.com/apps-sdk/reference"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-amber-400/60 hover:decoration-amber-500 underline-offset-2 font-mono text-xs bg-amber-100/80 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-md"
                      >
                        window.openai
                      </a>{" "}
                      detected — this app relies on data from an AI session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero section */}
          <div className="animate-fade-in-up-delay-1 text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/80 dark:bg-violet-900/30 border border-violet-200/60 dark:border-violet-800/40 backdrop-blur-sm mb-6">
              <span className="animate-pulse-slow w-2 h-2 rounded-full bg-violet-500" />
              <span className="text-xs font-semibold tracking-wide uppercase text-violet-700 dark:text-violet-300">
                AI-Powered Platform
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-violet-800 to-slate-900 dark:from-white dark:via-violet-300 dark:to-white bg-clip-text text-transparent leading-tight pb-2">
              Blackbox AI
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              Your intelligent AI assistant with MCP server integration, built for seamless conversational experiences.
            </p>
          </div>

          {/* Status cards */}
          <div className="animate-fade-in-up-delay-2 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-16">
            {/* Connection status */}
            <div className="group rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-800/40">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${isChatGptApp ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-slate-300 dark:bg-slate-600"}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {isChatGptApp ? "Connected" : "Standalone"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isChatGptApp ? "AI session active" : "No AI session"}
              </p>
            </div>

            {/* Tool call result */}
            <div className="group rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-800/40">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${name ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" : "bg-amber-400 shadow-lg shadow-amber-400/30 animate-pulse"}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tool Call
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate font-mono">
                {name ?? "Awaiting..."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Name from response
              </p>
            </div>

            {/* MCP endpoint */}
            <div className="group rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-800/40">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  MCP Server
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 font-mono">
                /mcp
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Server endpoint
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="animate-fade-in-up-delay-3 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-16">
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 border border-violet-100 dark:border-violet-900/40 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">AI Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Intelligent conversational AI powered by advanced language models
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-blue-100 dark:border-blue-900/40 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">MCP Server</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Model Context Protocol server for tool calls and structured data
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/40 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0 4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0 4.179 2.25L12 22.5l-9.75-5.25 4.179-2.25" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Custom Pages</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Extensible page system for building rich interactive experiences
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="animate-fade-in-up-delay-4 flex flex-col sm:flex-row gap-3 items-center">
            <Link
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-sm h-12 px-8 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/20 dark:hover:shadow-white/20 hover:scale-105"
              prefetch={false}
              href="/custom-page"
            >
              Explore Custom Page
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              Built with Next.js &middot; Powered by Blackbox AI
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
