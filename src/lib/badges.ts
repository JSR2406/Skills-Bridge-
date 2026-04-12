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
    id: 'novice',
    name: 'Novice',
    description: 'Earned 10 reputation points',
    icon: '⭐',
    threshold: 10,
    type: 'reputation',
  },
  {
    id: 'helper',
    name: 'Helper',
    description: 'Posted 5 answers to community doubts',
    icon: '💬',
    threshold: 5,
    type: 'doubts',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    description: 'Completed 5 practice tests',
    icon: '📚',
    threshold: 5,
    type: 'tests',
  },
  {
    id: 'expert',
    name: 'Expert',
    description: '10 answers accepted by peers',
    icon: '✅',
    threshold: 10,
    type: 'doubts',
  },
  {
    id: 'master',
    name: 'Master',
    description: 'Reached 500 total reputation',
    icon: '👑',
    threshold: 500,
    type: 'reputation',
  },
  {
    id: 'streak_7',
    name: '7-Day Streak',
    description: 'Maintained a 7-day learning streak',
    icon: '🔥',
    threshold: 7,
    type: 'reputation',
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
