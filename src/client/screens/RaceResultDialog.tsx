import { useEffect, useRef } from 'react';
import { Button } from '../components/Button';

export function RaceResultDialog({
  title,
  onWatch,
  onResults,
}: {
  title: string;
  onWatch: () => void;
  onResults: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="race-result"
      role="dialog"
      aria-labelledby="race-result-title"
      aria-describedby="race-result-description"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onWatch();
      }}
    >
      <h2 id="race-result-title" className="race-result-title">
        {title}
      </h2>
      <p id="race-result-description" className="race-result-text">
        Balapan masih berjalan. Mau menonton sisanya atau langsung melihat hasil?
      </p>
      <div className="race-result-actions">
        <Button variant="secondary" onClick={onWatch}>
          Tonton sisa balapan
        </Button>
        <Button onClick={onResults}>Lihat hasil sekarang</Button>
      </div>
    </dialog>
  );
}
