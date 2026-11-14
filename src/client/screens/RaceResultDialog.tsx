import { useEffect, useRef } from 'react';
import { Button, type ButtonVariant } from '../components/Button';

export interface RaceDialogAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

/**
 * Dialog modal layar Balapan: hasil finish, jeda, konfirmasi keluar, dan akhir balapan.
 * Aksi pertama mendapat fokus; Esc menjalankan `onCancel` (kalau ada); Tab terkunci di dialog.
 */
export function RaceResultDialog({
  title,
  text,
  actions,
  onCancel,
}: {
  title: string;
  text: string;
  actions: RaceDialogAction[];
  onCancel?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
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
        onCancel?.();
      }}
    >
      <h2 id="race-result-title" className="race-result-title">
        {title}
      </h2>
      <p id="race-result-description" className="race-result-text">
        {text}
      </p>
      <div className="race-result-actions">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? 'secondary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </dialog>
  );
}
