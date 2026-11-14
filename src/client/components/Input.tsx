import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

/** Input — DESIGN §4: default, focus, error. Tampilan ada di `.field` (styles.css). */
export function Input({ label, error, id, ...rest }: InputProps) {
  const inputId = id ?? `input-${label}`;
  return (
    <div className="field">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <input
        id={inputId}
        className="field-control"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} role="alert" className="field-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}
