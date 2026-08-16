import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AppData } from '../types';
import { getSuggestions, isNewUser } from '../lib/suggestions';

export default function HelpPanel({ data }: { data: AppData }) {
  const [open, setOpen] = useState(false);
  const [suggestions] = useState(() => getSuggestions(data));
  const newUser = isNewUser(data);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === 'Escape') {
        // Empêche l'activation du bouton "?" toujours focus (Enter y déclencherait
        // un nouveau clic après la fermeture, ce qui rouvrirait le panneau).
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-ash-500 hover:text-ash-800 hover:bg-ash-100 transition-colors shrink-0"
        aria-label="Aide et suggestions"
        title="Aide et suggestions"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-md w-full shadow-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm">
                {newUser ? 'Pour commencer' : 'Suggestions'}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-ash-500 hover:text-ash-700 text-sm"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2 text-sm text-ash-700">
              {suggestions.map((s, i) => (
                <li key={s.id} className="flex items-start gap-2">
                  {newUser && <span className="font-semibold text-ash-500 shrink-0">{i + 1}.</span>}
                  <span className="flex-1">
                    {s.text}
                    {s.linkTo && (
                      <>
                        {' '}
                        <Link
                          to={s.linkTo}
                          onClick={() => setOpen(false)}
                          className="text-ember-600 font-medium hover:underline whitespace-nowrap"
                        >
                          {s.linkLabel} →
                        </Link>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full text-center text-sm font-semibold text-ash-600 hover:text-ash-800 bg-ash-100 hover:bg-ash-200 rounded-lg py-2 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
