import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ai';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

/**
 * Button — DESIGN §4: variant primary, secondary, ai; state default/hover/pressed/disabled/focus.
 * Variant "ai" memakai warna ungu khusus AI supaya terlihat di video demo (DESIGN §1).
 * Tampilan chunky (border cokelat tebal + bayangan bawah) ada di `.btn` (styles.css).
 */
export function Button({ variant = 'primary', children, className = '', ...rest }: ButtonProps) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
