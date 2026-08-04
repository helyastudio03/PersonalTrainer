import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md p-4 shadow-[4px_4px_0_rgba(0,0,0,0.45)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-md before:bg-gradient-to-r before:from-indigo-600 before:via-indigo-400 before:to-indigo-600 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  const styles = {
    primary:
      'bg-gradient-to-b from-indigo-500 to-indigo-700 text-gray-100 hover:from-indigo-400 hover:to-indigo-600 shadow-[2px_2px_0_rgba(0,0,0,0.5)] border border-black/30',
    secondary:
      'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700',
    danger:
      'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 border border-red-500/30',
  };
  return (
    <button
      className={`px-3 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${props.className ?? ''}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
      {children}
    </label>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md">
      {children}
    </div>
  );
}
