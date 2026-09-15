import type { ReactNode } from 'react';
import './tp-card.css';

type IconTone = 'default' | 'success' | 'warning' | 'error' | 'premium';
type IconSize = 'sm' | 'md' | 'lg';

/** Round icon container — the one consistent icon language for nav/actions. */
export function TpIcon({
  children,
  tone = 'default',
  size = 'md',
}: {
  children: ReactNode;
  tone?: IconTone;
  size?: IconSize;
}) {
  const toneClass = tone === 'default' ? '' : `tp-icon--${tone}`;
  return <span className={`tp-icon tp-icon--${size} ${toneClass}`}>{children}</span>;
}

/** Small status pill, e.g. "Pending", "Verified", "3 unread". */
export function TpBadge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: IconTone;
}) {
  const toneClass = tone === 'default' ? '' : `tp-badge--${tone}`;
  return <span className={`tp-badge ${toneClass}`}>{children}</span>;
}

/**
 * Standard TruxPylot card. Answers "what is this / why does it
 * matter / what can I do next" — an icon + title + subtitle, an
 * optional status badge, and up to one primary + one secondary
 * action. Don't stuff more than one primary action into a card.
 */
export function TpCard({
  icon,
  title,
  subtitle,
  badge,
  actions,
  interactive = false,
  children,
  className = '',
}: {
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  interactive?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`tp-card ${interactive ? 'tp-card--interactive' : ''} ${className}`}>
      {(icon || title || subtitle || badge) && (
        <div className="tp-card__row">
          {icon}
          <div className="tp-card__body">
            {title && <p className="tp-card__title">{title}</p>}
            {subtitle && <p className="tp-card__subtitle">{subtitle}</p>}
            {badge}
          </div>
        </div>
      )}
      {children}
      {actions && <div className="tp-card__actions">{actions}</div>}
    </div>
  );
}

/** Empty state with a clear next action — never leave a section blank. */
export function TpEmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="tp-empty">
      {icon}
      <p className="tp-empty__title">{title}</p>
      {text && <p className="tp-empty__text">{text}</p>}
      {action}
    </div>
  );
}
