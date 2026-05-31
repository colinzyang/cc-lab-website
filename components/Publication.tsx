import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { ScrollToTopButton } from './ScrollToTopButton';
import { AuthorList } from './AuthorList';
import { useBreadcrumb } from '../src/context/BreadcrumbContext';
import { loadPublications } from '../src/lib/dataLoader';
import { useDocumentTitle } from '../src/hooks/useDocumentTitle';

interface PublicationGroup {
  year: number;
  papers: any[];
}

// Prefer a DOI-derived link; fall back to a stored link only for (rare) DOI-less entries.
const paperHref = (paper: any): string | undefined =>
  paper.doi ? `https://doi.org/${paper.doi}` : paper.link;

export const Publication: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();
  useDocumentTitle('Publications');
  const [publicationsByYear, setPublicationsByYear] = useState<PublicationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Publications' }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadPublications().then(data => {
      setPublicationsByYear(data.PUBLICATIONS_BY_YEAR);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading publications:', error);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-6">Publications</h1>
        <p className="text-slate-600 dark:text-text">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 border-b border-gray-100 dark:border-border pb-10"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-6">Publications</h1>
        <p className="text-xl text-slate-600 dark:text-text max-w-2xl">
          Selected lab publications, with links to papers and preprints.
        </p>
      </motion.div>

      <div className="space-y-16">
        {publicationsByYear.map((group) => (
          <motion.div
            key={group.year}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-8 md:gap-16"
          >
            <div className="md:w-32 flex-shrink-0">
              <span className="text-3xl font-black text-slate-200 dark:text-surface-1 sticky top-24">
                {group.year}
              </span>
            </div>
            <div className="flex-grow space-y-10">
              {group.papers.map((paper) => (
                <div key={paper.id} className="group">
                  <h3 className="text-xl font-medium text-slate-900 dark:text-text leading-tight mb-2 group-hover:text-primary dark:group-hover:text-primary-dark transition-colors">
                    {paperHref(paper) ? (
                      <a href={paperHref(paper)} target="_blank" rel="noopener noreferrer">{paper.title}</a>
                    ) : (
                      paper.title
                    )}
                  </h3>
                  <AuthorList authors={paper.authors} />
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="font-serif italic text-slate-500">{paper.journal}</span>
                    {paper.preprint_url && (
                      <a href={paper.preprint_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary dark:text-primary-dark text-xs font-bold uppercase tracking-wider hover:underline">
                        <FileText className="w-3 h-3" /> {paper.preprint_label}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      <ScrollToTopButton />
    </div>
  );
};