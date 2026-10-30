import { useState } from 'react';
import { Plus } from 'lucide-react';
import Reveal from './ui/Reveal.jsx';
import SectionHeader from './ui/SectionHeader.jsx';
import styles from './Faq.module.css';

const questions = [
  { q: 'What is a funded trading challenge?', a: 'A simulated trading evaluation. Reach the profit target while staying inside the loss limits and you qualify for a funded account with performance-based payouts.' },
  { q: 'What is the difference between 1-Step and 2-Step?', a: '1-Step is a single phase: 10% target, 6% max loss. 2-Step splits it into two phases (8%, then 5%) with an 8% max loss, and the fee is 20% lower.' },
  { q: 'Can I hold positions over the weekend?', a: 'Yes. Crypto trades around the clock, so overnight and weekend holding is allowed as long as you stay inside the loss limits.' },
  { q: 'Is there a time limit?', a: 'No. There is no deadline and no minimum number of trading days.' },
  { q: 'How do payouts work?', a: 'Once your funded account is in profit and meets the payout criteria, request a payout in USDC, BTC or ETH. Full terms are shown before checkout.' },
];

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section" id="faq">
      <div className={`container ${styles.layout}`}>
        <SectionHeader kicker="FAQ" title="Questions, answered.">
          Can't find what you need? <a className={styles.mail} href="mailto:hello@breakpoint.example">Email us</a>.
        </SectionHeader>

        <Reveal className={styles.list}>
          {questions.map((item, index) => {
            const isOpen = open === index;
            const id = `faq-${index}`;
            return (
              <div key={item.q} className={`${styles.item} ${isOpen ? styles.open : ''}`}>
                <h3>
                  <button aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(isOpen ? null : index)}>
                    {item.q}
                    <Plus size={18} className={styles.icon} />
                  </button>
                </h3>
                <div id={id} className={styles.answer} role="region">
                  <div><p>{item.a}</p></div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
