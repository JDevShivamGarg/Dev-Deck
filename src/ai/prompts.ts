function sanitizeMaterial(material?: string): string {
  if (!material) return '';
  const cap = 12000;
  if (material.length > cap) {
    return `${material.substring(0, cap)}\n\n... [TRUNCATED FOR CONTEXT SIZE & TOKEN SAFETY]`;
  }
  return material;
}

// ─── Default prompt templates ──────────────────────────────────────────────
// Exported so the settings screen can display and reset them.

export const DEFAULT_GENERATION_PROMPT = `Topic: {{topic}}
Material: {{material}}

These questions already exist — do not regenerate or rephrase them (if any):
{{existingQuestions}}

Generate study content from the material above. Return only valid JSON, no explanation:

{
  "topic": "...",
  "mcqs": [
    {
      "question": "Deep technical question here",
      "options": ["Plausible wrong answer 1", "Plausible wrong answer 2", "Correct answer", "Plausible wrong answer 3"],
      "answer": "Correct answer", // MUST EXACTLY MATCH ONE OF THE STRINGS IN THE OPTIONS ARRAY.
      "difficulty": 3 // 1-2 (Beginner), 3 (Intermediate), or 4-5 (Advanced)
    }
  ],
  "flashcards": [{"front": "","back": "", "difficulty": 1}],
  "qa": [{"question": "","answer": "", "difficulty": 5}] // This maps to scenario mode
}

CRITICAL RULES:
1. Cover all 3 difficulty levels: Beginner (1 or 2), Intermediate (3), and Advanced (4 or 5).
2. For MCQs, the distractors (wrong options) MUST be highly plausible, confusing, and test deep technical understanding. Do NOT make them obviously wrong or easy to guess.
3. The 'answer' field MUST be the EXACT string of the correct option, not just a letter like 'A' or 'B'.
4. Randomize the position of the correct answer across different questions.
5. Provide a diverse set across all 3 question patterns: MCQ, Flashcard, and Scenario (Q&A).

Count Details:
You must provide EXACTLY:
- 10 MCQs (Include a mix of difficulty 1, 3, and 5)
- 10 Flashcards (Include a mix of difficulty 1, 3, and 5)
- 10 Q&A scenarios (Include a mix of difficulty 1, 3, and 5)
Make sure every single format type contains questions from all three difficulty levels.`;

/**
 * The "self-generation" prompt is the template users copy into ChatGPT.
 * It uses the same placeholders as the Groq new-topic prompt.
 */
export const DEFAULT_SELF_GEN_PROMPT = DEFAULT_GENERATION_PROMPT;

// ─── Prompt builders ───────────────────────────────────────────────────────

function applyTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    template
  );
}

export function buildNewTopicPrompt(
  topicName: string,
  material: string,
  customTemplate?: string | null
): string {
  const sanitized = sanitizeMaterial(material);
  const template = customTemplate ?? DEFAULT_GENERATION_PROMPT;
  return applyTemplate(template, {
    topic: topicName,
    material: sanitized || 'Generate practical, real-world content relevant to this technology.',
    existingQuestions: 'None',
  });
}

export function buildExistingTopicPrompt(
  topicName: string,
  existingQuestions: string[],
  material?: string,
  customTemplate?: string | null
): string {
  const sanitized = sanitizeMaterial(material);
  const existingList =
    existingQuestions.length > 0
      ? existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
      : 'None';
  const materialContext = sanitized ? `\nMaterial to draw from:\n${sanitized}\n` : '';
  const template = customTemplate ?? DEFAULT_GENERATION_PROMPT;
  return applyTemplate(template, {
    topic: topicName,
    material: materialContext,
    existingQuestions: existingList,
  });
}
