"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
} from "./hooks";

function MCPAuthHandler() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if this is an OAuth authorization request from ChatGPT
    const responseType = searchParams.get('response_type');
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');
    const scope = searchParams.get('scope');
    const codeChallenge = searchParams.get('code_challenge');
    const codeChallengeMethod = searchParams.get('code_challenge_method');
    const resource = searchParams.get('resource');
    
    if (responseType === 'code' && clientId && redirectUri) {
      // This is an OAuth authorization request from ChatGPT
      // Generate MCP session ID if not provided
      let mcpSessionId = searchParams.get('mcp_session_id');
      if (!mcpSessionId) {
        mcpSessionId = `mcp_${crypto.randomUUID()}`;
      }
      
      // Redirect the entire request to Better Auth server
      const betterAuthUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
      const authUrl = new URL('/', betterAuthUrl);
      
      // Add MCP session tracking
      authUrl.searchParams.set('mcp_session_id', mcpSessionId);
      authUrl.searchParams.set('mcp_auth_required', 'true');
      
      // Forward all OAuth parameters
      authUrl.searchParams.set('response_type', responseType);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      if (state) authUrl.searchParams.set('state', state);
      if (scope) authUrl.searchParams.set('scope', scope);
      if (codeChallenge) authUrl.searchParams.set('code_challenge', codeChallenge);
      if (codeChallengeMethod) authUrl.searchParams.set('code_challenge_method', codeChallengeMethod);
      if (resource) authUrl.searchParams.set('resource', resource);
      
      console.log('[MCP OAuth] Redirecting to Better Auth:', authUrl.toString());
      window.location.href = authUrl.toString();
      return;
    }
    
    // Original MCP auth flow
    const mcpSessionId = searchParams.get('mcp_session_id');
    const mcpAuthRequired = searchParams.get('mcp_auth_required');
    
    if (mcpSessionId && mcpAuthRequired === 'true') {
      // Redirect to Better Auth sign-in with callback
      const betterAuthUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
      const callbackUrl = `${window.location.origin}/api/auth/mcp-callback?mcp_session_id=${mcpSessionId}`;

      const authUrl = new URL('/', betterAuthUrl);
      authUrl.searchParams.set('mcp_session_id', mcpSessionId);
      authUrl.searchParams.set('mcp_auth_required', 'true');
      authUrl.searchParams.set('callbackURL', callbackUrl);
      
      // Redirect to Better Auth
      window.location.href = authUrl.toString();
    }
  }, [searchParams]);
  
  return null;
}

function HomeContent() {
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
      className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center p-8 pb-20 gap-16 sm:p-20"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      {displayMode !== "fullscreen" && (
        <button
          aria-label="Enter fullscreen"
          className="fixed top-4 right-4 z-50 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-lg ring-1 ring-slate-900/10 dark:ring-white/10 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {!isChatGptApp && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 w-full">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"
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
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  This app relies on data from an AI session.
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                  No{" "}
                  <a
                    href="https://developers.openai.com/apps-sdk/reference"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-mono bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded"
                  >
                    window.openai
                  </a>{" "}
                  property detected
                </p>
              </div>
            </div>
          </div>
        )}

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Welcome to Blackbox AI
          </li>
          <li className="mb-2 tracking-[-.01em]">
            Name returned from tool call: {name ?? "..."}
          </li>
          <li className="mb-2 tracking-[-.01em]">MCP server path: /mcp</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            prefetch={false}
            href="/custom-page"
          >
            Visit another page
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MCPAuthHandler />
      <HomeContent />
    </Suspense>
  );
}
