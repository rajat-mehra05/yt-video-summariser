'use client';

import { useSyncExternalStore } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SunIcon, MoonIcon } from '@/components/Icons';
import styles from './ThemeToggle.module.css';

// useSyncExternalStore with a no-op subscribe and constant snapshots
// gives us a hydration-safe mounted check without triggering the
// "setState in effect" lint rule.
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const toggle = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    return <div className={styles.toggleButton} />;
  }

  return (
    <button
      onClick={toggle}
      className={styles.toggleButton}
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
