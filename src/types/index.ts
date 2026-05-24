export interface Topic {
  id: number;
  slug: string;
  display_name: string;
  icon: string | null;
  source: 'builtin' | 'custom';
  material?: string;
  active: 0 | 1;
  is_builtin: number; // 1 if source='builtin', 0 otherwise
  created_at: number;
}

export interface Card {
  id: number;
  topic_id: number;
  mode: 'mcq' | 'flashcard' | 'scenario';
  difficulty: number;
  question: string;
  answer: string;
  options: string | null;
  code_snippet: string | null;
  explanation: string | null;
  tags: string | null;
  source: 'static' | 'ai';
  created_at: number;
}

export interface CardProgress {
  card_id: number;
  interval_days: number;
  ease_factor: number;
  consecutive_correct: number;
  times_seen: number;
  times_correct: number;
  next_due: number;
  retired: number;
  last_response_time_ms?: number;
  incorrect_streak?: number;
}

export interface CardWithProgress extends Card {
  interval_days: number;
  ease_factor: number;
  consecutive_correct: number;
  times_seen: number;
  times_correct: number;
  next_due: number;
  retired: number;
  last_response_time_ms?: number;
  incorrect_streak?: number;
}

export interface SessionRecord {
  id: number;
  topic_id: number;
  mode: string;
  proficiency: string;
  total_cards: number;
  correct: number;
  started_at: number;
  ended_at: number;
}

export interface RawCard {
  question: string;
  answer: string;
  options?: string[];
  code_snippet?: string;
  explanation?: string;
  difficulty: number;
  tags?: string[];
}

export type Proficiency = 'beginner' | 'intermediate' | 'advanced';
export type CardMode = 'mcq' | 'flashcard' | 'scenario';
