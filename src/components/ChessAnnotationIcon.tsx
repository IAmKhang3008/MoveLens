import React from 'react';
import { AnnotationType } from '../types';

interface ChessAnnotationIconProps {
  type: AnnotationType | 'forced' | 'excellent' | 'good' | 'missed' | 'miss';
  className?: string;
  size?: number | string;
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
  brilliant: 'https://i.ibb.co/DPmGs4NL/brilliant.png',
};

export default function ChessAnnotationIcon({
  type,
  className = '',
  size = '1.5rem',
}: ChessAnnotationIconProps) {
  // Normalize key to lower case just in case your enum handles uppercase strings
  const lookupKey = typeof type === 'string' ? type.toLowerCase() : type;
  const imgSrc = PNG_MAP[lookupKey];

  if (!imgSrc) {
    return null;
  }

  return (
    <div 
      className={`inline-block select-none shrink-0 pointer-events-none vertical-align-middle ${className}`} 
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={`${type} annotation`}
        className="w-full h-full object-contain"
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}