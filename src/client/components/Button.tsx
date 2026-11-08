import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ai';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

/**
 * Button — DESIGN §4: variant primary, secondary, ai; state default/hover/pressed/disabled/focus.
 * Variant "ai" memakai warna ungu khusus AI supaya terlihat di video demo (DESIGN §1).
 */
export function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: 'var(--radius-md)',
    border: '2px solid transparent',
    padding: 'var(--space-3) var(--space-4)',
    font: 'var(--text-label)',
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    transition: `background-color var(--motion-fast) ease, transform var(--motion-fast) ease`,
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-forest-700)',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-forest-700)',
      borderColor: 'var(--color-forest-700)',
    },
    ai: {
      backgroundColor: 'var(--color-ai-600)',
      color: '#ffffff',
    },
  };

  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`.trim()}
      style={{ ...base, ...variants[variant], opacity: rest.disabled ? 0.5 : 1 }}
      {...rest}
    >
      {children}
    </button>
  );
}
