// renderer/src/components/StarRating.tsx
import React from 'react';

interface Props {
  value: number;
  onChange: (v: number) => void;
  readonly?: boolean;
}

export default function StarRating({ value, onChange, readonly }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={readonly}
          onClick={() => onChange(n === value ? 0 : n)}
          className={`text-lg transition-colors ${
            n <= value ? 'text-amber-400' : 'text-zinc-600'
          } ${readonly ? '' : 'hover:text-amber-300 cursor-pointer'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
