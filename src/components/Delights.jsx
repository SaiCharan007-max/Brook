// Small moments of delight. Most are quiet nods to anime the Brook crew loves:
// One Piece, Bleach, Attack on Titan, JoJo, Cowboy Bebop, Ghibli, Dragon Ball.
// Every animation here respects reduced motion (see motion.css / delight.css).
import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../hooks/usePlayer.js';
import { prefersReducedMotion } from '../app/motion.js';

/** JoJo: when the queue runs out, a "To Be Continued" arrow slides in for a moment. */
export function ToBeContinued() {
  const endedAt = usePlayer((s) => s.endedAt ?? 0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!endedAt || Date.now() - endedAt > 2000) return undefined;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(t);
  }, [endedAt]);
  if (!visible) return null;
  return (
    <div className="tbc" role="status" aria-label="Queue finished">
      <svg viewBox="0 0 220 44" aria-hidden>
        <path d="M2 22 L26 4 L26 14 L216 14 L216 30 L26 30 L26 40 Z" />
      </svg>
      <span>To Be Continued</span>
    </div>
  );
}

/** Bleach: Senbonzakura — a short burst of drifting petals (used when entering Bankai). */
export function Petals({ count = 26 }) {
  const [petals] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.6 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 30,
      size: 7 + Math.random() * 8,
      spin: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360),
    })),
  );
  if (prefersReducedMotion()) return null;
  return (
    <div className="petals" aria-hidden>
      {petals.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.7,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}vw`,
            '--spin': `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

/** One Piece: Brook's top hat, perched on the artwork in Soul King mode. */
export function TopHat({ className = '' }) {
  return (
    <svg className={`tophat ${className}`} viewBox="0 0 64 48" aria-hidden>
      <ellipse cx="32" cy="41" rx="30" ry="6" fill="#16131f" />
      <path d="M14 40 L17 8 Q32 2 47 8 L50 40 Z" fill="#1c1828" />
      <path d="M15.8 30 Q32 35 48.2 30 L48.9 36 Q32 41 15.1 36 Z" fill="#b9a6ff" opacity="0.85" />
      <path d="M17 8 Q32 2 47 8 Q32 12 17 8 Z" fill="#2a2440" />
    </svg>
  );
}

/** Counts up to `value` once when it first appears (library stats). */
export function CountUp({ value, format = (n) => n.toLocaleString(), duration = 900 }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setShown(Math.round(a + (value - a) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/**
 * Light sheen that follows the pointer, plus a gentle 3D tilt. Writes CSS variables only,
 * so React doesn't re-render on mouse move.
 */
export function useTilt(maxDeg = 6) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const onMove = (e) => {
      if (prefersReducedMotion()) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        el.style.setProperty('--rx', `${((0.5 - y) * maxDeg).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((x - 0.5) * maxDeg).toFixed(2)}deg`);
        el.dataset.tilting = 'true';
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      delete el.dataset.tilting;
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [maxDeg]);
  return ref;
}

/** Cowboy Bebop: a farewell card shown for a beat before Brook quits. */
export function Farewell() {
  return (
    <div className="farewell" role="status">
      <span>See you, space cowboy…</span>
    </div>
  );
}

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** Calls onUnlock when the Konami code is typed (ignored while typing in inputs). */
export function useKonami(onUnlock) {
  const cb = useRef(onUnlock);
  cb.current = onUnlock;
  useEffect(() => {
    let pos = 0;
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      // An extra ↑ at the start keeps the sequence alive (↑↑↑↓… still counts).
      if (key === KONAMI[pos]) pos += 1;
      else if (key === 'ArrowUp') pos = pos >= 2 && KONAMI[pos - 1] === 'ArrowUp' ? 2 : 1;
      else pos = 0;
      if (pos === KONAMI.length) {
        pos = 0;
        cb.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
