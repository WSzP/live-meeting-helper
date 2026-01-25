# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server (custom Node.js server with WebSocket)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

All commands run from root and target the frontend workspace via `pnpm --filter`.

## Environment Setup

Create `.env.local` in the project root:

```bash
GOOGLE_APPLICATION_CREDENTIALS=.gcp/your-service-account.json  # Google Cloud credentials
GOOGLE_API_KEY=your-google-ai-api-key                          # Gemini API key
PORT=3000                                                       # Optional
```

## Architecture Overview

**Monorepo structure** with pnpm workspaces. The `frontend/` package contains the entire application.

### Server Architecture

The app uses a **custom Node.js server** (`frontend/server.js`) instead of the standard Next.js server. This server:

1. Handles HTTP requests via Next.js
2. Runs a WebSocket server at `/api/transcribe` for real-time audio streaming
3. Manages Google Cloud Speech-to-Text streaming sessions (with auto-restart at ~5 min limit)
4. Processes AI requests to Gemini via LangChain with streaming responses

### Data Flow

```
Browser (MediaRecorder) → WebSocket → server.js → Google Speech-to-Text
                                    ↓
Browser (UI updates)    ← WebSocket ← Transcription results

Browser (AI request)    → WebSocket → server.js → Gemini (LangChain)
                                    ↓
Browser (streaming UI)  ← WebSocket ← AI response chunks
```

### Key Patterns

**Custom Hooks** (`frontend/src/hooks/`):
- `useAudioRecorder` - Browser audio capture using MediaRecorder API, sends WebM/Opus chunks every 250ms
- `useTranscription` - WebSocket client managing connection, transcript state, and AI requests

**Server Classes**:
- `TranscriptionSession` - Wraps Google Cloud streaming recognition with automatic stream restart before the 305-second limit

**Component Organization** (`frontend/src/components/`):
- Components are exported via barrel file (`index.ts`)
- All components are client components (`'use client'`)

### Technology Stack

- Next.js 16 App Router with React 19
- Tailwind CSS 4 (configured via `@tailwindcss/postcss`)
- TypeScript with strict mode
- ESLint flat config (`eslint.config.mjs`)
- Google Cloud Speech-to-Text (streaming API, WEBM_OPUS encoding)
- Google Gemini via `@langchain/google-genai`
