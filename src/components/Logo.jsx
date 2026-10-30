import styles from './Logo.module.css';

export default function Logo() {
  return (
    <a className={styles.logo} href="#top" aria-label="Breakpoint home">
      <svg className={styles.mark} viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="7" fill="currentColor" />
        <path d="M7 15.5 11 11l2.5 2.5L17.5 9" fill="none" stroke="#0b0d08" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 8.5h3.8v3.8" fill="none" stroke="#0b0d08" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      breakpoint
    </a>
  );
}
