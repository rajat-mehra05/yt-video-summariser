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
      <header className="relative z-10 flex items-center justify-center max-w-2xl mx-auto px-4 py-6">
        <div className="logo-wrapper">
          <Image
            src="/logo.png"
            alt="YouTube Video Summariser"
            width={345}
            height={100}
            className="w-auto h-auto max-w-[280px] sm:max-w-[345px]"
            priority
          />
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 px-4 pb-10">
        {/* Tagline */}
        <p className="text-muted text-lg max-w-2xl mx-auto text-center leading-relaxed mb-8 mt-4">
          Paste any YouTube link and get an instant AI-powered summary
        </p>

        {/* Main Card */}
        <div className="glass-card w-full max-w-2xl mx-auto p-5 sm:p-8">
          <SummarizerForm />
        </div>

        <footer className="mt-12 text-center">
          <p className="text-faint text-sm">
            Powered by Claude AI &middot; AI can make mistakes, so double-check it.
          </p>
        </footer>
      </main>
    </div>
  );
}
