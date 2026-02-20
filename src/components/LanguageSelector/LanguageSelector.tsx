'use client';

import type { SummaryLanguage } from '@/types';
import { LANGUAGE_OPTIONS } from '@/constants';
import styles from './LanguageSelector.module.css';

interface LanguageSelectorProps {
  value: SummaryLanguage;
  onChange: (language: SummaryLanguage) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, disabled }: LanguageSelectorProps) {
  return (
    <div className={styles.container}>
      <label htmlFor="language-select" className={styles.label}>
        Language
      </label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SummaryLanguage)}
        disabled={disabled}
        className={styles.select}
      >
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
