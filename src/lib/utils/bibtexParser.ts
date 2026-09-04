/**
 * BibTeX Parser Utility
 * Parses BibTeX entries and converts them to the publication JSON schema
 */

import * as bibtexParse from '@orcid/bibtex-parse-js';

// Types for parsed publication data
export interface ParsedPublication {
  id: number;
  title: string;
  journal: string;
  date: string;
  year: number;
  authors: string;
  link?: string;
  doi?: string;
  preprint_url?: string;
  preprint_label?: string;
  image?: string;
  bibtexKey?: string;
}

export interface ParseResult {
  success: boolean;
  entries: ParsedPublication[];
  errors: string[];
}

// Month name mappings for date formatting
const MONTH_NAMES: Record<string, string> = {
  '1': 'Jan', '01': 'Jan', 'jan': 'Jan', 'january': 'Jan',
  '2': 'Feb', '02': 'Feb', 'feb': 'Feb', 'february': 'Feb',
  '3': 'Mar', '03': 'Mar', 'mar': 'Mar', 'march': 'Mar',
  '4': 'Apr', '04': 'Apr', 'apr': 'Apr', 'april': 'Apr',
  '5': 'May', '05': 'May', 'may': 'May',
  '6': 'Jun', '06': 'Jun', 'jun': 'Jun', 'june': 'Jun',
  '7': 'Jul', '07': 'Jul', 'jul': 'Jul', 'july': 'Jul',
  '8': 'Aug', '08': 'Aug', 'aug': 'Aug', 'august': 'Aug',
  '9': 'Sep', '09': 'Sep', 'sep': 'Sep', 'september': 'Sep',
  '10': 'Oct', 'oct': 'Oct', 'october': 'Oct',
  '11': 'Nov', 'nov': 'Nov', 'november': 'Nov',
  '12': 'Dec', 'dec': 'Dec', 'december': 'Dec',
};

/**
 * Remove LaTeX formatting braces from text
 * e.g., "{A Great Paper}" -> "A Great Paper"
 */
export function removeLatexBraces(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{/g, '')
    .replace(/\}/g, '')
    .replace(/\\\\/g, ' ')
    .replace(/\\-/g, '-')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert BibTeX author format to display format
 * BibTeX: "Last, First and Last2, First2" or "First Last and First2 Last2"
 * Output: "First Last, First Last2"
 */
export function convertAuthorFormat(authors: string): string {
  if (!authors) return '';

  // Remove LaTeX braces first
  let cleaned = removeLatexBraces(authors);

  // Split by ' and ' (case insensitive) or ' AND '
  const authorList = cleaned.split(/\s+and\s+/i).map(a => a.trim()).filter(a => a);

  const formattedAuthors = authorList.map(author => {
    // Check if it's in "Last, First" format
    if (author.includes(',')) {
      const parts = author.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        // "Last, First" -> "First Last"
        // Handle "Last, Jr, First" format
        if (parts.length === 3) {
          return `${parts[2]} ${parts[1]} ${parts[0]}`;
        }
        return `${parts[1]} ${parts[0]}`;
      }
    }
    // Already in "First Last" format or unknown format
    return author;
  });

  return formattedAuthors.join(', ');
}

/**
 * Format month and year into a date string
 * e.g., ("jan", 2024) -> "Jan 2024"
 */
export function formatDate(month: string | undefined, year: number): string {
  if (!month) {
    return String(year);
  }

  const monthStr = String(month).toLowerCase().trim();
  const monthName = MONTH_NAMES[monthStr] || monthStr.charAt(0).toUpperCase() + monthStr.slice(1);

  return `${monthName} ${year}`;
}

/**
 * Detect preprint service from eprint field
 * Returns URL and label for the preprint
 */
export function detectPreprint(
  eprint: string | undefined,
  eprinttype: string | undefined
): { url: string; label: string } | null {
  if (!eprint) return null;

  const type = (eprinttype || '').toLowerCase();

  if (type === 'arxiv') {
    return {
      url: `https://arxiv.org/abs/${eprint}`,
      label: 'arXiv'
    };
  }

  if (type === 'biorxiv') {
    return {
      url: `https://www.biorxiv.org/content/10.1101/${eprint}`,
      label: 'bioRxiv'
    };
  }

  if (type === 'chemrxiv') {
    return {
      url: `https://chemrxiv.org/engage/chemrxiv/article-details/${eprint}`,
      label: 'ChemRxiv'
    };
  }

  // Try to auto-detect from eprint format
  if (eprint.match(/^\d{4}\.\d{4,5}$/)) {
    // Looks like arXiv ID (e.g., "2023.12345")
    return {
      url: `https://arxiv.org/abs/${eprint}`,
      label: 'arXiv'
    };
  }

  return null;
}

