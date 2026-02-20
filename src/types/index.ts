export type SummaryLength = 'short' | 'medium' | 'long';
export type SummaryLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ko' | 'zh' | 'hi' | 'ar' | 'as';

export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  lengthSeconds?: number;
  viewCount?: number;
}
