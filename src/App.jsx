import { useState } from 'react';
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

  const handleStart = challenge => setDialog({
    title: `${money(challenge.size)} ${challenge.name} challenge`,
    details: [
      ['Profit target', challenge.target],
      ['Max overall loss', challenge.maxLoss],
      ['One-time fee', money(challenge.fee)],
    ],
    description: "Checkout isn't connected in this demo, so nothing will be charged.",
  });

  const handleLogin = () => setDialog({
    title: 'Trader dashboard',
    description: "The dashboard isn't available in this demo yet.",
  });

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