/**
 * Parse a single BibTeX entry into our publication format
 */
function parseBibtexEntry(entry: bibtexParse.BibTeXEntry, id: number): ParsedPublication | null {
  try {
    const fields = entry.entryTags || {};

    // Extract required fields
    const title = removeLatexBraces(fields.title || fields.TITLE || '');
    if (!title) {
      return null; // Skip entries without title
    }

    const year = parseInt(fields.year || fields.YEAR || '0', 10);
    if (!year) {
      return null; // Skip entries without year
    }

    // Get journal/booktitle
    const journal = removeLatexBraces(
      fields.journal || fields.JOURNAL ||
      fields.booktitle || fields.BOOKTITLE ||
      ''
    );

    // Process authors
    const rawAuthors = fields.author || fields.AUTHOR || '';
    const authors = convertAuthorFormat(rawAuthors);

    // Process DOI
    const doi = fields.doi || fields.DOI || '';
    const link = doi ? `https://doi.org/${doi}` : (fields.url || fields.URL || '');

    // Format date
    const month = fields.month || fields.MONTH;
    const date = formatDate(month, year);

    // Detect preprint
    const eprint = fields.eprint || fields.EPRINT;
    const eprinttype = fields.eprinttype || fields.EPRINTTYPE || fields.archiveprefix || fields.ARCHIVEPREFIX;
    const preprint = detectPreprint(eprint, eprinttype);

    const publication: ParsedPublication = {
      id,
      title,
      journal,
      date,
      year,
      authors,
      link,
      image: '/assets/images/papers/default.jpg', // Default image
      bibtexKey: entry.citationKey?.toLowerCase(),
    };

    if (doi) {
      publication.doi = doi;
    }

    if (preprint) {
      publication.preprint_url = preprint.url;
      publication.preprint_label = preprint.label;
    }

    return publication;
  } catch (error) {
    console.error('Error parsing BibTeX entry:', error);
    return null;
  }
}

/**
 * Parse a BibTeX string containing multiple entries
 * @param bibtexString - Raw BibTeX content
 * @param startId - Starting ID for generated publications
 * @returns ParseResult with entries and any errors
 */
export function parseBibtexString(bibtexString: string, startId: number = 1): ParseResult {
  const entries: ParsedPublication[] = [];
  const errors: string[] = [];

  try {
    const parsed = bibtexParse.toJSON(bibtexString);

    if (!Array.isArray(parsed)) {
      // Handle case where a single entry is returned as object
      const singleEntry = parsed;
      if (singleEntry) {
        const pub = parseBibtexEntry(singleEntry, startId);
        if (pub) {
          entries.push(pub);
        } else {
          errors.push('Failed to parse entry: missing required fields (title/year)');
        }
      }
    } else {
      parsed.forEach((entry: bibtexParse.BibTeXEntry, index: number) => {
        const pub = parseBibtexEntry(entry, startId + index);
        if (pub) {
          entries.push(pub);
        } else {
          const key = entry.citationKey || `entry ${index + 1}`;
          errors.push(`Failed to parse "${key}": missing required fields (title/year)`);
        }
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    errors.push(`BibTeX parsing error: ${errorMessage}`);
  }

  return {
    success: errors.length === 0,
    entries,
    errors,
  };
}

/**
 * Check for duplicate publications based on DOI or title
 * @param newPub - New publication to check
 * @param existingPubs - List of existing publications
 * @returns true if duplicate found
 */
export function isDuplicate(newPub: ParsedPublication, existingPubs: ParsedPublication[]): boolean {
  return existingPubs.some(existing => {
    // Check DOI match (case-insensitive)
    if (newPub.doi && existing.doi) {
      if (newPub.doi.toLowerCase() === existing.doi.toLowerCase()) {
        return true;
      }
    }

    // Check normalized title match
    const normalizeTitle = (title: string) =>
      title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const newTitle = normalizeTitle(newPub.title);
    const existingTitle = normalizeTitle(existing.title);

    if (newTitle === existingTitle && newTitle.length > 0) {
      return true;
    }

    return false;
  });
}

/**
 * Normalize a title for comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type { bibtexParse };
