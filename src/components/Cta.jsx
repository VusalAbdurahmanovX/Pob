import { ArrowRight } from 'lucide-react';
import Button from './ui/Button.jsx';
import Reveal from './ui/Reveal.jsx';
import styles from './Cta.module.css';

export default function Cta() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Reveal className={styles.card}>
          <div className={styles.glow} aria-hidden="true" />
          <h2>Your next account starts at <span className="mono">$99</span>.</h2>
          <p>One fee, no subscription, no deadline. Pass and trade our capital.</p>
          <Button size="lg" href="#challenges">Choose your challenge <ArrowRight size={18} /></Button>
        </Reveal>
      </div>
    </section>
  );
}
