import React from 'react';
import { Avatar } from './Avatar';

interface FlipCardProps {
  name: string;
  image?: string;
  /** Short self-intro shown on the back of the card (Member.card_text) */
  cardText: string;
  /** Title/role line shown below the photo on the front face */
  title?: string;
  /** Optional interest line shown below the title on the front face */
  interest?: string;
}

/**
 * Member grid flip card occupying the whole grid cell.
 * Front: circular photo + name + title (+ interest) — visually identical to a
 * non-flip member cell. Back: a rounded rectangle covering the entire cell
 * (photo + text rows) with the member's short self-intro, maximizing space.
 * Flips on hover (pointer devices) and on click / tap / Enter / Space (all devices).
 * Clicking locks the flipped state so the back stays visible after the pointer leaves.
 * Only rendered for members with a non-empty `card_text`.
 */
export const FlipCard: React.FC<FlipCardProps> = ({ name, image, cardText, title, interest }) => {
  const [flipped, setFlipped] = React.useState(false);

  const toggle = () => setFlipped(prev => !prev);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <div
      className="@container group [perspective:1200px] cursor-pointer select-none outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-dark"
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`Flip card to read ${name}'s introduction`}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      {/* Class names must stay as complete strings — concatenating them inline
          with template literals hides them from Tailwind's source scanner. */}
      <div
        className={[
          'relative transform-3d transition-transform duration-500',
          'group-hover:rotate-y-180',
          flipped ? 'rotate-y-180' : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Front — photo + text rows; in normal flow so it sets the card height.
            Renders exactly like a non-flip member cell. */}
        <div className="backface-hidden">
          <div className="aspect-square overflow-hidden rounded-full bg-gray-100 dark:bg-surface mb-5">
            <Avatar name={name} image={image} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-text leading-tight">{name}</h3>
          {title && <p className="text-primary dark:text-primary-dark font-medium text-sm my-1">{title}</p>}
          {interest && <p className="text-sm text-slate-500 dark:text-subtext leading-snug">{interest}</p>}
        </div>
        {/* Back — name header + intro text, filling the whole cell area.
            Typography follows the CARD size (container query), not the viewport:
            narrow cards (2-col mobile, or 5-col on smaller laptops) get compact
            type; wide cards get comfortable type. flex-1 min-h-0 bounds the text
            region so line-clamp's line budget can never exceed the card height.
            Design system: subtle vertical gradient for depth, slim primary accent
            line above the name (same intensity as hover:border-primary/30 on
            Research/Resources cards). */}
        <div className="absolute inset-0 rounded-lg overflow-hidden backface-hidden rotate-y-180 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-surface-1 dark:to-surface border border-gray-200 dark:border-border flex flex-col p-3 @min-[200px]:p-4">
          <span aria-hidden="true" className="w-6 h-0.5 rounded-full bg-primary dark:bg-primary-dark opacity-50 mx-auto mb-2 shrink-0" />
          <p className="text-xs @min-[200px]:text-sm font-bold text-slate-900 dark:text-text text-center leading-none pb-1.5 mb-1.5 border-b border-gray-200/70 dark:border-border shrink-0">{name}</p>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <p className="text-xs leading-snug @min-[200px]:text-sm @min-[200px]:leading-relaxed text-slate-600 dark:text-subtext max-h-full overflow-hidden line-clamp-12 text-center">{cardText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
