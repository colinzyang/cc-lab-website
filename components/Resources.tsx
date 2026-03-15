import React from 'react';
import { motion } from 'framer-motion';
import { Github, Database, Terminal } from 'lucide-react';
import { useBreadcrumb } from '../src/context/BreadcrumbContext';

const TOOLS = [
  {
    name: "FoldPred-X Placeholder",
    description: "A state-of-the-art deep learning tool for predicting protein folding pathways in milliseconds.",
    icon: <Terminal className="w-6 h-6" />,
    tags: ["Python", "PyTorch", "CLI"],
    link: "#"
  },
  {
    name: "BioDyn-DB Placeholder",
    description: "Comprehensive database of molecular dynamics trajectories for G-protein coupled receptors.",
    icon: <Database className="w-6 h-6" />,
    tags: ["Database", "Web Access"],
    link: "#"
  },
  {
    name: "SeqAlign-GPU Placeholder",
    description: "GPU-accelerated sequence alignment library specifically optimized for long-read sequencing data.",
    icon: <Github className="w-6 h-6" />,
    tags: ["C++", "CUDA", "Open Source"],
    link: "#"
  }
];

export const Resources: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();

  React.useEffect(() => {
    setBreadcrumbs([{ label: 'Resources' }]);
  }, [setBreadcrumbs]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center max-w-3xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Resources & Software</h1>
        <p className="text-xl text-slate-600 dark:text-gray-300">
          Software, datasets, and other resources from our lab.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool, idx) => (
          <motion.div
            key={tool.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-8 hover:border-primary/30 transition-colors group"
          >
            <div className="w-12 h-12 bg-white dark:bg-background-dark border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              {tool.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{tool.name}</h3>
            <p className="text-slate-600 dark:text-gray-400 leading-relaxed mb-6">
              {tool.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {tool.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
            <a href={tool.link} className="inline-flex items-center text-sm font-bold text-primary uppercase tracking-wider hover:underline">
              View Repository &rarr;
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
};