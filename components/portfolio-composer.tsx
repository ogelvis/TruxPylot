'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const MAX_IMAGES = 5;
const MAX_CAPTION = 1000;

export function PortfolioComposer() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!picked.length) return;
    setError('');
    const combined = [...files, ...picked].slice(0, MAX_IMAGES);
    if (files.length + picked.length > MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images per post — the rest were skipped.`);
    }
    setFiles(combined);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
  }

  function removeImage(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (!files.length) {
      setError('Add at least one photo of the job.');
      return;
    }
    setError('');
    setPosting(true);
    const body = new FormData();
    body.append('caption', caption);
    files.forEach(f => body.append('images', f));
    try {
      const r = await fetch('/api/professional/portfolio', { method: 'POST', body });
      const d = await r.json().catch(() => ({ error: 'Could not post. Please try again.' }));
      if (!r.ok) {
        setError(d.error || 'Could not post. Please try again.');
        return;
      }
      setFiles([]);
      setPreviews([]);
      setCaption('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="portfolio-composer">
      {previews.length > 0 && (
        <div className="portfolio-composer-previews">
          {previews.map((src, i) => (
            <div className="portfolio-composer-preview" key={src}>
              <img src={src} alt="" />
              <button type="button" onClick={() => removeImage(i)} aria-label="Remove image">×</button>
            </div>
          ))}
        </div>
      )}
      <textarea
        className="portfolio-composer-caption"
        placeholder="Tell customers about this job — what you did, materials used, before/after…"
        value={caption}
        maxLength={MAX_CAPTION}
        onChange={e => setCaption(e.target.value)}
        rows={3}
      />
      <div className="portfolio-composer-footer">
        <span className="portfolio-composer-count">{caption.length}/{MAX_CAPTION}</span>
        <div className="portfolio-composer-actions">
          <button type="button" className="secondary" onClick={() => inputRef.current?.click()} disabled={posting || files.length >= MAX_IMAGES}>
            {files.length ? `${files.length}/${MAX_IMAGES} photos` : 'Add photos'}
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={onPickFiles} />
          <button type="button" className="primary" onClick={submit} disabled={posting || !files.length}>
            {posting ? 'Posting…' : 'Post to profile'}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="portfolio-composer-error">{error}</p>}
    </div>
  );
}
