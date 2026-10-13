import markUrl from '../assets/brook-mark.png';
import logoUrl from '../assets/brook-logo.png';

// Brand artwork is generated from build/brand/logo-source.webp by scripts/generate-brand-assets.mjs.

/** The Brook mark: top hat, treble-clef "B" and skull, on a transparent background. */
export function BrandMark({ size = 24, className = '' }) {
  return <img className={`brand-mark ${className}`} src={markUrl} width={size} height={size} alt="" aria-hidden draggable={false} />;
}

export function BrandLogo({ className = '' }) {
  return <img className={`brand-logo ${className}`} src={logoUrl} alt="Brook — your music lives on" draggable={false} />;
}

export function Wordmark({ className = '' }) {
  return (
    <span className={`wordmark ${className}`}>
      <BrandMark size={30} />
      <span className="wordmark__text">Brook</span>
    </span>
  );
}
