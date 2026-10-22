export type AIValidationVerdict = 'pass' | 'fail' | 'needs_review' | 'unknown';

export interface AIValidationState {
  verdict: AIValidationVerdict;
  score: number;
  checks: string[];
  issues: string[];
  confidence?: 'high' | 'medium' | 'low';
}

export type AIConfidence = 'high' | 'medium' | 'low';

export interface AIExplanation {
  restatedQuestion: string;
  steps: string[];
  commonMistakes: string[];
  summaryNotes: string;
  titleSuggestion?: string;
  tagSuggestions?: string[];
  reasoning?: string;
  workedExample?: string;
  keyConcepts?: string[];
  verification?: string;
  confidence?: AIConfidence;
  model?: string;
  validation?: AIValidationState;
}
