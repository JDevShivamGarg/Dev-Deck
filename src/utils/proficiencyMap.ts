import type { Proficiency } from '../types';

export const PROFICIENCY_DIFFICULTY_MAP: Record<Proficiency, [number, number]> = {
  beginner: [1, 2],
  intermediate: [2, 4],
  advanced: [4, 5],
};
