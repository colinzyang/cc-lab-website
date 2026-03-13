import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-100 dark:border-gray-800 mt-auto bg-white dark:bg-background-dark">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-gray-300">
            © 2026 @ XJTLU Kevin. Chun Chan Lab
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Department of bioscience and bioinformatics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/colinzyang/cc.lab.xjtlu.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://img.shields.io/badge/View_on_GitHub-181717?logo=github&logoColor=white"
              alt="View on GitHub"
              className="h-6"
            />
          </a>
          <a
            href="https://www.netlify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://www.netlify.com/img/global/badges/netlify-color-accent.svg"
              alt="Deploys by Netlify"
              className="h-8"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};