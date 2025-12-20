"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useIsChatGptApp, useOpenExternal } from "../hooks";

function AuthContent() {
  const searchParams = useSearchParams();
  const isChatGptApp = useIsChatGptApp();
  const openExternal = useOpenExternal();
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const authenticated = searchParams.get("authenticated");
    
    if (success === "true" || authenticated === "true") {
      setStatus("success");
      setMessage("Authentication successful! You can now use the build_app tool.");
      
      // If in ChatGPT, close the window or notify parent
      if (isChatGptApp && window.openai) {
        // Wait a moment to show success message, then close
        setTimeout(() => {
          // Try to close the window if it was opened as a popup
          if (window.opener) {
            // Notify parent window that auth completed
            try {
              window.opener.postMessage({ type: "oauth_success", authenticated: true }, "*");
            } catch (e) {
              console.warn("Failed to post message to opener:", e);
            }
            // Close the popup window
            window.close();
          } else {
            // If not a popup, try to redirect back or notify ChatGPT
            try {
              // Try to send a message to ChatGPT if available
              if (window.openai.sendFollowUpMessage) {
                window.openai.sendFollowUpMessage({ 
                  prompt: "Authentication completed successfully. You can now build apps." 
                });
              }
            } catch (e) {
              console.warn("Failed to send follow-up message:", e);
            }
          }
        }, 2000);
      } else if (window.opener) {
        // Not a ChatGPT app but opened as popup - close it
        setTimeout(() => {
          try {
            window.opener.postMessage({ type: "oauth_success", authenticated: true }, "*");
            window.close();
          } catch (e) {
            console.warn("Failed to close window:", e);
          }
        }, 2000);
      }
    } else if (error) {
      setStatus("error");
      const errorMessages: Record<string, string> = {
        invalid_state: "Invalid authentication state. Please try again.",
        no_code: "No authorization code received. Please try again.",
        token_exchange_failed: "Failed to exchange authorization code. Please try again.",
        token_exchange_error: "Error during token exchange. Please try again.",
        callback_error: "Error during authentication callback. Please try again.",
      };
      setMessage(errorMessages[error] || `Authentication failed: ${error}`);
    } else {
      setStatus("loading");
      setMessage("Processing authentication...");
    }
  }, [searchParams, isChatGptApp]);
  
  const handleRetry = () => {
    if (isChatGptApp && window.openai) {
      // Use openExternal to open login in new window/tab
      const loginUrl = `${window.location.origin}/api/auth/login?returnUrl=${encodeURIComponent(window.location.origin)}`;
      window.openai.openExternal({ href: loginUrl });
    } else {
      window.location.href = `/api/auth/login?returnUrl=${encodeURIComponent(window.location.origin)}`;
    }
  };
  
  return (
    <div className="font-sans flex items-center justify-center min-h-screen p-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === "loading" && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          
          {status === "success" && (
            <div className="mb-4">
              <svg
                className="w-12 h-12 text-green-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
          
          {status === "error" && (
            <div className="mb-4">
              <svg
                className="w-12 h-12 text-red-600 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
          
          <h1 className="text-2xl font-bold mb-4">
            {status === "success" && "Authentication Successful"}
            {status === "error" && "Authentication Failed"}
            {status === "loading" && "Authenticating..."}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          
          {status === "error" && (
            <button
              onClick={handleRetry}
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Try Again
            </button>
          )}
          
          {status === "success" && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Authentication successful! You can now close this window and return to ChatGPT.
              </p>
              <button
                onClick={() => {
                  // Try to close the window
                  if (window.opener) {
                    try {
                      window.opener.postMessage({ type: "oauth_success", authenticated: true }, "*");
                    } catch (e) {
                      console.warn("Failed to post message:", e);
                    }
                  }
                  // Try to close (may not work if window wasn't opened by this script)
                  window.close();
                  // If window.close() doesn't work, show message
                  setTimeout(() => {
                    if (!document.hidden) {
                      alert("Please close this window manually and return to ChatGPT.");
                    }
                  }, 500);
                }}
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-green-600 text-white gap-2 hover:bg-green-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 mx-auto"
              >
                Close Window & Return to ChatGPT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="font-sans flex items-center justify-center min-h-screen p-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
            <p className="text-gray-600 dark:text-gray-300">Processing authentication...</p>
          </div>
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

