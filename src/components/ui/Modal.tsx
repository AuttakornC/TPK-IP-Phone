'use client';

import { type ReactNode } from 'react';

type Variant = 'light' | 'admin';
type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

interface Props {
  open: boolean;
  onClose?: () => void;
  size?: Size;
  variant?: Variant;
  align?: 'center' | 'bottom';
  children: ReactNode;
}

export default function Modal({
  open,
  onClose,
  size = 'md',
  variant = 'light',
  align = 'center',
  children,
}: Props) {
  if (!open) return null;

  const wrapper =
    align === 'bottom'
      ? 'flex items-end sm:items-center justify-center p-0 sm:p-4'
      : 'flex items-center justify-center p-4';
  const card =
    variant === 'admin'
      ? 'bg-white text-slate-800 w-full rounded-2xl shadow-2xl overflow-hidden'
      : 'bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden';

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm ${wrapper}`}
      onClick={onClose}
    >
      <div
        className={`${card} ${SIZE_CLASS[size]}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
