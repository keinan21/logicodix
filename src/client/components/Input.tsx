import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

/** Input — DESIGN §4: default, focus, error. */
export function Input({ label, error, id, ...rest }: InputProps) {
  const inputId = id ?? `input-${label}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label htmlFor={inputId} style={{ font: 'var(--text-label)', color: 'var(--color-muted)' }}>
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        style={{
          minHeight: 48,
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: `2px solid ${error ? 'var(--color-err-600)' : 'var(--color-line)'}`,
          fontSize: '1rem',
        }}
        {...rest}
      />
      {error ? (
        <span
          id={`${inputId}-error`}
          role="alert"
          style={{ color: 'var(--color-err-600)', font: 'var(--text-small)' }}
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
