import { ErrorIcon } from '@/components/Icons';
import styles from './ErrorBanner.module.css';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className={styles.errorBanner} role="alert">
      <ErrorIcon />
      {message}
    </div>
  );
}
