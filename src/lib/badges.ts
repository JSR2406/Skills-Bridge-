export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold: number;
  type: 'reputation' | 'doubts' | 'tests' | 'productivity';
}

export const BADGES: Badge[] = [
  {
    id: 'novice_solver',
    name: 'Novice Solver',
    description: 'Solve your first doubt with AI assistance.',
    icon: '🎯',
    threshold: 1,
    type: 'doubts',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Reach 100 reputation points.',
    icon: '📚',
    threshold: 100,
    type: 'reputation',
  },
  {
    id: 'productivity_pro',
    name: 'Productivity Pro',
    description: 'Complete 10 study tasks.',
    icon: '⚡',
    threshold: 10,
    type: 'productivity',
  },
  {
    id: 'test_master',
    name: 'Test Master',
    description: 'Complete 5 practice tests with >90% score.',
    icon: '🏆',
    threshold: 5,
    type: 'tests',
  },
];

export function getBadgesForStats(stats: { 
  reputation: number, 
  doubtsSolved: number, 
  tasksCompleted: number,
  highScoreTests: number 
}) {
  return BADGES.filter(badge => {
    switch (badge.type) {
      case 'reputation': return stats.reputation >= badge.threshold;
      case 'doubts': return stats.doubtsSolved >= badge.threshold;
      case 'productivity': return stats.tasksCompleted >= badge.threshold;
      case 'tests': return stats.highScoreTests >= badge.threshold;
      default: return false;
    }
  });
}
