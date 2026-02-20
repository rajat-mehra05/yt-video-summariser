import Image from "next/image";
import SummarizerForm from "@/components/SummarizerForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { SummaryLength, SummaryLanguage } from "@/types";
import { VALID_LENGTHS, VALID_LANGUAGES } from "@/constants";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const videoId = typeof params.v === 'string' ? params.v : undefined;
  const lengthParam = typeof params.length === 'string' ? params.length : undefined;
  const length = lengthParam && VALID_LENGTHS.includes(lengthParam as SummaryLength)
    ? (lengthParam as SummaryLength)
    : undefined;
  const langParam = typeof params.lang === 'string' ? params.lang : undefined;
  const language = langParam && VALID_LANGUAGES.includes(langParam as SummaryLanguage)
    ? (langParam as SummaryLanguage)
    : undefined;
  return (
    <div className="page-wrapper">
      {/* Background gradient blobs */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-up">
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
        <ThemeToggle />
      </header>

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-10">
        {/* Tagline */}
        <p className="text-muted text-base max-w-3xl mx-auto text-center leading-relaxed mb-5 mt-1 animate-fade-up-delay-1">
          Paste any YouTube link and get an instant AI-powered summary
        </p>

        {/* Main Card */}
        <div className="glass-card w-full max-w-4xl mx-auto p-5 sm:p-6 animate-fade-up-delay-2">
          <SummarizerForm initialVideoId={videoId} initialLength={length} initialLanguage={language} />
        </div>

        <footer className="mt-8 text-center animate-fade-up-delay-3">
          <p className="text-faint text-sm">
            Powered by Claude AI &middot; AI can make mistakes, so double-check it.
          </p>
        </footer>
      </main>
    </div>
  );
}
