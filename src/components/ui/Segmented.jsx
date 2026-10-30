import { useId } from 'react';
import styles from './Segmented.module.css';

export default function Segmented({ label, options, value, onChange }) {
  const id = useId();
  const index = Math.max(0, options.findIndex(option => option.value === value));

  return (
    <div className={styles.field}>
      <span id={id} className={styles.label}>{label}</span>
      <div
        className={styles.group}
        role="radiogroup"
        aria-labelledby={id}
        style={{ '--count': options.length, '--index': index }}
      >
        <span className={styles.indicator} aria-hidden="true" />
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={styles.option}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.tag && <span className={styles.tag}>{option.tag}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
