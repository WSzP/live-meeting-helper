[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C.svg?logo=langchain&logoColor=white)](https://www.langchain.com/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-Speech--to--Text-4285F4.svg?logo=googlecloud&logoColor=white)](https://cloud.google.com/speech-to-text)
[![Lint](https://github.com/WSzP/live-meeting-helper/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/WSzP/live-meeting-helper/actions/workflows/lint.yml)

<p><img src="assets/lmh-logo.webp" width="200" alt="Live Meeting Helper Logo"></p>

# Live Meeting Helper

**Real-time meeting transcription with AI-powered insights.** Captures live audio from your microphone, transcribes it in real-time using Google Cloud Speech-to-Text, and provides AI-generated summaries and answers using Google Gemini.

<p><img src="assets\screenshot-01.jpg" width="100%" alt="Live Meeting Helper Screenshot"></p>

## Features

- **Real-Time Transcription**: Live speech-to-text as you speak, with interim results and automatic punctuation
- **AI Meeting Assistant**: Ask questions about the meeting or get automatic summaries powered by Gemini
- **Streaming Responses**: AI answers stream in real-time for immediate feedback
- **WebSocket Architecture**: Low-latency audio streaming for responsive transcription
- **Audio Level Monitoring**: Visual feedback showing microphone input levels
- **Microphone Testing**: Built-in mic test to verify audio setup before recording
- **Transcript Download**: Export your meeting transcripts as text files
- **Dark Theme**: Easy-on-the-eyes dark interface designed for extended use

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Node.js custom server with WebSocket support |
| **Speech Recognition** | Google Cloud Speech-to-Text (streaming API) |
| **AI Assistant** | Google Gemini via LangChain |
| **Package Manager** | pnpm (monorepo workspace) |

## Requirements

- **Node.js 20+** (Node.js 25+ recommended)
- **pnpm 10+** - Fast, disk space efficient package manager
- **Google Cloud Account** - For Speech-to-Text API
- **Google AI API Key** - For Gemini AI

## Installation

```bash
# Clone the repository
git clone https://github.com/WSzP/live-meeting-helper.git
cd live-meeting-helper

# Install dependencies
pnpm install
```

## Configuration

Create a `.env.local` file in the project root:

```bash
# Google Cloud Speech-to-Text credentials
GOOGLE_APPLICATION_CREDENTIALS=.gcp/your-service-account.json

# Google AI (Gemini) API key
GOOGLE_API_KEY=your-google-ai-api-key

# Optional: Custom port (default: 3000)
PORT=3000
```

### Google Cloud Setup

1. Create a Google Cloud project
2. Enable the Speech-to-Text API
3. Create a service account with Speech-to-Text permissions
4. Download the JSON key file and place it in `.gcp/` (do NOT commit it)

See [docs/GOOGLE_CLOUD_SETUP.md](docs/GOOGLE_CLOUD_SETUP.md) for detailed instructions.

### Google AI (Gemini) Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add it to `.env.local` as `GOOGLE_API_KEY`

## Usage

```bash
# Start development server
pnpm dev
```

Open http://localhost:3000 in your browser.

### How to Use

1. Click **Start Recording** to begin
2. Allow microphone access when prompted
3. Speak clearly into your microphone
4. Watch real-time transcription appear
5. Click **Ask AI** to get insights about the meeting
6. Click **Stop Recording** when finished
7. Download your transcript

## Project Structure

```
live-meeting-helper/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages and layouts
│   │   ├── components/      # React components
│   │   └── hooks/           # Custom React hooks
│   ├── server.js            # Custom Node.js server with WebSocket
│   ├── next.config.ts       # Next.js configuration
│   ├── eslint.config.mjs    # ESLint flat config
│   └── postcss.config.js    # PostCSS/Tailwind configuration
├── docs/                    # Documentation
├── .gcp/                    # Google Cloud credentials (gitignored)
├── package.json             # Root package.json (workspace)
└── pnpm-workspace.yaml      # pnpm workspace configuration
```

## How It Works

1. **Audio Capture**: Browser captures microphone audio using MediaRecorder API (WebM/Opus format)
2. **WebSocket Streaming**: Audio chunks are streamed to the server via WebSocket every 250ms
3. **Speech Recognition**: Server pipes audio to Google Cloud Speech-to-Text streaming API
4. **Real-Time Results**: Interim and final transcription results are sent back to the client
5. **AI Processing**: When requested, transcript is sent to Gemini (gemini-3-flash-preview) via LangChain, with responses streaming back through the same WebSocket connection

### Architecture

```
┌─────────────┐     WebSocket      ┌─────────────────┐
│   Browser   │ ◄────────────────► │  Node.js Server │
│  (React)    │   Audio + Text     │                 │
└─────────────┘                    └────────┬────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         │                  │                  │
                         ▼                  ▼                  ▼
                 ┌───────────────┐  ┌───────────────┐  ┌──────────────┐
                 │ Google Cloud  │  │   Google AI   │  │    Next.js   │
                 │ Speech-to-Text│  │   (Gemini)    │  │   (SSR/CSR)  │
                 └───────────────┘  └───────────────┘  └──────────────┘
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Limitations

- **5-minute streaming limit**: Google Cloud Speech-to-Text has a ~305 second limit per stream. The app automatically restarts streams to handle longer meetings.
- **Browser support**: Requires a modern browser with MediaRecorder API support (Chrome, Firefox, Edge)
- **English only**: Currently configured for `en-US`. Can be modified in `server.js`

## Brand

### Colors

| Name | Hex | Usage |
| ---- | --- | ----- |
| **Night Navy** | `#040932` | Background |
| **Cloud Lilac** | `#F3F1FA` | Primary text color over dark backgrounds |
| **Pulse Cyan** | `#0BB2F2` | "Live" feeling - realtime indicators, highlights, badges, waveform accents |

### Logo

In the logo text: **Live** and **Helper** use Cloud Lilac, **Meeting** uses Pulse Cyan.

| Asset | Path | Usage |
| ----- | ---- | ----- |
| Logo (PNG) | `assets/lmh-logo.png` | High quality |
| Logo (WebP) | `assets/lmh-logo.webp` | Web optimized |
| Open Graph | `assets/lmh-open-graph.png` | Social media previews |

## License

Apache License 2.0

---

Created by Peter W. Szabo, 2026.
