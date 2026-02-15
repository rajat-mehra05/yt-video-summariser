'use client';

import type { SummaryLength } from '@/types';
import styles from './LengthSelector.module.css';

const OPTIONS: { value: SummaryLength; label: string; description: string }[] = [
  { value: 'short',  label: 'Short',  description: 'Key takeaways' },
  { value: 'medium', label: 'Medium', description: 'Balanced summary' },
  { value: 'long',   label: 'Long',   description: 'Full detail' },
];

interface LengthSelectorProps {
  value: SummaryLength;
  onChange: (length: SummaryLength) => void;
  disabled?: boolean;
}

export function LengthSelector({ value, onChange, disabled }: LengthSelectorProps) {
  return (
    <div className={styles.container} role="radiogroup" aria-label="Summary length">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={disabled}
          className={`${styles.option} ${value === opt.value ? styles.selected : ''}`}
          onClick={() => onChange(opt.value)}
        >
          <span className={styles.label}>{opt.label}</span>
          <span className={styles.description}>{opt.description}</span>
        </button>
      ))}
    </div>
  );
}
