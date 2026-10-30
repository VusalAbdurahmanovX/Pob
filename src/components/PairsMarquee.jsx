import { PAIRS } from '../lib/coins.js';
import styles from './PairsMarquee.module.css';

function Row({ hidden }) {
  return (
    <ul className={styles.row} aria-hidden={hidden || undefined}>
      {PAIRS.map(({ symbol, name, Icon }) => (
        <li key={symbol}>
          <Icon variant="branded" size={32} className={styles.logo} aria-hidden="true" />
          <span className={styles.text}>
            <span className={styles.name}>{name}</span>
            <span className={`${styles.pair} mono`}>{symbol}/USDT</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PairsMarquee() {
  return (
    <section className={styles.strip} aria-label="Supported trading pairs">
      <p className={styles.label}>100+ crypto pairs, open around the clock</p>
      <div className={styles.viewport}>
        <div className={styles.track}>
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
