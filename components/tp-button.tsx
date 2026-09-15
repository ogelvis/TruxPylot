import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './tp-button.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & { href?: undefined };

type ButtonAsLink = CommonProps & { href: string; target?: string };

/**
 * TruxPylot button primitive. Use this for any new/redesigned screen
 * instead of ad-hoc <button className="..."> markup, so the app
 * converges on one consistent, touch-friendly button system.
 *
 *   <TpButton variant="primary" size="lg" fullWidth>Find a Professional</TpButton>
 *   <TpButton variant="secondary" href="/marketplace">View Details</TpButton>
 *   <TpButton variant="destructive" size="sm">Remove</TpButton>
 */
export function TpButton(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    icon,
    children,
    className = '',
  } = props;

  const classes = [
    'tp-btn',
    `tp-btn--${variant}`,
    `tp-btn--${size}`,
    fullWidth ? 'tp-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading ? <span className="tp-btn__spinner" aria-hidden="true" /> : icon}
      <span>{children}</span>
    </>
  );

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} target={props.target} className={classes} aria-disabled={loading}>
        {content}
      </Link>
    );
  }

  const { href: _href, variant: _v, size: _s, fullWidth: _fw, loading: _l, icon: _i, className: _c, children: _ch, ...rest } =
    props as ButtonAsButton;

  return (
    <button className={classes} disabled={loading || rest.disabled} {...rest}>
      {content}
    </button>
  );
}
