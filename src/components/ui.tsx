import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-ash-900 border border-ash-700 rounded-xl p-3 shadow-sm ${className}`}>
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
    primary: 'bg-ember-600 text-ash-200 hover:bg-ember-700',
    secondary: 'bg-ash-800 text-ash-100 hover:bg-ash-700',
    danger: 'bg-red-950 text-red-400 hover:bg-red-900',
  };
  return (
    <button
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({
  className = '',
  variant = 'secondary',
  hoverOnly = true,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'secondary' | 'danger';
  hoverOnly?: boolean;
}) {
  const styles = {
    secondary: 'text-ash-300',
    danger: 'text-red-400',
  };
  const visibility = hoverOnly
    ? 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
    : 'opacity-100';
  return (
    <button
      className={`w-7 h-7 shrink-0 flex items-center justify-center text-sm leading-none transition-opacity disabled:opacity-50 ${styles[variant]} ${visibility} ${className}`}
      {...props}
    />
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-1.5 rounded-lg border border-ash-600 bg-ash-950 text-sm focus:outline-none focus:ring-2 focus:ring-ember-500 ${props.className ?? ''}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-medium text-ash-300 mb-1">{children}</label>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-6 text-sm text-ash-300 border border-dashed border-ash-600 rounded-xl">
      {children}
    </div>
  );
}
