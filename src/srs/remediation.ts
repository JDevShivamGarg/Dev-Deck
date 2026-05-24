import { getUserConfig } from '../db/queries/config';
import { insertCard } from '../db/queries/cards';
import { parseGeneratedCardsJSON } from '../ai/generator';
import Constants from 'expo-constants';

export async function triggerRemediation(
  topicId: number,
  topicName: string,
  conceptTag: string
): Promise<void> {
  console.log(`[SRS Remediation] Weak concept detected: ${conceptTag} in topic ${topicName}. Triggering background card synthesis...`);

  let apiKey = await getUserConfig('groq_api_key');
  if (!apiKey) {
    apiKey = Constants.expoConfig?.extra?.groqApiKey
      ?? process.env.EXPO_PUBLIC_GROQ_API_KEY
      ?? '';
  }

  if (!apiKey) {
    console.log('[SRS Remediation] API Key not configured. Skipping background card synthesis.');
    return;
  }

  const prompt = `
You are a senior developer mentor tutoring a junior engineer in "${topicName}".
The student has failed multiple questions in a row on the specific concept of: "${conceptTag}".

Generate exactly 3 premium-quality practice cards specifically designed to remediate their understanding of "${conceptTag}".
Provide exactly:
- 1 MCQ (multiple choice)
- 1 Flashcard (simple QA)
- 1 Scenario (debugging context / real-world problem)

Return a single JSON object. Do NOT include any markdown formatting, no backticks, no text before or after the JSON. Follow this exact JSON schema:
{
  "mcqs": [
    {
      "question": "Concisely describe a situation or question about ${conceptTag}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option A",
      "difficulty": 3,
      "explanation": "Explain why this option is correct and clear up common misconceptions."
    }
  ],
  "flashcards": [
    {
      "front": "A focused, short question or command about ${conceptTag}.",
      "back": "The exact, clear answer or explanation.",
      "difficulty": 2
    }
  ],
  "qa": [
    {
      "question": "A real-world debugging scenario. Describe a problem involving ${conceptTag} and ask the student how to resolve it.",
      "answer": "Describe the debugging step or resolution command perfectly.",
      "difficulty": 4
    }
  ]
}
`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 3000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'Return only valid JSON. No markdown wrappers.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq API error: ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    const result = parseGeneratedCardsJSON(content);

    console.log(`[SRS Remediation] Generated ${result.cards.length} targeted remediation cards for: ${conceptTag}. Saving...`);
    for (const card of result.cards) {
      await insertCard(topicId, card._mappedMode as any, card, 'ai');
    }
    console.log('[SRS Remediation] Targeted cards successfully saved to the active queue.');
  } catch (error) {
    console.error('[SRS Remediation] Background targeted card generation failed:', error);
  }
}
