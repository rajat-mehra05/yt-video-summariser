'use client';

import type { SummaryLength } from '@/types';
import { LENGTH_OPTIONS } from '@/constants';
import styles from './LengthSelector.module.css';

interface LengthSelectorProps {
  value: SummaryLength;
  onChange: (length: SummaryLength) => void;
  disabled?: boolean;
}

export function LengthSelector({ value, onChange, disabled }: LengthSelectorProps) {
  return (
    <div className={styles.container} role="radiogroup" aria-label="Summary length">
      {LENGTH_OPTIONS.map((opt) => (
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
