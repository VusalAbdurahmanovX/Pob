import Reveal from './ui/Reveal.jsx';
import SectionHeader from './ui/SectionHeader.jsx';
import styles from './Steps.module.css';

const steps = [
  { title: 'Choose a challenge', text: 'Pick 1-Step or 2-Step and an account from $10K to $200K. Pay the fee once.' },
  { title: 'Hit the target', text: 'Reach the profit target without crossing the daily or overall loss limit. Take as long as you need.' },
  { title: 'Trade funded', text: 'Get your funded account, trade it under the same rules and request payouts in crypto.' },
];

export default function Steps() {
  return (
    <section className={`section ${styles.section}`} id="how-it-works">
      <div className="container">
        <SectionHeader kicker="How it works" title={<>From sign-up to payout <em>in three steps.</em></>} align="center" />
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 120} className={styles.step}>
              <span className={`${styles.number} mono`}>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
