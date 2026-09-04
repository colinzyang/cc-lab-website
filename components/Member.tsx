import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Github, GraduationCap, Shuffle, RotateCcw } from 'lucide-react';
import { useBreadcrumb } from '../src/context/BreadcrumbContext';
import { loadMembers, Member as MemberType } from '../src/lib/dataLoader';
import { useDocumentTitle } from '../src/hooks/useDocumentTitle';
import { Avatar } from './Avatar';

// April Fools' Day check
const isAprilFools = (): boolean => {
  const now = new Date();
  return now.getMonth() === 3 && now.getDate() === 1;
};

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const ROLE_ORDER: Record<string, number> = {
  'Staff': 0,
  'PhD Student': 1,
  'MSc Student': 2,
  'Undergraduate Researcher': 3,
};

const GROUP_LABELS: Record<string, string> = {
  'PhD Student': 'PhD Students',
  'MSc Student': 'MSc Students',
  'Undergraduate Researcher': 'Undergraduate Researchers',
  'Staff': 'Staff',
};

function groupMembers(members: MemberType[]): { label: string; members: MemberType[] }[] {
  const groups: Record<string, MemberType[]> = {};
  const sorted = [...members].sort((a, b) => {
    const orderDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });
  for (const member of sorted) {
    const key = member.role in ROLE_ORDER ? member.role : 'Staff';
    if (!groups[key]) groups[key] = [];
    groups[key].push(member);
  }
  return Object.entries(groups).map(([role, members]) => ({
    label: GROUP_LABELS[role] ?? role,
    members,
  }));
}

