'use client';

import Image from 'next/image';
import type { VideoMetadata } from '@/types';
import styles from './VideoInfo.module.css';

interface VideoInfoProps {
  metadata: VideoMetadata;
}

function formatDuration(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  return `${count.toLocaleString()} views`;
}

export function VideoInfo({ metadata }: VideoInfoProps) {
  const thumbnailUrl = `https://img.youtube.com/vi/${metadata.id}/mqdefault.jpg`;
  const videoUrl = `https://www.youtube.com/watch?v=${metadata.id}`;

  return (
    <div className={styles.container}>
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className={styles.thumbnailLink} aria-hidden="true" tabIndex={-1}>
        <Image
          src={thumbnailUrl}
          alt=""
          width={320}
          height={180}
          className={styles.thumbnail}
        />
        {metadata.lengthSeconds != null && metadata.lengthSeconds > 0 && (
          <span className={styles.duration}>{formatDuration(metadata.lengthSeconds)}</span>
        )}
      </a>
      <div className={styles.details}>
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className={styles.title}>
          {metadata.title}
        </a>
        <span className={styles.channel}>{metadata.author}</span>
        {metadata.viewCount != null && metadata.viewCount > 0 && (
          <span className={styles.views}>{formatViewCount(metadata.viewCount)}</span>
        )}
      </div>
    </div>
  );
}
