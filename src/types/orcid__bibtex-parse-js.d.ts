/**
 * Type declarations for @orcid/bibtex-parse-js (untyped CommonJS library).
 * Runtime shape: module.exports = { toJSON, toBibtex }.
 */
declare module '@orcid/bibtex-parse-js' {
  /** A single parsed BibTeX entry, as produced by toJSON(). */
  export interface BibTeXEntry {
    /** Entry type, e.g. "article", "inproceedings", "misc". */
    entryType?: string;
    /** Citation key, e.g. "chan2024". */
    citationKey?: string;
    /** Raw tag map: field name -> value, e.g. { title: '...', year: '2024' }. */
    entryTags?: Record<string, string>;
  }

  /** Parse a BibTeX string into JSON entries. */
  export function toJSON(bibtex: string): BibTeXEntry[] | BibTeXEntry;

  /** Serialise JSON entries back into a BibTeX string. */
  export function toBibtex(json: BibTeXEntry[], compact?: boolean): string;
}