export const Member: React.FC = () => {
  const { setBreadcrumbs } = useBreadcrumb();
  useDocumentTitle('People');
  const [pi, setPi] = useState<MemberType | null>(null);
  const [members, setMembers] = useState<MemberType[]>([]);
  const [alumni, setAlumni] = useState<MemberType[]>([]);
  const [loading, setLoading] = useState(true);

  // April Fools' shuffle state - maps positions to random people
  const [shuffledPositions, setShuffledPositions] = useState<MemberType[]>([]);
  const [isShuffled, setIsShuffled] = useState(false);
  const showAprilFools = isAprilFools();

  // All people for shuffling — sorted to match groupMembers() order
  const sortedMembers = [...members].sort((a, b) => {
    const orderDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
    if (orderDiff !== 0) return orderDiff;
    return a.name.localeCompare(b.name);
  });
  const allPeople = pi ? [pi, ...sortedMembers] : sortedMembers;

  const handleShuffle = () => {
    // Shuffle everyone and create position mapping
    setShuffledPositions(shuffleArray(allPeople));
    setIsShuffled(true);
  };

  const handleReset = () => {
    setShuffledPositions([]);
    setIsShuffled(false);
  };

  // Get person for a specific position (by index)
  const getPersonAt = (index: number): MemberType => {
    if (!isShuffled || shuffledPositions.length === 0) return allPeople[index];
    return shuffledPositions[index] || allPeople[index];
  };

  useEffect(() => {
    setBreadcrumbs([{ label: 'People' }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    loadMembers().then(data => {
      setPi(data.PI);
      setMembers(data.MEMBERS);
      setAlumni(data.ALUMNI ?? []);
      setLoading(false);
    }).catch(error => {
      console.error('Error loading members:', error);
      setLoading(false);
    });
  }, []);

  if (loading || !pi) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text mb-6">People</h1>
        <p className="text-slate-600 dark:text-text">Loading...</p>
      </div>
    );
  }

  const groups = groupMembers(members);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-text">People</h1>
          {/* April Fools' Shuffle Buttons */}
          {showAprilFools && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2"
            >
              {/* April Fools Hint */}
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-subtext">
                <motion.span
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 5 }}
                >
                  🎭
                </motion.span>
                <span className="text-xs font-medium">
                  Click the button to become PI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                onClick={handleShuffle}
                disabled={isShuffled}
                className="group inline-flex items-center gap-2 border-2 border-primary dark:border-primary-dark px-4 py-2 text-primary dark:text-primary-dark font-bold text-sm tracking-tight hover:bg-primary dark:hover:bg-primary-dark hover:text-white dark:hover:text-slate-900 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:dark:hover:bg-transparent disabled:hover:text-primary disabled:dark:hover:text-primary-dark"
              >
                <Shuffle className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" />
                Shuffle
              </button>
              <button
                onClick={handleReset}
                disabled={!isShuffled}
                className="group inline-flex items-center gap-2 border-2 border-slate-400 dark:border-subtext px-4 py-2 text-slate-600 dark:text-subtext font-bold text-sm tracking-tight hover:bg-slate-600 dark:hover:bg-subtext hover:text-white dark:hover:text-slate-900 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:dark:hover:bg-transparent disabled:hover:text-slate-600 disabled:dark:hover:text-subtext"
              >
                <RotateCcw className="w-4 h-4 transition-transform duration-300" />
                Reset
              </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* PI Section - shows shuffled person when isShuffled */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-text mb-8 border-b border-gray-200 dark:border-border pb-4">
          {isShuffled ? '🎭 Principal Investigator' : 'Principal Investigator'}
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start"
        >
          <div className="md:col-span-4 aspect-square overflow-hidden rounded-full bg-gray-100 dark:bg-surface">
            <Avatar name={getPersonAt(0).name} image={getPersonAt(0).image} />
          </div>
          <div className="md:col-span-8 flex flex-col justify-center h-full pt-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-text mb-6">{getPersonAt(0).name}</h2>
            <p className="text-lg text-slate-600 dark:text-text mb-6 leading-relaxed">
              {getPersonAt(0).bio_long}
            </p>
            {getPersonAt(0).interest && (
              <div className="text-sm font-semibold text-slate-500 dark:text-subtext mb-4">
                Focus: {getPersonAt(0).interest}
              </div>
            )}
            <div className="flex gap-4 items-center">
              {getPersonAt(0).email && (
                <a href={`mailto:${getPersonAt(0).email}`} className="text-slate-600 dark:text-subtext hover:text-primary dark:hover:text-primary-dark transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              )}
              {getPersonAt(0).github && (
                <a href={`https://github.com/${getPersonAt(0).github}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-subtext hover:text-primary dark:hover:text-primary-dark transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              )}
              {getPersonAt(0).google_scholar && (
                <a href={`https://scholar.google.com/citations?user=${getPersonAt(0).google_scholar}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-subtext hover:text-primary dark:hover:text-primary-dark transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </a>
              )}
              {getPersonAt(0).orcid && (
                <a href={`https://orcid.org/${getPersonAt(0).orcid}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-subtext hover:text-primary dark:hover:text-primary-dark transition-colors text-xs font-bold">
                  ORCID
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>

          {/* Members — grouped by role */}
          {groups.map((group, groupIdx) => {
            // Calculate starting index for this group (PI is index 0)
            let startIdx = 1;
            for (let i = 0; i < groupIdx; i++) {
              startIdx += groups[i].members.length;
            }

            return (
              <div key={group.label} className="mb-16">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-text mb-8 border-b border-gray-200 dark:border-border pb-4">
                  {group.label}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-12">
                  {group.members.map((_, idx) => {
                    const globalIdx = startIdx + idx;
                    const person = getPersonAt(globalIdx);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIdx * 0.05 + idx * 0.05 + 0.2 }}
                      >
                        <div className="aspect-square overflow-hidden rounded-full bg-gray-100 dark:bg-surface mb-5">
                          <Avatar name={person.name} image={person.image} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-text leading-tight">{person.name}</h3>
                        <p className="text-primary dark:text-primary-dark font-medium text-sm my-1">{person.title || person.role}</p>
                        {person.interest && (
                          <p className="text-sm text-slate-500 dark:text-subtext leading-snug">{person.interest}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Alumni — compact text roster, hidden when empty */}
          {alumni.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-text mb-8 border-b border-gray-200 dark:border-border pb-4">
                Alumni
              </h2>
              <div className="divide-y divide-gray-100 dark:divide-border">
                {alumni.map((alum, idx) => (
                  <motion.div
                    key={alum.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 + 0.3 }}
                    className="py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-0"
                  >
                    <span className="font-semibold text-slate-900 dark:text-text sm:w-48 shrink-0">
                      {alum.name}
                    </span>
                    <span className="text-sm text-primary dark:text-primary-dark font-medium sm:w-48 shrink-0">
                      {alum.title || alum.role}
                    </span>
                    {alum.current_position && (
                      <span className="text-sm text-slate-500 dark:text-subtext">
                        → {alum.current_position}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
    </div>
  );
};
