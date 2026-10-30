import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import PairsMarquee from './components/PairsMarquee.jsx';
import Challenges from './components/Challenges.jsx';
import Features from './components/Features.jsx';
import Steps from './components/Steps.jsx';
import Faq from './components/Faq.jsx';
import Cta from './components/Cta.jsx';
import Footer from './components/Footer.jsx';
import Dialog from './components/Dialog.jsx';
import { money } from './lib/format.js';

export default function App() {
  const [dialog, setDialog] = useState(null);
  const [dashboard, setDashboard] = useState(() => window.location.hash === '#dashboard' || window.location.pathname === '/dashboard');

  useEffect(() => {
    const syncRoute = () => {
      setDashboard(window.location.hash === '#dashboard');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    document.title = dashboard ? 'Trader workspace — Breakpoint' : 'Breakpoint — Your edge. Our capital.';
  }, [dashboard]);

  const handleStart = challenge => setDialog({
    title: `${money(challenge.size)} ${challenge.name} challenge`,
    details: [
      ['Profit target', challenge.target],
      ['Max overall loss', challenge.maxLoss],
      ['One-time fee', money(challenge.fee)],
    ],
    description: "Checkout isn't connected in this demo, so nothing will be charged.",
  });

  const handleLogin = () => { window.location.hash = 'dashboard'; };

  if (dashboard) return <Dashboard />;

  return (
    <>
      <Header onLogin={handleLogin} />
      <main>
        <Hero />
        <PairsMarquee />
        <Challenges onStart={handleStart} />
        <Features />
        <Steps />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <Dialog content={dialog} onClose={() => setDialog(null)} />
    </>
  );
}
