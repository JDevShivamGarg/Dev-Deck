import type { CardMode, Proficiency } from '../types';

export function buildPrompt(
  topic: string,
  mode: CardMode,
  proficiency: Proficiency,
  count: number
): string {
  const difficultyRange = {
    beginner: '1-2',
    intermediate: '2-4',
    advanced: '4-5',
  }[proficiency];

  switch (mode) {
    case 'mcq':
      return `Generate ${count} MCQ questions for topic: ${topic}
Proficiency: ${proficiency}
Rules:
- Practical, command/config/behavior focused — not definitions
- 4 options each, exactly 1 correct
- Include a brief explanation (1-2 sentences) for the correct answer
- Difficulty range: ${difficultyRange} (scale 1-5)

Return JSON array:
[{ "question": "", "options": ["","","",""], "answer": "", "explanation": "", "difficulty": 1, "tags": [] }]`;

    case 'flashcard':
      return `Generate ${count} flashcard Q&A pairs for topic: ${topic}
Proficiency: ${proficiency}
Rules:
- Focus on practical knowledge: commands, configurations, behaviors, gotchas
- Front = concise question, Back = concise answer
- Include a brief explanation
- Difficulty range: ${difficultyRange} (scale 1-5)

Return JSON array:
[{ "question": "", "answer": "", "explanation": "", "difficulty": 1, "tags": [] }]`;

    case 'scenario':
      return `Generate ${count} scenario-based questions for topic: ${topic}
Proficiency: ${proficiency}
Rules:
- Each question must include a realistic code snippet or configuration
- Ask about the outcome, bug, or behavior of the snippet
- Include the correct answer and explanation
- Difficulty range: ${difficultyRange} (scale 1-5)

Return JSON array:
[{ "question": "", "code_snippet": "", "answer": "", "explanation": "", "difficulty": 1, "tags": [] }]`;
  }
}
