# Blackbox AI — MCP Server

A [Next.js](https://nextjs.org) application that serves as a **Model Context Protocol (MCP)** server for [Blackbox AI](https://www.blackbox.ai), enabling integration with ChatGPT and other MCP-compatible clients.

## Overview

This project exposes an MCP endpoint (`/mcp`) that registers tools and resources consumable by AI assistants. It also ships a lightweight frontend (rendered inside the ChatGPT Apps SDK widget) that displays tool-call results.

### Registered MCP Tools

| Tool | Description |
| --- | --- |
| **show_content** | Fetches and displays the homepage content with the user's name. |
| **build_app** | Builds an app in Blackbox with a given prompt (authenticated). |
| **check_credits** | Returns the authenticated user's available credits. |
| **authenticate** | Provides instructions and a link to generate an API key. |

## Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org) (App Router, Turbopack)
- **Language** — TypeScript
- **MCP SDK** — [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) + [`mcp-handler`](https://www.npmjs.com/package/mcp-handler)
- **Validation** — [Zod](https://zod.dev)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Fonts** — Geist Sans & Geist Mono (via `next/font`)
- **Deployment** — [Vercel](https://vercel.com)
- **Package Manager** — [pnpm](https://pnpm.io)

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app starts at [http://localhost:3000](http://localhost:3000) using Turbopack for fast refresh.

### Production Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with ChatGPT Apps SDK bootstrap
│   ├── page.tsx            # Homepage (client component, widget UI)
│   ├── globals.css         # Global styles (Tailwind)
│   ├── mcp/
│   │   └── route.ts        # MCP endpoint (GET & POST)
│   ├── hooks/              # React hooks for OpenAI Apps SDK integration
│   │   ├── use-call-tool.ts
│   │   ├── use-display-mode.ts
│   │   ├── use-is-chatgpt-app.ts
│   │   ├── use-max-height.ts
│   │   ├── use-openai-global.ts
│   │   ├── use-open-external.ts
│   │   ├── use-request-display-mode.ts
│   │   ├── use-send-message.ts
│   │   ├── use-widget-props.ts
│   │   ├── use-widget-state.ts
│   │   └── types.ts
│   └── custom-page/
│       └── page.tsx        # Secondary page
├── baseUrl.ts              # Resolves the app's base URL (dev / Vercel)
├── websiteUrl.ts           # Resolves the Blackbox website URL
├── middleware.ts           # CORS middleware (allows all origins)
├── next.config.ts          # Next.js config (asset prefix)
├── postcss.config.mjs      # PostCSS config (Tailwind plugin)
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies & scripts
```

## Authentication

Authenticated tools (`build_app`, `check_credits`) require a Blackbox API key:

1. Visit the **API Keys** page on Blackbox.
2. Click **Create API Key** and copy the generated key (prefixed `bbai_`).
3. Pass the key via the `Authorization: Bearer <key>` or `X-API-Key: <key>` header.

The MCP endpoint validates tokens against the Blackbox backend before executing authenticated tool calls.

## Environment Variables

| Variable | Description |
| --- | --- |
| `BLACKBOX_APP_URL` | Override the Blackbox website URL |
| `VERCEL_PROJECT_PRODUCTION_URL` | Auto-set by Vercel in production |
| `VERCEL_BRANCH_URL` | Auto-set by Vercel for preview deployments |
| `VERCEL_URL` | Auto-set by Vercel (fallback) |

## License

Private — All rights reserved.
