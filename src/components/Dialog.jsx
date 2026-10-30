import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Button from './ui/Button.jsx';
import styles from './Dialog.module.css';

export default function Dialog({ content, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (content && !dialog.open) dialog.showModal();
    if (!content && dialog.open) dialog.close();
  }, [content]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onClick={event => { if (event.target === ref.current) onClose(); }}
      aria-labelledby="dialog-title"
    >
      <div className={styles.body}>
        <button className={styles.close} aria-label="Close" onClick={onClose}><X size={18} /></button>
        <h2 id="dialog-title">{content?.title}</h2>
        {content?.details && (
          <dl className={styles.details}>
            {content.details.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd className="mono">{value}</dd></div>
            ))}
          </dl>
        )}
        <p>{content?.description}</p>
        <Button onClick={onClose} autoFocus>Got it</Button>
      </div>
    </dialog>
  );
}
