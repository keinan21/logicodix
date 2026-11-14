import { useState } from 'react';
import { handleMuteChange } from '../music';
import { isSoundMuted, playSound, setSoundMuted } from '../sound';

/**
 * Tombol bisu audio (efek suara + musik) — selalu terlihat di pojok kanan bawah.
 * Pilihan disimpan di localStorage supaya bertahan saat refresh.
 */
export function SoundToggle() {
  const [muted, setMuted] = useState(isSoundMuted);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
    handleMuteChange(next);
    if (!next) playSound('tick');
  };

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={muted}
      aria-label={muted ? 'Nyalakan suara dan musik' : 'Matikan suara dan musik'}
      title={muted ? 'Nyalakan suara dan musik' : 'Matikan suara dan musik'}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M4 9.5h3.2L12 5.6v12.8L7.2 14.5H4z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
        {muted ? (
          <g stroke="currentColor" strokeLinecap="round" strokeWidth="2">
            <line x1="16" y1="9" x2="21" y2="15" />
            <line x1="21" y1="9" x2="16" y2="15" />
          </g>
        ) : (
          <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
            <path d="M15.6 9.2a4.4 4.4 0 0 1 0 5.6" />
            <path d="M18.3 6.6a8 8 0 0 1 0 10.8" />
          </g>
        )}
      </svg>
    </button>
  );
}
