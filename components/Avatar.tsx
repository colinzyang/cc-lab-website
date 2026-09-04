import React from 'react';

interface AvatarProps {
  name: string;
  image?: string;
  /** Classes applied to the rendered <img>/<svg>; defaults to the circular photo style with hover zoom */
  className?: string;
}

// Curated palette — white initials pass contrast on every color
const AVATAR_PALETTE = [
  '#004a99', // primary blue
  '#0e7490', // teal
  '#4338ca', // indigo
  '#7c3aed', // violet
  '#b91c1c', // red
  '#be185d', // pink
  '#15803d', // green
  '#b45309', // amber
];

const DEFAULT_IMG_CLASSES = 'w-full h-full object-cover transition-transform duration-700 hover:scale-110';

// Deterministic color per name so a person always gets the same avatar
const colorForName = (name: string): string => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const initialForName = (name: string): string => {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

/**
 * Member photo with an automatic initial-based fallback avatar.
 * Fills its parent (parent controls aspect ratio / rounding / overflow).
 * Falls back to the initial avatar when no image is set or the image fails to load.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, image, className }) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    setFailed(false);
  }, [image]);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={name}
        onError={() => setFailed(true)}
        className={className ?? DEFAULT_IMG_CLASSES}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={name}
      className={`${className ?? DEFAULT_IMG_CLASSES} select-none`}
    >
      <rect width="100" height="100" fill={colorForName(name)} />
      <text
        x="50"
        y="50"
        dy="0.36em"
        textAnchor="middle"
        fontSize="42"
        fontWeight="700"
        fill="#ffffff"
      >
        {initialForName(name)}
      </text>
    </svg>
  );
};
