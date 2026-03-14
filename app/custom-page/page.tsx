"use client";

import Link from "next/link";

export default function CustomPage() {
  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-background text-foreground">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 right-1/4 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-32 -left-20 h-[350px] w-[350px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 sm:px-12">
        <div
          className="flex flex-col items-center text-center max-w-2xl"
          style={{ animation: "fadeInUp 0.6s ease-out" }}
        >
          {/* Back navigation pill */}
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-white/60 dark:bg-white/[0.04] px-4 py-2 text-sm text-foreground/60 backdrop-blur-sm transition-all duration-200 hover:border-foreground/20 hover:text-foreground/80 hover:-translate-y-0.5"
          >
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
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Back to Home
          </Link>

          {/* Page icon */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
            Custom Page
          </h1>
          <p className="mt-4 text-lg text-foreground/50 max-w-lg leading-relaxed">
            This is a client-side rendered page demonstrating navigation in your
            Blackbox AI application. Build more pages like this to extend your
            app.
          </p>

          {/* Info cards */}
          <div
            className="mt-12 grid w-full gap-4 sm:grid-cols-2"
            style={{ animation: "fadeInUp 0.7s ease-out 0.1s both" }}
          >
            <div className="rounded-2xl border border-foreground/[0.06] bg-white/50 dark:bg-white/[0.03] p-5 backdrop-blur-sm text-left">
              <h3 className="text-sm font-semibold text-foreground/70">
                Rendering
              </h3>
              <p className="mt-1 text-sm text-foreground/40">
                Client-side rendered with React 19 and Next.js 15
              </p>
            </div>
            <div className="rounded-2xl border border-foreground/[0.06] bg-white/50 dark:bg-white/[0.03] p-5 backdrop-blur-sm text-left">
              <h3 className="text-sm font-semibold text-foreground/70">
                Navigation
              </h3>
              <p className="mt-1 text-sm text-foreground/40">
                Instant client-side transitions via Next.js Link
              </p>
            </div>
          </div>

          {/* CTA */}
          <div
            className="mt-10"
            style={{ animation: "fadeInUp 0.8s ease-out 0.2s both" }}
          >
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 hover:brightness-110"
            >
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
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              Go to Main Page
            </Link>
          </div>
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
      `}</style>
    </div>
  );
}
