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
  "mcqs": [{"question": "","options": ["A","B","C","D"],"answer": "A"}],
  "flashcards": [{"front": "","back": ""}],
  "qa": [{"question": "","answer": ""}]
}

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
  "mcqs": [{"question": "","options": ["A","B","C","D"],"answer": "A"}],
  "flashcards": [{"front": "","back": ""}],
  "qa": [{"question": "","answer": ""}]
}

Count: 5 MCQs, 5 flashcards, 5 Q&A.`;
}
