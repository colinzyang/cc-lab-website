/**
 * Custom Decap CMS Widget for BibTeX Import
 * This widget allows batch importing BibTeX entries into the publications collection
 */

(function() {
  'use strict';

  // Month name mappings
  const MONTH_NAMES = {
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

  // BibTeX parser functions
  function removeLatexBraces(text) {
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

  function convertAuthorFormat(authors) {
    if (!authors) return '';
    let cleaned = removeLatexBraces(authors);
    const authorList = cleaned.split(/\s+and\s+/i).map(a => a.trim()).filter(a => a);

    const formattedAuthors = authorList.map(author => {
      if (author.includes(',')) {
        const parts = author.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          if (parts.length === 3) {
            return `${parts[2]} ${parts[1]} ${parts[0]}`;
          }
          return `${parts[1]} ${parts[0]}`;
        }
      }
      return author;
    });

    return formattedAuthors.join(', ');
  }

  function formatDate(month, year) {
    if (!month) return String(year);
    const monthStr = String(month).toLowerCase().trim();
    const monthName = MONTH_NAMES[monthStr] || monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    return `${monthName} ${year}`;
  }

  function detectPreprint(eprint, eprinttype) {
    if (!eprint) return null;
    const type = (eprinttype || '').toLowerCase();

    if (type === 'arxiv') {
      return { url: `https://arxiv.org/abs/${eprint}`, label: 'arXiv' };
    }
    if (type === 'biorxiv') {
      return { url: `https://www.biorxiv.org/content/10.1101/${eprint}`, label: 'bioRxiv' };
    }
    if (type === 'chemrxiv') {
      return { url: `https://chemrxiv.org/engage/chemrxiv/article-details/${eprint}`, label: 'ChemRxiv' };
    }
    if (eprint.match(/^\d{4}\.\d{4,5}$/)) {
      return { url: `https://arxiv.org/abs/${eprint}`, label: 'arXiv' };
    }
    return null;
  }

  function parseBibtex(bibtexString, startId) {
    const entries = [];
    const errors = [];

    try {
      // Use the global bibtexParse library loaded from CDN
      const parsed = bibtexParse.toJSON(bibtexString);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      items.forEach((entry, index) => {
        try {
          // bibtex-parse-js uses entryTags, not fields
          const tags = entry.entryTags || entry.fields || {};
          const title = removeLatexBraces(tags.title || tags.TITLE || '');

          if (!title) {
            errors.push(`Entry "${entry.citationKey || entry.key || index + 1}": missing title`);
            return;
          }

          const year = parseInt(tags.year || tags.YEAR || '0', 10);
          if (!year) {
            errors.push(`Entry "${entry.citationKey || entry.key || index + 1}": missing year`);
            return;
          }

          const journal = removeLatexBraces(
            tags.journal || tags.JOURNAL ||
            tags.booktitle || tags.BOOKTITLE || ''
          );
          const rawAuthors = tags.author || tags.AUTHOR || '';
          const authors = convertAuthorFormat(rawAuthors);
          const doi = tags.doi || tags.DOI || '';
          const link = doi ? `https://doi.org/${doi}` : (tags.url || tags.URL || '');
          const month = tags.month || tags.MONTH;
          const date = formatDate(month, year);
          const eprint = tags.eprint || tags.EPRINT;
          const eprinttype = tags.eprinttype || tags.EPRINTTYPE || tags.archiveprefix || tags.ARCHIVEPREFIX;
          const preprint = detectPreprint(eprint, eprinttype);

          const publication = {
            id: startId + index,
            title,
            journal,
            date,
            year,
            authors,
            link,
            doi: doi || undefined,
            preprint_url: preprint ? preprint.url : undefined,
            preprint_label: preprint ? preprint.label : undefined,
            image: '/assets/images/papers/default.jpg',
            bibtexKey: (entry.citationKey || entry.key || '').toLowerCase(),
          };

          // Clean up undefined values
          Object.keys(publication).forEach(key => {
            if (publication[key] === undefined) delete publication[key];
          });

          entries.push(publication);
        } catch (e) {
          errors.push(`Entry "${entry.citationKey || entry.key || index + 1}": ${e.message}`);
        }
      });
    } catch (e) {
      errors.push(`Parsing error: ${e.message}`);
    }

    return { entries, errors };
  }

  function normalizeTitle(title) {
    return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  function isDuplicate(newPub, existingPubs) {
    return existingPubs.some(existing => {
      if (newPub.doi && existing.doi) {
        if (newPub.doi.toLowerCase() === existing.doi.toLowerCase()) return true;
      }
      const newTitle = normalizeTitle(newPub.title);
      const existingTitle = normalizeTitle(existing.title);
      if (newTitle === existingTitle && newTitle.length > 0) return true;
      return false;
    });
  }

  // Create the custom widget control component
  const BibTeXControl = createClass({
    // Provide default value for the widget
    defaultValue: [],

    getInitialState() {
      return {
        bibtexInput: '',
        parsedEntries: [],
        errors: [],
        previewMode: false,
        duplicates: [],
        showSuccessMessage: false,
      };
    },

    // Helper to normalize value to always be an array
    getNormalizedValue() {
      let value = this.props.value;
      console.log('BibTeX Widget - raw props.value type:', typeof value, value);

      if (!value) {
        return [];
      }

      // Handle Immutable.js objects (Decap CMS uses Immutable.js internally)
      if (value && typeof value.toJS === 'function') {
        console.log('BibTeX Widget - detected Immutable.js object, converting');
        value = value.toJS();
      }

      // Handle Proxy objects by JSON serialization
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        try {
          // Check if it's a plain object with publications key
          if (value.publications && Array.isArray(value.publications)) {
            console.log('BibTeX Widget - found publications array in object');
            return value.publications;
          }
          // Try to convert via JSON if it has unusual prototype
          const jsonStr = JSON.stringify(value);
          if (jsonStr && jsonStr !== '{}') {
            const parsed = JSON.parse(jsonStr);
            console.log('BibTeX Widget - JSON parsed value:', parsed);
            if (Array.isArray(parsed)) {
              return parsed;
            }
            if (parsed.publications && Array.isArray(parsed.publications)) {
              return parsed.publications;
            }
          }
        } catch (e) {
          console.warn('BibTeX Widget - JSON conversion failed:', e);
        }
      }

      if (Array.isArray(value)) {
        return value;
      }

      console.warn('BibTeX Widget - unexpected value format:', value);
      return [];
    },

    handleInputChange(e) {
      this.setState({ bibtexInput: e.target.value, previewMode: false });
    },

    handleParse() {
      const { bibtexInput } = this.state;
      console.log('=== handleParse called ===');
      console.log('Input length:', bibtexInput.length);

      if (!bibtexInput.trim()) {
        this.setState({ errors: ['Please enter BibTeX content'], previewMode: false });
        return;
      }

      // Get existing entries to check for duplicates
      const value = this.getNormalizedValue();
      const existingPubs = [];
      value.forEach(yearGroup => {
        if (yearGroup.papers) {
          existingPubs.push(...yearGroup.papers);
        }
      });
      console.log('Existing publications count:', existingPubs.length);

      const result = parseBibtex(bibtexInput, 1);
      console.log('Parsed entries count:', result.entries.length);
      console.log('Parse errors:', result.errors);

      const duplicates = result.entries.filter(entry => isDuplicate(entry, existingPubs));
      console.log('Duplicates found:', duplicates.length);

      this.setState({
        parsedEntries: result.entries,
        errors: result.errors,
        previewMode: true,
        duplicates: duplicates.map(d => d.title),
      });
    },

    handleRemoveEntry(index) {
      const { parsedEntries, duplicates } = this.state;
      const entry = parsedEntries[index];
      const newParsedEntries = parsedEntries.filter((_, i) => i !== index);
      const newDuplicates = duplicates.filter(d => d !== entry.title);
      this.setState({ parsedEntries: newParsedEntries, duplicates: newDuplicates });
    },

    handleEditEntry(index, field, value) {
      const { parsedEntries } = this.state;
      const newEntries = [...parsedEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      this.setState({ parsedEntries: newEntries });
    },

    handleAddToList() {
      const { parsedEntries } = this.state;
      const value = this.getNormalizedValue();

      console.log('=== handleAddToList called ===');
      console.log('parsedEntries count:', parsedEntries.length);
      console.log('parsedEntries:', JSON.stringify(parsedEntries, null, 2));
      console.log('current value (existing publications):', JSON.stringify(value, null, 2));

      if (parsedEntries.length === 0) {
        console.warn('handleAddToList - No parsed entries to add');
        return;
      }

      // Get max ID from existing entries
      let maxId = 0;
      value.forEach(yearGroup => {
        if (yearGroup.papers) {
          yearGroup.papers.forEach(paper => {
            if (paper.id > maxId) maxId = paper.id;
          });
        }
      });

      // Group new entries by year
      const newByYear = {};
      parsedEntries.forEach((entry, index) => {
        const newEntry = { ...entry, id: maxId + index + 1 };
        if (!newByYear[entry.year]) {
          newByYear[entry.year] = [];
        }
        newByYear[entry.year].push(newEntry);
      });

      // Merge with existing data
      const newValue = value.map(yearGroup => {
        const year = yearGroup.year;
        if (newByYear[year]) {
          const papers = [...(yearGroup.papers || []), ...newByYear[year]];
          delete newByYear[year];
          return { ...yearGroup, papers };
        }
        return yearGroup;
      });

      // Add new year groups
      Object.keys(newByYear).sort((a, b) => b - a).forEach(year => {
        newValue.push({
          year: parseInt(year, 10),
          papers: newByYear[year],
        });
      });

      // Sort by year descending
      newValue.sort((a, b) => b.year - a.year);

      // Deep clone to ensure CMS detects the change (removes any reactive proxies)
      const cleanValue = JSON.parse(JSON.stringify(newValue));
      console.log('=== handleAddToList result ===');
      console.log('Total year groups:', cleanValue.length);
      console.log('cleanValue to save:', JSON.stringify(cleanValue, null, 2));

      this.props.onChange(cleanValue);
      console.log('onChange called successfully');

      // Show success message
      this.setState({
        bibtexInput: '',
        parsedEntries: [],
        errors: [],
        previewMode: false,
        duplicates: [],
        showSuccessMessage: true,
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        this.setState({ showSuccessMessage: false });
      }, 5000);
    },

    // Delete existing entry
    handleDeleteExisting(year, paperIndex) {
      const value = this.getNormalizedValue();
      const newValue = value.map(yearGroup => {
        if (yearGroup.year === year) {
          const newPapers = yearGroup.papers.filter((_, i) => i !== paperIndex);
          return { ...yearGroup, papers: newPapers };
        }
        return yearGroup;
      }).filter(yearGroup => yearGroup.papers && yearGroup.papers.length > 0);
      // Deep clone to ensure CMS detects the change
      this.props.onChange(JSON.parse(JSON.stringify(newValue)));
    },

    // Edit existing entry
    handleEditExisting(year, paperIndex, field, value) {
      const existingValue = this.getNormalizedValue();
      const newValue = existingValue.map(yearGroup => {
        if (yearGroup.year === year) {
          const newPapers = yearGroup.papers.map((paper, i) => {
            if (i === paperIndex) {
              return { ...paper, [field]: value };
            }
            return paper;
          });
          return { ...yearGroup, papers: newPapers };
        }
        return yearGroup;
      });
      // Deep clone to ensure CMS detects the change
      this.props.onChange(JSON.parse(JSON.stringify(newValue)));
    },

    renderExistingPublications(styles) {
      // Use the normalized value helper
      const value = this.getNormalizedValue();

      // Debug: log the received value
      console.log('BibTeX Widget - raw props.value:', this.props.value);
      console.log('BibTeX Widget - normalized value:', value);

      const totalPapers = value.reduce((sum, yg) => sum + (yg.papers ? yg.papers.length : 0), 0);

      // Debug: log total papers count
      console.log('BibTeX Widget - totalPapers:', totalPapers);

      if (totalPapers === 0) {
        return h('div', null,
          h('label', { style: styles.label }, 'Existing Publications'),
          h('p', { style: { ...styles.hint, fontStyle: 'italic' } }, 'No publications yet. Use the BibTeX Import Tool below to add entries.')
        );
      }

      const yearGroupElements = value.map((yearGroup, ygIndex) => {
        if (!yearGroup.papers || yearGroup.papers.length === 0) return null;

        const paperElements = yearGroup.papers.map((paper, paperIndex) =>
          h('div', { key: paperIndex, style: { ...styles.entryCard, marginTop: paperIndex === 0 ? '8px' : '12px' } },
            h('div', { style: styles.entryHeader },
              h('div', { style: { flex: 1 } },
                h('input', {
                  type: 'text',
                  value: paper.title,
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'title', e.target.value),
                  style: { ...styles.inputField, fontWeight: '600', fontSize: '15px' },
                })
              ),
              h('button', {
                type: 'button',
                onClick: () => this.handleDeleteExisting(yearGroup.year, paperIndex),
                style: styles.removeButton,
              }, 'Delete')
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' } },
              h('div', null,
                h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Authors'),
                h('input', {
                  type: 'text',
                  value: paper.authors || '',
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'authors', e.target.value),
                  style: styles.inputField,
                })
              ),
              h('div', null,
                h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Journal'),
                h('input', {
                  type: 'text',
                  value: paper.journal || '',
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'journal', e.target.value),
                  style: styles.inputField,
                })
              ),
              h('div', null,
                h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Year'),
                h('input', {
                  type: 'number',
                  value: paper.year,
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'year', parseInt(e.target.value, 10) || paper.year),
                  style: { ...styles.inputField, width: '100px' },
                })
              ),
              h('div', null,
                h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Date'),
                h('input', {
                  type: 'text',
                  value: paper.date || '',
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'date', e.target.value),
                  style: { ...styles.inputField, width: '120px' },
                })
              ),
              h('div', null,
                h('label', { style: { ...styles.label, fontSize: '12px' } }, 'DOI'),
                h('input', {
                  type: 'text',
                  value: paper.doi || '',
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'doi', e.target.value),
                  style: styles.inputField,
                })
              ),
              h('div', null,
                h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Link'),
                h('input', {
                  type: 'text',
                  value: paper.link || '',
                  onChange: (e) => this.handleEditExisting(yearGroup.year, paperIndex, 'link', e.target.value),
                  style: styles.inputField,
                })
              )
            )
          )
        );

        return h('div', { key: ygIndex, style: { marginTop: ygIndex === 0 ? '0' : '16px' } },
          h('div', { style: { ...styles.label, fontSize: '16px', color: '#004a99', marginBottom: '8px' } },
            `${yearGroup.year} (${yearGroup.papers.length} paper${yearGroup.papers.length > 1 ? 's' : ''})`
          ),
          paperElements
        );
      });

      return h('div', null,
        h('label', { style: styles.label },
          `Existing Publications (${totalPapers} total)`
        ),
        h('p', { style: styles.hint }, 'You can edit or delete publications below. Changes are saved automatically.'),
        yearGroupElements
      );
    },

    render() {
      const { bibtexInput, parsedEntries, errors, previewMode, duplicates, showSuccessMessage } = this.state;
      const { forID, classNameWrapper } = this.props;

      const styles = {
        container: {
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e1e4e8',
        },
        textarea: {
          width: '100%',
          minHeight: '200px',
          padding: '12px',
          fontFamily: 'monospace',
          fontSize: '13px',
          border: '1px solid #d1d5da',
          borderRadius: '6px',
          resize: 'vertical',
          backgroundColor: '#fff',
        },
        button: {
          padding: '10px 20px',
          backgroundColor: '#004a99',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          marginTop: '12px',
        },
        buttonSecondary: {
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          marginTop: '12px',
          marginLeft: '8px',
        },
        errorBox: {
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#fff5f5',
          border: '1px solid #fc8181',
          borderRadius: '6px',
          color: '#c53030',
        },
        successBox: {
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f0fff4',
          border: '1px solid #68d391',
          borderRadius: '6px',
          color: '#276749',
        },
        entryCard: {
          marginTop: '12px',
          padding: '16px',
          backgroundColor: '#fff',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
        },
        duplicateWarning: {
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#fffaf0',
          border: '1px solid #fbd38d',
          borderRadius: '4px',
          color: '#c05621',
          fontSize: '13px',
        },
        inputField: {
          width: '100%',
          padding: '6px 10px',
          border: '1px solid #d1d5da',
          borderRadius: '4px',
          fontSize: '13px',
          marginTop: '4px',
        },
        inlineInput: {
          padding: '4px 8px',
          border: '1px solid #d1d5da',
          borderRadius: '4px',
          fontSize: '13px',
          width: '80px',
        },
        entryHeader: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '8px',
        },
        entryTitle: {
          fontWeight: '600',
          color: '#24292e',
          fontSize: '15px',
        },
        removeButton: {
          padding: '4px 10px',
          backgroundColor: '#dc3545',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        },
        entryMeta: {
          color: '#586069',
          fontSize: '13px',
          marginTop: '4px',
        },
        label: {
          display: 'block',
          fontWeight: '500',
          marginBottom: '4px',
          color: '#24292e',
          fontSize: '14px',
        },
        hint: {
          fontSize: '12px',
          color: '#6a737d',
          marginTop: '8px',
        },
      };

      return h('div', { id: forID, className: classNameWrapper, style: styles.container },
        // Existing Publications Section
        this.renderExistingPublications(styles),

        // Success message after adding entries
        showSuccessMessage && h('div', { style: { ...styles.successBox, border: '2px solid #68d391', marginBottom: '8px' } },
          h('strong', null, 'Entries Added!'),
          h('p', { style: { marginTop: '4px' } },
            'IMPORTANT: Click the "Save" button in the CMS toolbar to publish your changes to workflow.'
          )
        ),

        // Divider
        h('hr', { style: { border: 'none', borderTop: '2px solid #e1e4e8', margin: '24px 0' } }),

        // BibTeX Import Section
        h('label', { style: styles.label }, 'BibTeX Import Tool'),
        h('p', { style: styles.hint }, 'Paste BibTeX entries below to batch import publications. Multiple entries are supported.'),

        h('textarea', {
          value: bibtexInput,
          onChange: this.handleInputChange,
          placeholder: '@article{key,\n  author = {Last, First and Last2, First2},\n  title = {Paper Title},\n  journal = {Journal Name},\n  year = {2024},\n  doi = {10.1234/example}\n}',
          style: styles.textarea,
        }),

        h('button', {
          type: 'button',
          onClick: this.handleParse,
          style: styles.button,
        }, 'Parse BibTeX'),

        errors.length > 0 && h('div', { style: styles.errorBox },
          h('strong', null, 'Warnings/Errors:'),
          h('ul', { style: { margin: '8px 0 0 0', paddingLeft: '20px' } },
            errors.map((error, i) => h('li', { key: i }, error))
          )
        ),

        previewMode && parsedEntries.length > 0 && h('div', null,
          h('div', { style: styles.successBox },
            h('strong', null, `Parsed ${parsedEntries.length} entr${parsedEntries.length === 1 ? 'y' : 'ies'}:`)
          ),

          duplicates.length > 0 && h('div', { style: styles.duplicateWarning },
            h('strong', null, 'Warning: '),
            `${duplicates.length} potential duplicate${duplicates.length === 1 ? '' : 's'} detected (same DOI or title)`
          ),

          parsedEntries.map((entry, index) =>
            h('div', { key: index, style: styles.entryCard },
              h('div', { style: styles.entryHeader },
                h('div', { style: { flex: 1 } },
                  h('input', {
                    type: 'text',
                    value: entry.title,
                    onChange: (e) => this.handleEditEntry(index, 'title', e.target.value),
                    style: { ...styles.inputField, fontWeight: '600', fontSize: '15px' },
                  })
                ),
                h('button', {
                  type: 'button',
                  onClick: () => this.handleRemoveEntry(index),
                  style: styles.removeButton,
                }, 'Remove')
              ),

              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' } },
                h('div', null,
                  h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Authors'),
                  h('input', {
                    type: 'text',
                    value: entry.authors,
                    onChange: (e) => this.handleEditEntry(index, 'authors', e.target.value),
                    style: styles.inputField,
                  })
                ),
                h('div', null,
                  h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Journal'),
                  h('input', {
                    type: 'text',
                    value: entry.journal,
                    onChange: (e) => this.handleEditEntry(index, 'journal', e.target.value),
                    style: styles.inputField,
                  })
                ),
                h('div', null,
                  h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Year'),
                  h('input', {
                    type: 'number',
                    value: entry.year,
                    onChange: (e) => this.handleEditEntry(index, 'year', parseInt(e.target.value, 10)),
                    style: { ...styles.inputField, width: '100px' },
                  })
                ),
                h('div', null,
                  h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Date'),
                  h('input', {
                    type: 'text',
                    value: entry.date,
                    onChange: (e) => this.handleEditEntry(index, 'date', e.target.value),
                    style: { ...styles.inputField, width: '120px' },
                    placeholder: 'e.g., Jan 2024',
                  })
                ),
                h('div', null,
                  h('label', { style: { ...styles.label, fontSize: '12px' } }, 'DOI'),
                  h('input', {
                    type: 'text',
                    value: entry.doi || '',
                    onChange: (e) => this.handleEditEntry(index, 'doi', e.target.value),
                    style: styles.inputField,
                    placeholder: '10.1234/example',
                  })
                ),
                h('div', null,
                  h('label', { style: { ...styles.label, fontSize: '12px' } }, 'Link'),
                  h('input', {
                    type: 'text',
                    value: entry.link,
                    onChange: (e) => this.handleEditEntry(index, 'link', e.target.value),
                    style: styles.inputField,
                    placeholder: 'https://doi.org/...',
                  })
                )
              ),

              (entry.preprint_url || entry.preprint_label) && h('div', { style: { marginTop: '8px', color: '#586069', fontSize: '13px' } },
                `Preprint: ${entry.preprint_label} - ${entry.preprint_url}`
              )
            )
          ),

          h('button', {
            type: 'button',
            onClick: this.handleAddToList,
            style: styles.buttonSecondary,
          }, `Add ${parsedEntries.length} Entr${parsedEntries.length === 1 ? 'y' : 'ies'} to Publications`)
        )
      );
    },
  });

  // Preview component (shown in the CMS list view)
  const BibTeXPreview = createClass({
    render() {
      return h('div', null, 'BibTeX Import Tool');
    },
  });

  // Register the widget - must wait for CMS to be fully ready
  function registerBibTeXWidget() {
    if (window.CMS && window.createClass && window.h) {
      // Register with schema to ensure proper value handling
      CMS.registerWidget('bibtex-import', BibTeXControl, BibTeXPreview, {
        default: [],
      });
      console.log('BibTeX widget registered successfully');
    } else {
      // Retry after a short delay
      setTimeout(registerBibTeXWidget, 100);
    }
  }

  // Start registration process
  if (document.readyState === 'complete') {
    registerBibTeXWidget();
  } else {
    window.addEventListener('load', registerBibTeXWidget);
  }
})();
