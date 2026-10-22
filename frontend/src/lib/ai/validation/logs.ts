export interface AIEvaluationLog {
  task: string;
  questionHash: string;
  answerHash: string;
  generatorModel: string;
  criticModel?: string;
  tier0: { verdict: string; score: number; issues: string[] };
  tier1?: { verdict: string; score: number; issues: string[] };
  tier2?: { verdict: string; score: number; issues: string[] };
  verdict: string;
  score: number;
  issues: string[];
  humanLabel?: string;
  engineVersion: string;
  createdAt: string;
}
