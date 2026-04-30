import { buildPrompt } from './prompts';
import type { RawCard, CardMode, Proficiency } from '../types';

export async function generateCards(
  topic: string,
  mode: CardMode,
  proficiency: Proficiency,
  count: number,
  apiKey: string,
  isCustomTopic: boolean = false
): Promise<RawCard[]> {
  const prompt = buildPrompt(topic, mode, proficiency, count);

  const systemMessage = isCustomTopic
    ? `Topic "${topic}" is user-defined. Generate practical, real-world questions relevant to this technology. If the topic is ambiguous or non-technical, return an empty JSON array []. Return only a JSON array. No markdown, no preamble.`
    : 'Return only a JSON array. No markdown, no preamble.';

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from Groq API');
    }

    // Extract JSON array from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const parsed: RawCard[] = JSON.parse(jsonMatch[0]);

    // Validate structure
    return parsed.filter(
      (card) =>
        typeof card.question === 'string' &&
        typeof card.answer === 'string' &&
        typeof card.difficulty === 'number' &&
        card.difficulty >= 1 &&
        card.difficulty <= 5
    );
  } catch (error) {
    console.error('AI card generation failed:', error);
    return [];
  }
}
