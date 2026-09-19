'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Comment = { id: string; authorName: string; body: string; createdAt: string };

export function PortfolioPost({
  id,
  images,
  caption,
  dateLabel,
  initialLikeCount,
  initialLiked,
  initialComments,
  canInteract,
  deletable,
  approved = true,
}: {
  id: string;
  images: string[];
  caption: string | null;
  dateLabel: string;
  initialLikeCount: number;
  initialLiked: boolean;
  initialComments: Comment[];
  canInteract: boolean;
  deletable?: boolean;
  approved?: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState('');

  async function toggleLike() {
    if (!canInteract || busy) return;
    setBusy(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      const r = await fetch(`/api/marketplace/posts/${id}/like`, { method: 'POST' });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d) throw new Error();
      setLiked(d.liked);
      setLikeCount(d.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setBusy(false);
    }
  }

  async function submitComment() {
    const body = commentText.trim();
    if (!body || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/marketplace/posts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d) {
        setError(d?.error || 'Could not post your comment.');
        return;
      }
      setComments(prev => [...prev, d.comment]);
      setCommentText('');
      setShowComments(true);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function deletePost() {
    if (!confirm('Remove this post from your public profile?')) return;
    setBusy(true);
    try {
      await fetch(`/api/professional/portfolio/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="social-post">
      {images.length > 0 && (
        <div className="social-post-media">
          <img src={images[activeImage]} alt="" />
          {images.length > 1 && (
            <>
              <div className="social-post-dots">
                {images.map((_, i) => (
                  <button key={i} type="button" className={i === activeImage ? 'active' : ''} onClick={() => setActiveImage(i)} aria-label={`Photo ${i + 1}`} />
                ))}
              </div>
              <span className="social-post-count">{activeImage + 1}/{images.length}</span>
            </>
          )}
          {deletable && (
            <button type="button" className="social-post-delete" onClick={deletePost} disabled={busy} aria-label="Delete post">🗑</button>
          )}
          {!approved && <span className="social-post-pending">Pending review</span>}
        </div>
      )}
      <div className="social-post-body">
        {caption && <p className="social-post-caption">{caption}</p>}
        <div className="social-post-meta">
          <button type="button" className={`social-post-like ${liked ? 'liked' : ''}`} onClick={toggleLike} disabled={!canInteract || busy}>
            <span>{liked ? '♥' : '♡'}</span> {likeCount > 0 ? likeCount : ''} {likeCount === 1 ? 'like' : 'likes'}
          </button>
          <button type="button" className="social-post-comment-toggle" onClick={() => setShowComments(s => !s)}>
            💬 {comments.length > 0 ? comments.length : ''} {comments.length === 1 ? 'comment' : 'comments'}
          </button>
          <span className="social-post-date">{dateLabel}</span>
        </div>

        {showComments && (
          <div className="social-post-comments">
            {comments.length === 0 && <p className="social-post-no-comments">No comments yet.</p>}
            {comments.map(c => (
              <div className="social-post-comment" key={c.id}>
                <b>{c.authorName}</b>
                <span>{c.body}</span>
              </div>
            ))}
          </div>
        )}

        {canInteract ? (
          <div className="social-post-add-comment">
            <input
              type="text"
              placeholder="Add a comment…"
              value={commentText}
              maxLength={500}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitComment(); }}
            />
            <button type="button" onClick={submitComment} disabled={busy || !commentText.trim()}>Post</button>
          </div>
        ) : (
          <p className="social-post-signin-hint"><a href="/login">Sign in</a> to like or comment.</p>
        )}
        {error && <p role="alert" className="social-post-error">{error}</p>}
      </div>
    </article>
  );
}
