import Logo from './Logo.jsx';
import styles from './Footer.module.css';

const columns = [
  { title: 'Product', links: [['Challenges', '#challenges'], ['Features', '#features'], ['How it works', '#how-it-works']] },
  { title: 'Support', links: [['FAQ', '#faq'], ['Contact', 'mailto:hello@breakpoint.example']] },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo />
            <p>Crypto prop trading with simple rules and no deadlines.</p>
          </div>
          {columns.map(column => (
            <nav key={column.title} className={styles.column} aria-label={column.title}>
              <h4>{column.title}</h4>
              {column.links.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
            </nav>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Breakpoint is a concept. All accounts and trading are simulated and no live funds are provided.
          Trading involves risk and past performance does not guarantee future results. Figures shown are
          illustrative. No payments are collected on this site.
        </p>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Breakpoint</span>
          <span className={styles.status}><i /> All systems normal</span>
        </div>
      </div>
    </footer>
  );
}
