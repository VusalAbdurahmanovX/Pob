import Reveal from './Reveal.jsx';
import styles from './SectionHeader.module.css';

export default function SectionHeader({ kicker, title, children, align = 'left' }) {
  return (
    <Reveal className={`${styles.header} ${styles[align]}`}>
      <span className={styles.kicker}>{kicker}</span>
      <h2 className={styles.title}>{title}</h2>
      {children && <p className={styles.lead}>{children}</p>}
    </Reveal>
  );
}
