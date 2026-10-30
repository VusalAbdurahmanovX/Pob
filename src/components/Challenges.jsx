import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import Button from './ui/Button.jsx';
import Reveal from './ui/Reveal.jsx';
import Segmented from './ui/Segmented.jsx';
import SectionHeader from './ui/SectionHeader.jsx';
import { useCountUp } from '../hooks/useCountUp.js';
import { getChallenge, PLANS, SIZES } from '../lib/challenge.js';
import { money, shortMoney } from '../lib/format.js';
import styles from './Challenges.module.css';

const modeOptions = [
  { value: 1, label: PLANS[1].name },
  { value: 2, label: PLANS[2].name, tag: '−20%' },
];
const sizeOptions = SIZES.map(size => ({ value: size, label: shortMoney(size) }));
const included = ['No time limit', 'Weekend holding', 'No minimum trading days', 'Payouts in USDC, BTC or ETH'];

export default function Challenges({ onStart }) {
  const [mode, setMode] = useState(1);
  const [size, setSize] = useState(100000);
  const challenge = getChallenge(size, mode);
  const fee = useCountUp(challenge.fee);
  const capital = useCountUp(size);

  const rules = [
    { label: 'Profit target', value: challenge.target },
    { label: 'Daily loss limit', value: challenge.dailyLoss },
    { label: 'Max overall loss', value: challenge.maxLoss },
    { label: 'Profit split', value: 'Up to 90%', accent: true },
  ];

  return (
    <section className="section" id="challenges">
      <div className="container">
        <SectionHeader kicker="Challenges" title={<>Pick your size. <em>Pay once.</em></>}>
          Every account has the same simple rules. Choose one phase or two, then the capital you want to trade.
        </SectionHeader>

        <Reveal className={styles.panel}>
          <div className={styles.config}>
            <Segmented label="Evaluation" options={modeOptions} value={mode} onChange={setMode} />
            <Segmented label="Account size" options={sizeOptions} value={size} onChange={setSize} />

            <div className={styles.phases}>
              {challenge.phases.map((target, index) => (
                <div key={index} className={styles.phase}>
                  <span className={styles.phaseLabel}>{challenge.phases.length > 1 ? `Phase ${index + 1}` : 'Evaluation'}</span>
                  <span className={`${styles.phaseValue} mono`}>+{target}%</span>
                  <span className={styles.phaseNote}>{money(size * target / 100)} profit</span>
                </div>
              ))}
              <div className={`${styles.phase} ${styles.funded}`}>
                <span className={styles.phaseLabel}>Funded</span>
                <span className={`${styles.phaseValue} mono`}>90%</span>
                <span className={styles.phaseNote}>of profits are yours</span>
              </div>
            </div>

            <ul className={styles.included}>
              {included.map(item => (
                <li key={item}><Check size={16} className="lime" /> {item}</li>
              ))}
            </ul>
          </div>

          <aside className={styles.summary}>
            <span className={styles.summaryLabel}>{challenge.name} account</span>
            <div className={`${styles.capital} mono`}>{money(Math.round(capital))}</div>

            <dl className={styles.rules}>
              {rules.map(rule => (
                <div key={rule.label}>
                  <dt>{rule.label}</dt>
                  <dd className={`mono ${rule.accent ? 'lime' : ''}`}>{rule.value}</dd>
                </div>
              ))}
            </dl>

            <div className={styles.price}>
              <div>
                <span className={styles.summaryLabel}>One-time fee</span>
                <div className={styles.feeRow}>
                  <span className={`${styles.fee} mono`}>{money(Math.round(fee))}</span>
                  {challenge.fee !== challenge.baseFee && (
                    <s className="mono">{money(challenge.baseFee)}</s>
                  )}
                </div>
              </div>
            </div>

            <Button size="lg" className={styles.cta} onClick={() => onStart(challenge)}>
              Start challenge <ArrowRight size={18} />
            </Button>
            <p className={styles.fine}>No subscription. No hidden fees.</p>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
