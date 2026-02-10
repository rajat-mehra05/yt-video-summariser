# YT Summarizer

Paste any YouTube link and get an instant AI-powered summary. YT Summarizer extracts video transcripts and uses Claude AI to generate well-structured, readable markdown summaries — streamed to your browser in real time.

## Benefits

- **Instant Summaries** — Get the key points from any YouTube video in seconds instead of watching the full thing.
- **Streaming Responses** — Summaries appear in real time as they're generated, so you don't have to wait.
- **Structured Markdown Output** — Every summary includes an overview, key points, notable quotes, and a conclusion.
- **Smart Transcript Detection** — Automatically picks the best available transcript, prioritizing manual captions and English language.
- **Flexible URL Input** — Supports full YouTube URLs, short links (`youtu.be`), embed URLs, and raw video IDs.

## Tech Stack

- [Next.js 16](https://nextjs.org) with App Router
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Anthropic SDK](https://docs.anthropic.com) (Claude AI)
- [react-markdown](https://github.com/remarkjs/react-markdown) for rendering summaries

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18.17 or later
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/your-username/yt-summarizer.git
cd yt-summarizer
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_TEMPERATURE=0.7
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-sonnet-4-5-20250929` | Claude model to use |
| `ANTHROPIC_TEMPERATURE` | No | `0.7` | Controls response creativity (0–1) |

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Usage

1. Paste a YouTube video URL into the input field.
2. Click **Summarize**.
3. The AI-generated summary streams in real time with structured sections.

## Deployment

The easiest way to deploy is with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Make sure to add your environment variables in the Vercel dashboard under **Settings > Environment Variables**.

## License

This project is licensed under the [MIT License](LICENSE).
