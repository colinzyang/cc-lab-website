import React, { useState } from 'react';

// Lab authors to highlight (bold) in publication author lists. Published author strings
// are spelled inconsistently, so we match against a set of normalized variants. To highlight
// additional lab members, append their published name variants here.
const LAB_AUTHOR_ALIASES = new Set([
  'kevin c chan',
  'kevin chun chan',
  'chun chan',
  'kevin chan',
]);

const COLLAPSE_THRESHOLD = 8; // lists longer than this collapse
const FIRST_COUNT = 3;
const LAST_COUNT = 2;

const normalize = (name: string): string =>
  name.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();

const isLabAuthor = (name: string): boolean => LAB_AUTHOR_ALIASES.has(normalize(name));

const renderName = (name: string): React.ReactNode =>
  isLabAuthor(name)
    ? <strong className="font-semibold text-slate-900 dark:text-text">{name}</strong>
    : name;

interface AuthorListProps {
  authors?: string;
}

export const AuthorList: React.FC<AuthorListProps> = ({ authors }) => {
  const [expanded, setExpanded] = useState(false);
  const names = (authors || '').split(', ').filter(Boolean);

  const baseClass = 'text-slate-600 dark:text-subtext mb-1';

  // Short list, or expanded: render every author.
  if (names.length <= COLLAPSE_THRESHOLD || expanded) {
    return (
      <p className={baseClass}>
        {names.map((name, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && ', '}
            {renderName(name)}
          </React.Fragment>
        ))}
        {expanded && names.length > COLLAPSE_THRESHOLD && (
          <>
            {' '}
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-primary dark:text-primary-dark text-xs font-bold uppercase tracking-wider hover:underline"
            >
              show less
            </button>
          </>
        )}
      </p>
    );
  }

  // Collapsed: keep the first few, the last few, and any lab author (so the PI stays visible
  // even when buried in the middle). Collapse each run of hidden authors into one clickable "…".
  const visible = new Set<number>();
  for (let i = 0; i < FIRST_COUNT; i++) visible.add(i);
  for (let i = names.length - LAST_COUNT; i < names.length; i++) visible.add(i);
  names.forEach((name, idx) => {
    if (isLabAuthor(name)) visible.add(idx);
  });

  const parts: React.ReactNode[] = [];
  let i = 0;
  let first = true;
  while (i < names.length) {
    if (visible.has(i)) {
      if (!first) parts.push(', ');
      parts.push(<React.Fragment key={`a-${i}`}>{renderName(names[i])}</React.Fragment>);
      first = false;
      i++;
    } else {
      if (!first) parts.push(', ');
      parts.push(
        <button
          key={`e-${i}`}
          type="button"
          onClick={() => setExpanded(true)}
          className="text-primary dark:text-primary-dark hover:underline"
          aria-label="Show all authors"
        >
          …
        </button>
      );
      first = false;
      while (i < names.length && !visible.has(i)) i++;
    }
  }

  return (
    <p className={baseClass}>
      {parts}
      {' '}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="text-primary dark:text-primary-dark text-xs font-bold uppercase tracking-wider hover:underline"
      >
        show all {names.length} authors
      </button>
    </p>
  );
};
