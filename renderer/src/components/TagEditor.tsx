// renderer/src/components/TagEditor.tsx
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  tags: string[];
  assetId: number;
  onTagsChange: (tags: string[]) => void;
}

export default function TagEditor({ tags, assetId, onTagsChange }: Props) {
  const [input, setInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.dam.getAllTags().then(setAllTags);
  }, []);

  async function addTag() {
    const tag = input.trim();
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    await window.dam.addTag(assetId, tag);
    const next = [...tags, tag];
    onTagsChange(next);
    setAllTags(prev => [...new Set([...prev, tag])].sort());
    setInput('');
  }

  async function removeTag(tag: string) {
    await window.dam.removeTag(assetId, tag);
    onTagsChange(tags.filter(t => t !== tag));
  }

  const suggestions = allTags.filter(
    t => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t)
  ).slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-zinc-700 text-zinc-200 text-xs px-2 py-0.5 rounded-full">
            {tag}
            <button onClick={() => removeTag(tag)} className="text-zinc-400 hover:text-red-400">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="Add tag…"
          className="w-full bg-zinc-800 text-sm text-zinc-200 placeholder-zinc-500 px-2 py-1 rounded focus:outline-none"
        />
        {input && suggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded z-10">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
