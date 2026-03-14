# Blackbox AI — MCP Server

A [Next.js](https://nextjs.org) application that exposes a **Model Context Protocol (MCP)** server, enabling AI assistants (such as ChatGPT) to interact with Blackbox AI services through standardised tool calls.

## Overview

This project provides an MCP-compatible endpoint at `/mcp` that registers several tools and resources an AI client can invoke:

| Tool | Description |
|---|---|
| **`show_content`** | Renders the homepage widget inside an AI chat session |
| **`build_app`** | Creates a new app project in Blackbox via a natural-language prompt |
| **`check_credits`** | Returns the authenticated user's available credits |
| **`authenticate`** | Provides step-by-step instructions and a link to generate an API key |

Authentication is handled via **Bearer tokens** (`Authorization` header) or **API keys** (`X-API-Key` header), validated against the Blackbox backend.

## Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org) (App Router, Turbopack)
- **Language** — TypeScript 5
- **UI** — React 19, Tailwind CSS 4
- **MCP** — [`mcp-handler`](https://www.npmjs.com/package/mcp-handler), [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- **Validation** — [Zod](https://zod.dev)
- **Package Manager** — pnpm 10
- **Deployment** — [Vercel](https://vercel.com)

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with OpenAI Apps SDK bootstrap
│   ├── page.tsx            # Homepage widget (rendered inside AI chat)
│   ├── globals.css         # Global styles
│   ├── custom-page/
│   │   └── page.tsx        # Secondary demo page
│   ├── hooks/              # OpenAI Apps SDK React hooks
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── use-call-tool.ts
│   │   ├── use-display-mode.ts
│   │   ├── use-is-chatgpt-app.ts
│   │   ├── use-max-height.ts
│   │   ├── use-open-external.ts
│   │   ├── use-openai-global.ts
│   │   ├── use-request-display-mode.ts
│   │   ├── use-send-message.ts
│   │   ├── use-widget-props.ts
│   │   └── use-widget-state.ts
│   └── mcp/
│       └── route.ts        # MCP server endpoint (GET & POST)
├── baseUrl.ts              # Resolves the app's base URL (dev / Vercel)
├── websiteUrl.ts           # Resolves the Blackbox website URL
├── middleware.ts            # CORS middleware (allows all origins)
├── next.config.ts          # Next.js configuration
├── postcss.config.mjs      # PostCSS / Tailwind CSS config
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 10 (or use `corepack enable` to auto-install)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app starts at [http://localhost:3000](http://localhost:3000) with Turbopack for fast refresh.

### Production Build

```bash
pnpm build
pnpm start
```

## Environment Variables

| Variable | Description |
|---|---|
| `BLACKBOX_APP_URL` | Override the Blackbox website URL used for API calls |
| `VERCEL_ENV` | Set automatically by Vercel (`production`, `preview`, `development`) |
| `VERCEL_PROJECT_PRODUCTION_URL` | Production domain (set by Vercel) |
| `VERCEL_BRANCH_URL` | Branch preview URL (set by Vercel) |
| `VERCEL_URL` | Deployment URL (set by Vercel) |

## MCP Endpoint

The MCP server is available at:

```
GET  /mcp
POST /mcp
```

### Authentication

Include one of the following headers with your request:

```
Authorization: Bearer <your-api-key>
```

or

```
X-API-Key: <your-api-key>
```

API keys can be generated at the Blackbox API Keys page and start with `bbai_`.

## License

Private — All rights reserved.
