import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBreadcrumb } from '../src/context/BreadcrumbContext';
import { loadNews, NewsItem } from '../src/lib/dataLoader';
import { useDocumentTitle } from '../src/hooks/useDocumentTitle';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronDown, ImageOff } from 'lucide-react';
import { ScrollToTopButton } from './ScrollToTopButton';

// Image component with error handling
const NewsImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-subtext">
        <ImageOff className="w-8 h-8 mb-2" />
        <span className="text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

// --- Sorting helpers ---

type SortOrder = 'newest' | 'oldest';

const MONTH_INDEX: Partial<Record<string, number>> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Parses human-readable dates like "May 2026" or "May 15, 2026".
// Returns null for unrecognised dates (they sort to the end).
const parseNewsDate = (dateStr: string): number | null => {
  const match = dateStr.match(/([A-Za-z]{3,})\D*(\d{1,2})?\D*(\d{4})/);
  if (!match) return null;
  const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  const day = match[2] ? parseInt(match[2], 10) : 1;
  return new Date(parseInt(match[3], 10), month, day).getTime();
};

// Stable identity for a news item (survives re-ordering, unlike array index)
const newsItemKey = (item: NewsItem): string => `${item.date}|${item.title}`;

export const News: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();
  useDocumentTitle('News & Events');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useEffect(() => {
    setBreadcrumbs([{ label: 'News & Events' }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadNews().then(data => {
      setNewsItems(data);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading news:', error);
      setLoading(false);
    });
  }, []);

  const handleToggle = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
  };

  const sortedItems = useMemo(() => {
    const indexed = newsItems.map((item, idx) => ({ item, idx }));
    indexed.sort((a, b) => {
      const da = parseNewsDate(a.item.date);
      const db = parseNewsDate(b.item.date);
      // Unparseable dates always go last
      if (da === null && db === null) return a.idx - b.idx;
      if (da === null) return 1;
      if (db === null) return -1;
      if (da !== db) return sortOrder === 'newest' ? db - da : da - db;
      // Same date: keep original JSON order (stable)
      return a.idx - b.idx;
    });
    return indexed.map(({ item }) => item);
  }, [newsItems, sortOrder]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-6">News & Events</h1>
        <p className="text-slate-600 dark:text-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-6">News &amp; Events</h1>
          <div
            role="group"
            aria-label="Sort news"
            className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-border p-1 self-start sm:mb-6"
          >
            <button
              type="button"
              aria-pressed={sortOrder === 'newest'}
              onClick={() => setSortOrder('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                sortOrder === 'newest'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-subtext hover:bg-gray-100 dark:hover:bg-surface'
              }`}
            >
              <ArrowDownWideNarrow className="w-4 h-4" />
              Newest
            </button>
            <button
              type="button"
              aria-pressed={sortOrder === 'oldest'}
              onClick={() => setSortOrder('oldest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                sortOrder === 'oldest'
                  ? 'bg-primary text-white'
                  : 'text-slate-600 dark:text-subtext hover:bg-gray-100 dark:hover:bg-surface'
              }`}
            >
              <ArrowUpNarrowWide className="w-4 h-4" />
              Oldest
            </button>
          </div>
        </div>
      </motion.div>

      <div className="relative border-l border-gray-200 dark:border-border ml-4 space-y-[30px] pb-12">
        {sortedItems.map((item, idx) => {
          const key = newsItemKey(item);
          return (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="pl-8 relative"
          >
            {/* Timeline dot */}
            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 bg-primary dark:bg-primary-dark rounded-full ring-4 ring-white dark:ring-background-dark" />

            <div
              onClick={() => item.images && item.images.length > 0 && handleToggle(key)}
              className={`cursor-pointer select-none ${
                item.images && item.images.length > 0
                  ? 'hover:bg-gray-50/50 dark:hover:bg-surface/50 rounded-lg -ml-2 pl-2 pr-2 py-2 transition-colors'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs font-mono text-primary dark:text-primary-dark uppercase tracking-wider mb-1 block">
                    {item.category} • {item.date}
                  </span>
                  <h3 className="text-2xl font-medium text-slate-900 dark:text-text mb-2">
                    {item.title}
                  </h3>
                </div>
                {item.images && item.images.length > 0 && (
                  <motion.div
                    animate={{ rotate: expandedKey === key ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 mt-1"
                  >
                    <ChevronDown className="w-5 h-5 text-slate-400 dark:text-subtext" />
                  </motion.div>
                )}
              </div>
              {item.excerpt && (
                <p className="text-slate-600 dark:text-subtext leading-relaxed">
                  {item.excerpt}
                </p>
              )}
            </div>

            {/* Expandable image drawer */}
            <AnimatePresence initial={false}>
              {expandedKey === key && item.images && item.images.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {item.images.map((img, imgIdx) => {
                        const imgSrc = typeof img === 'string' ? img : img.src;
                        return (
                          <div
                            key={imgIdx}
                            className="aspect-video bg-gray-100 dark:bg-surface1 rounded-lg overflow-hidden"
                          >
                            <NewsImage src={imgSrc} alt={`${item.title} - image ${imgIdx + 1}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          );
        })}
      </div>
      <ScrollToTopButton />
    </div>
  );
};
