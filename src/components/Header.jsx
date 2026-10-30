import { useEffect, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './ui/Button.jsx';
import styles from './Header.module.css';

const links = [
  { href: '#challenges', label: 'Challenges' },
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

export default function Header({ onLogin }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.wrap} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.bar} ${open ? styles.open : ''}`}>
        <Logo />
        <nav className={styles.nav} aria-label="Main">
          {links.map(link => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
          ))}
        </nav>
        <div className={styles.actions}>
          <Button variant="text" size="sm" className={styles.login} onClick={onLogin}>Demo dashboard</Button>
          <Button size="sm" href="#challenges">Get funded <ArrowRight size={15} /></Button>
          <button
            className={styles.toggle}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
