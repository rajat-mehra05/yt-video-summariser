export type SummaryLength = 'short' | 'medium' | 'long';

export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  lengthSeconds: number;
  viewCount: number;
}
