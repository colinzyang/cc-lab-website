import React from 'react';
import { Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-100 dark:border-border mt-auto bg-white dark:bg-background-dark">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 py-8 flex flex-col gap-5">

        {/* Main row: copyright (left) + quick links (right on md+) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-slate-900 dark:text-text">
              © 2026 @ XJTLU Kevin. Chun Chan Lab
            </p>
            <p className="text-xs text-gray-500 dark:text-subtext">
              Department of Bioscience and Bioinformatics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/colinzyang/cc-lab-website"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              View on GitHub
            </a>
            <a
              href="https://www.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center h-9 px-4 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:text-slate-900 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors dark:border-border dark:text-subtext dark:hover:text-text dark:hover:border-subtext"
            >
              Deploys by Netlify
            </a>
          </div>
        </div>

        {/* Bottom line: license */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          This project is released under the{' '}
          <a
            href="https://opensource.org/licenses/MIT"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            MIT License
          </a>
          .
        </p>
      </div>
    </footer>
  );
};