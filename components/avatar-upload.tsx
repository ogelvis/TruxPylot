'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function initials(name: string) {
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function AvatarUpload({ name, currentUrl }: { name: string; currentUrl?: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file next time
    if (!file) return;
    setError('');
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);
    const body = new FormData();
    body.append('avatar', file);
    try {
      const r = await fetch('/api/profile/avatar', { method: 'POST', body });
      const d = await r.json().catch(() => ({ error: 'Upload failed. Please try again.' }));
      if (!r.ok) {
        setError(d.error || 'Upload failed. Please try again.');
        setPreview(currentUrl ?? null);
        return;
      }
      setPreview(d.url);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localPreview);
    }
  }

  return (
    <div className="avatar-editor">
      <div className="avatar-preview-lg">
        {preview ? <img src={preview} alt={name} /> : <span>{initials(name)}</span>}
      </div>
      <div className="avatar-editor-actions">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Change photo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={onChange}
        />
        <p className="hint-text">JPG, PNG, or WEBP. Max 5MB.</p>
        {error && <p className="form-status err">{error}</p>}
      </div>
    </div>
  );
}
