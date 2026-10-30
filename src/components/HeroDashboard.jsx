import { CheckCircle2, ShieldCheck, TrendingUp } from 'lucide-react';
import { TokenUSDC } from '@web3icons/react';
import styles from './HeroDashboard.module.css';

// Illustrative equity curve, normalised to a 0–1 range.
const points = [0.08, 0.14, 0.1, 0.22, 0.18, 0.3, 0.26, 0.38, 0.34, 0.47, 0.42, 0.55, 0.5, 0.6, 0.57, 0.7, 0.66, 0.78, 0.74, 0.86, 0.92];
const W = 480;
const H = 180;

function smoothPath(values) {
  const coords = values.map((v, i) => [(i / (values.length - 1)) * W, H - v * (H - 16) - 8]);
  return coords.reduce((d, [x, y], i, all) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = all[i - 1];
    const cx = (px + x) / 2;
    return `${d} C${cx},${py} ${cx},${y} ${x},${y}`;
  }, '');
}

const line = smoothPath(points);
const area = `${line} L${W},${H} L0,${H} Z`;

const meters = [
  { label: 'Profit target', value: '8.45% / 10%', fill: 0.845, tone: 'lime' },
  { label: 'Max loss used', value: '1.2% / 6%', fill: 0.2, tone: 'red' },
];

export default function HeroDashboard() {
  return (
    <div className={styles.stage} aria-label="Illustrative trading dashboard" role="img">
      <div className={styles.card}>
        <div className={styles.head}>
          <div className={styles.account}>
            <span className={styles.dot} />
            <span>Account #BP-20481</span>
          </div>
          <span className={styles.phase}>Funded</span>
        </div>

        <div className={styles.balance}>
          <span className={styles.label}>Balance</span>
          <div className={`${styles.amount} mono`}>$108,450<span>.00</span></div>
          <span className={`${styles.delta} mono`}><TrendingUp size={14} /> +$8,450.00 · 8.45%</span>
        </div>

        <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#245be7" stopOpacity="0.28" />
              <stop offset="1" stopColor="#245be7" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(y => (
            <line key={y} x1="0" x2={W} y1={H * y} y2={H * y} className={styles.gridline} />
          ))}
          <path d={area} fill="url(#equityFill)" className={styles.area} />
          <path d={line} pathLength="1" className={styles.line} />
        </svg>

        <div className={styles.meters}>
          {meters.map(meter => (
            <div key={meter.label} className={styles.meter}>
              <div className={styles.meterRow}>
                <span>{meter.label}</span>
                <span className="mono">{meter.value}</span>
              </div>
              <div className={styles.track}>
                <div className={`${styles.fill} ${styles[meter.tone]}`} style={{ '--fill': meter.fill }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles.float} ${styles.payout}`}>
        <span className={styles.payoutIcon}>
          <TokenUSDC variant="branded" size={32} />
          <CheckCircle2 size={16} className={styles.payoutCheck} />
        </span>
        <div>
          <strong>Payout sent</strong>
          <span className="mono">+$4,250.00 USDC</span>
        </div>
      </div>

      <div className={`${styles.float} ${styles.rules}`}>
        <ShieldCheck size={18} className="lime" />
        <span>All rules respected</span>
      </div>
    </div>
  );
}
