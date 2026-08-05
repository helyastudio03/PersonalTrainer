import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-ash-200 rounded-xl p-3 shadow-sm ${className}`}>
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
    primary: 'bg-ember-600 text-ash-100 hover:bg-ember-700',
    secondary: 'bg-ash-200 text-ash-800 hover:bg-ash-300',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
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
    secondary: 'text-ash-600',
    danger: 'text-red-600',
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
      className={`w-full px-3 py-1.5 rounded-lg border border-ash-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ember-500 ${props.className ?? ''}`}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="block text-xs font-medium text-ash-600 mb-1">{children}</label>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="text-center py-6 text-sm text-ash-500 border border-dashed border-ash-300 rounded-xl">
      {children}
    </div>
  );
}

// Couleur sobre/pastel utilisée pour toutes les indications de record
// (étoile plate), volontairement en dehors de la palette ember/ash pour
// rester discrète sans être criarde comme l'emoji ⭐.
export const RECORD_COLOR = '#a3823f';

// Étoile plate (path SVG, pas d'emoji) pour indiquer un record personnel,
// en flat design sobre plutôt que l'emoji ⭐ (trop voyant/glossy).
export function RecordStar({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="0.85em"
      height="0.85em"
      fill="currentColor"
      className={`inline-block align-[-0.05em] ${className}`}
      aria-hidden="true"
    >
      <path d="M12 2 14.9 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.1 8.6 12 2Z" />
    </svg>
  );
}
