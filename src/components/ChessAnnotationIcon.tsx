import React from 'react';
import { AnnotationType } from '../types';

interface ChessAnnotationIconProps {
  type: AnnotationType | 'forced' | 'excellent' | 'good' | 'missed' | 'miss';
  className?: string;
  size?: number | string;
  glow?: boolean | 'board';
}

// Strictly maps requested types directly to your hosted ImgBB PNG assets
const PNG_MAP: Record<string, string> = {
  mistake: 'https://i.ibb.co/DHH8jdkd/mistake.png',
  inaccuracy: 'https://i.ibb.co/hFD9BHmk/inaccuracy.png',
  miss: 'https://i.ibb.co/206mzLNh/miss.png',
  missed: 'https://i.ibb.co/206mzLNh/miss.png',
  great: 'https://i.ibb.co/Qjp8GkyD/great.png',
  good: 'https://i.ibb.co/BKPWSFKw/good.png',
  forced: 'https://i.ibb.co/ymbR1kf0/forced.png',
  excellent: 'https://i.ibb.co/fdJjxcyL/excellent.png',
  book: 'https://i.ibb.co/VcgB9hH9/book.png',
  best: 'https://i.ibb.co/vxm4DLY0/best.png',
  blunder: 'https://i.ibb.co/vxnsV4bk/blunder.png',
  brilliant: 'https://i.ibb.co/PG9P84Y9/brilliant.png',
};

// Color-matched vibrant glow tokens for each annotation category
const GLOW_COLOR_MAP: Record<string, string> = {
  brilliant: 'rgba(34, 211, 238, 0.85)',
  great: 'rgba(96, 165, 250, 0.82)',
  best: 'rgba(132, 204, 22, 0.85)',
  excellent: 'rgba(163, 230, 53, 0.78)',
  good: 'rgba(134, 239, 172, 0.68)',
  book: 'rgba(217, 170, 115, 0.72)',
  inaccuracy: 'rgba(250, 204, 21, 0.85)',
  mistake: 'rgba(249, 115, 22, 0.88)',
  miss: 'rgba(251, 113, 133, 0.85)',
  missed: 'rgba(251, 113, 133, 0.85)',
  blunder: 'rgba(239, 68, 68, 0.92)',
  forced: 'rgba(134, 239, 172, 0.72)',
};

export default function ChessAnnotationIcon({
  type,
  className = '',
  size = '1rem',
  glow = true,
}: ChessAnnotationIconProps) {
  // Normalize key to lower case just in case your enum handles uppercase strings
  const lookupKey = typeof type === 'string' ? type.toLowerCase() : type;
  const imgSrc = PNG_MAP[lookupKey];

  if (!imgSrc) {
    return null;
  }

  // Normalize all 11 hosted PNG assets so their visible circular badge renders at an
  // equal ~84% of the container box despite differing source aspect ratios & padding:
  // - miss/missed: 498x498 full-bleed (100% fill) -> scale(0.84)
  // - book: 360x360 (~94.5% fill, slightly top-shifted) -> scale(0.89) translateY(2.2%)
  // - all others: 768x1024 (75% width fill inside square object-contain) -> scale(1.12)
  const imageTransform =
    lookupKey === 'miss' || lookupKey === 'missed'
      ? 'scale(0.84)'
      : lookupKey === 'book'
        ? 'scale(0.89) translateY(2.2%)'
        : 'scale(1.12)';

  const glowColor = GLOW_COLOR_MAP[lookupKey] || 'rgba(255, 255, 255, 0.5)';
  const filterStyle =
    glow === 'board'
      ? `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 2px 3px rgba(0,0,0,0.45)) brightness(1.06) saturate(1.12)`
      : glow
        ? `drop-shadow(0 0 3.5px ${glowColor})`
        : undefined;

  return (
    <div
      className={`inline-flex items-center justify-center select-none shrink-0 pointer-events-none align-middle ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={`${type} annotation`}
        className="w-full h-full object-contain"
        style={{
          transform: imageTransform,
          filter: filterStyle,
        }}
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}