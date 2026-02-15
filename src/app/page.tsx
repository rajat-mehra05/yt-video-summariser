import Image from "next/image";
import SummarizerForm from "@/components/SummarizerForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="page-wrapper">
      {/* Background gradient blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 text-center">
        <div className="logo-wrapper">
          <Image
            src="/logo.png"
            alt="YouTube Video Summariser"
            width={345}
            height={100}
            priority
          />
        </div>
        <div className="absolute top-4 right-6">
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 px-4 pb-10">
        {/* Tagline */}
        <p
          className="text-lg max-w-md mx-auto text-center leading-relaxed mb-10 mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Paste any YouTube link and get an instant AI-powered summary
        </p>

        {/* Main Card */}
        <div className="glass-card w-full max-w-2xl mx-auto p-8">
          <SummarizerForm />
        </div>

        <footer className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            <span className="feature-pill">Powered by Claude AI</span>
            <span className="feature-pill">Streaming Responses</span>
            <span className="feature-pill">Markdown Summaries</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
            AI can make mistakes, so double-check it.
          </p>
        </footer>
      </main>
    </div>
  );
}
