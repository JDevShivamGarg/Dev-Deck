export function buildNewTopicPrompt(
  topicName: string,
  material: string
): string {
  return `Case 1 — New Topic
Topic: ${topicName}
Material: ${material || 'Generate practical, real-world content relevant to this technology.'}

Generate study content from the material above. Return only valid JSON, no explanation:

{
  "topic": "...",
  "mcqs": [
    {
      "question": "Deep technical question here",
      "options": ["Plausible wrong answer 1", "Plausible wrong answer 2", "Correct answer", "Plausible wrong answer 3"],
      "answer": "Correct answer" // MUST EXACTLY MATCH ONE OF THE STRINGS IN THE OPTIONS ARRAY. Do not use A/B/C/D.
    }
  ],
  "flashcards": [{"front": "","back": ""}],
  "qa": [{"question": "","answer": ""}]
}

CRITICAL RULES:
1. For MCQs, the distractors (wrong options) MUST be highly plausible, confusing, and test deep technical understanding. Do NOT make them obviously wrong or easy to guess.
2. The 'answer' field MUST be the EXACT string of the correct option, not just a letter like 'A' or 'B'.
3. Randomize the position of the correct answer across different questions.

Count: 10 MCQs, 10 flashcards, 10 Q&A.`;
}

export function buildExistingTopicPrompt(
  topicName: string,
  existingQuestions: string[],
  material?: string
): string {
  const existingList = existingQuestions.length > 0 
    ? existingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : 'None';

  const materialContext = material ? `\nMaterial to draw from:\n${material}\n` : '';

  return `Case 2 — New Questions for Existing Topic
Topic: ${topicName}
${materialContext}

These questions already exist — do not regenerate or rephrase them:
${existingList}

Generate additional questions covering different concepts or angles not addressed above. Return only valid JSON, no explanation:

{
  "mcqs": [
    {
      "question": "Deep technical question here",
      "options": ["Plausible wrong answer 1", "Plausible wrong answer 2", "Correct answer", "Plausible wrong answer 3"],
      "answer": "Correct answer" // MUST EXACTLY MATCH ONE OF THE STRINGS IN THE OPTIONS ARRAY. Do not use A/B/C/D.
    }
  ],
  "flashcards": [{"front": "","back": ""}],
  "qa": [{"question": "","answer": ""}]
}

CRITICAL RULES:
1. For MCQs, the distractors (wrong options) MUST be highly plausible, confusing, and test deep technical understanding. Do NOT make them obviously wrong or easy to guess.
2. The 'answer' field MUST be the EXACT string of the correct option, not just a letter like 'A' or 'B'.
3. Randomize the position of the correct answer across different questions.

Count: 5 MCQs, 5 flashcards, 5 Q&A.`;
}
