import React from 'react';
import { Plus } from 'lucide-react';

export default function FloatingActionButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-4 sm:right-[calc(50%-280px)] z-30 w-14 h-14 rounded-full bg-accent hover:bg-accent-light shadow-lg flex items-center justify-center transition-all duration-150 active:scale-95"
      aria-label="Nieuw bericht"
    >
      <Plus className="w-7 h-7 text-white" />
    </button>
  );
}
