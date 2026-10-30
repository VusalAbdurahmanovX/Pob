import { Clock3, Coins, Gauge, Infinity as InfinityIcon } from 'lucide-react';
import Reveal from './ui/Reveal.jsx';
import SectionHeader from './ui/SectionHeader.jsx';
import { PAYOUT_COINS } from '../lib/coins.js';
import styles from './Features.module.css';

// Spotlight follows the cursor inside each tile.
const trackPointer = event => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`);
};

function Tile({ className = '', delay, icon: Icon, title, text, children }) {
  return (
    <Reveal className={`${styles.tile} ${className}`} delay={delay} onPointerMove={trackPointer}>
      {children && <div className={styles.visual}>{children}</div>}
      <div className={styles.body}>
        {Icon && <Icon size={20} className={styles.icon} />}
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </Reveal>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => 0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + 1)));

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <SectionHeader kicker="Why Breakpoint" title={<>Rules that stay out <em>of your way.</em></>}>
          Built around how crypto actually trades: nonstop, volatile and global.
        </SectionHeader>

        <div className={styles.grid}>
          <Tile
            className={styles.wide}
            title="Keep up to 90% of what you make"
            text="Up to 90% of every payout goes to you. We only earn when you do."
          >
            <div className={styles.split}>
              <div className={styles.splitBar}>
                <span className={styles.splitYou}><b className="mono">90%</b> You</span>
                <span className={styles.splitUs}><b className="mono">10%</b></span>
              </div>
            </div>
          </Tile>

          <Tile
            delay={80}
            icon={InfinityIcon}
            title="No time limit"
            text="No deadline and no minimum trading days. Pass when your setup is there, not when a timer says so."
          />

          <Tile
            delay={80}
            icon={Clock3}
            title="Open 24/7"
            text="Hold over nights and weekends. Your account is open whenever the market is."
          >
            <div className={styles.hours} aria-hidden="true">
              {hours.map((h, i) => <span key={i} style={{ '--h': h, '--i': i }} />)}
            </div>
          </Tile>

          <Tile
            className={styles.wide}
            delay={160}
            icon={Gauge}
            title="See your limits in real time"
            text="Daily loss, overall drawdown and progress to target, updated live. You always know how much room you have."
          >
            <div className={styles.gauges} aria-hidden="true">
              <Meter label="Target" value="6.2%" fill={0.62} />
              <Meter label="Daily loss" value="0.8%" fill={0.2} tone="red" />
              <Meter label="Drawdown" value="2.1%" fill={0.35} tone="red" />
            </div>
          </Tile>

          <Tile
            className={styles.full}
            delay={80}
            icon={Coins}
            title="Paid out in crypto"
            text="Request a payout and receive it in USDC, BTC or ETH. No bank transfers, no waiting on wire cut-offs."
          >
            <div className={styles.coins} aria-hidden="true">
              {PAYOUT_COINS.map(({ symbol, Icon }) => (
                <span key={symbol} className="mono"><Icon variant="branded" size={24} />{symbol}</span>
              ))}
            </div>
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Meter({ label, value, fill, tone = 'lime' }) {
  return (
    <div className={styles.meter}>
      <div><span>{label}</span><span className="mono">{value}</span></div>
      <i><b className={styles[tone]} style={{ '--fill': fill }} /></i>
    </div>
  );
}
