import { ArrowRight, PlayCircle } from 'lucide-react';
import Button from './ui/Button.jsx';
import HeroDashboard from './HeroDashboard.jsx';
import styles from './Hero.module.css';

const highlights = [
  { value: '$200K', label: 'max account' },
  { value: '90%', label: 'profit split' },
  { value: '24/7', label: 'markets open' },
];

export default function Hero() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grid} />
        <div className={styles.glow} />
      </div>

      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <a href="#challenges" className={styles.badge}>
            <span className={styles.badgeTag}>New</span>
            2-Step challenge, 20% lower fee
            <ArrowRight size={14} />
          </a>

          <h1 className={styles.title}>
            Trade crypto with up to <span className={styles.accent}>$200K</span> of our capital.
          </h1>

          <p className={styles.lead}>
            Pass one evaluation and keep up to 90% of the profit. No deadlines,
            weekends open, payouts in crypto.
          </p>

          <div className={styles.actions}>
            <Button size="lg" href="#challenges">Choose your challenge <ArrowRight size={18} /></Button>
            <Button size="lg" variant="ghost" href="#how-it-works"><PlayCircle size={18} /> How it works</Button>
          </div>

          <dl className={styles.highlights}>
            {highlights.map(item => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd className="mono">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <HeroDashboard />
      </div>
    </section>
  );
}
