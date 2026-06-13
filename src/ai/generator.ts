import { buildNewTopicPrompt, buildExistingTopicPrompt } from './prompts';
import { getUserConfig } from '../db/queries/config';
import type { RawCard } from '../types';

export interface BatchGenerationResult {
  topic?: string;
  cards: (RawCard & { _mappedMode: string })[];
}

export async function generateNewTopic(
  topicName: string,
  material: string,
  apiKey: string
): Promise<BatchGenerationResult> {
  const customTemplate = await getUserConfig('prompt_generation').catch(() => null);
  const prompt = buildNewTopicPrompt(topicName, material, customTemplate);
  return await executeBatchGeneration(prompt, apiKey);
}

export async function generateAdditionalCards(
  topicName: string,
  existingQuestions: string[],
  apiKey: string
): Promise<BatchGenerationResult> {
  const customTemplate = await getUserConfig('prompt_generation').catch(() => null);
  const prompt = buildExistingTopicPrompt(topicName, existingQuestions, undefined, customTemplate);
  return await executeBatchGeneration(prompt, apiKey);
}

async function executeBatchGeneration(prompt: string, apiKey: string): Promise<BatchGenerationResult> {
  const systemMessage = 'Return only a valid JSON object. No markdown, no preamble. Follow the requested structure exactly.';

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

    return parseGeneratedCardsJSON(content);
  } catch (error) {
    console.error('AI batch generation failed:', error);
    return { cards: [] };
  }
}

export function parseGeneratedCardsJSON(content: string): BatchGenerationResult {
  try {
    // Extract JSON object from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }

    // Clean JSON string of comments, trailing commas, and smart quotes
    let cleanedJson = jsonMatch[0]
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");

    // Remove block comments
    cleanedJson = cleanedJson.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove single line comments (but not inside double quoted strings)
    cleanedJson = cleanedJson.replace(/\/\/(?=(?:[^"]*"[^"]*")*[^"]*$)[^\n]*/gm, '');

    // Remove trailing commas before closing brackets/braces
    cleanedJson = cleanedJson.replace(/,\s*([\]}])/g, '$1');

    const parsed = JSON.parse(cleanedJson);
    const cards: (RawCard & { _mappedMode: string })[] = [];

    // Parse MCQs
    if (Array.isArray(parsed.mcqs)) {
      parsed.mcqs.forEach((mcq: any) => {
        if (mcq.question && mcq.options && mcq.answer) {
          cards.push({
            question: mcq.question,
            options: mcq.options,
            answer: mcq.answer,
            difficulty: mcq.difficulty || 3,
            explanation: mcq.explanation || 'Generated from material',
            _mappedMode: 'mcq'
          } as RawCard & { _mappedMode: string });
        }
      });
    }

    // Parse Flashcards
    if (Array.isArray(parsed.flashcards)) {
      parsed.flashcards.forEach((fc: any) => {
        if (fc.front && fc.back) {
          cards.push({
            question: fc.front,
            answer: fc.back,
            difficulty: fc.difficulty || 3,
            explanation: fc.explanation || 'Generated from material',
            _mappedMode: 'flashcard'
          } as RawCard & { _mappedMode: string });
        }
      });
    }

    // Parse Q&A (Mapping to scenario)
    if (Array.isArray(parsed.qa)) {
      parsed.qa.forEach((qa: any) => {
        if (qa.question && qa.answer) {
          cards.push({
            question: qa.question,
            answer: qa.answer,
            code_snippet: '', // Keep empty or generate if needed
            difficulty: qa.difficulty || 3,
            explanation: qa.answer, // Use answer as explanation too
            _mappedMode: 'scenario'
          } as RawCard & { _mappedMode: string });
        }
      });
    }

    return {
      topic: parsed.topic,
      cards
    };
  } catch (error) {
    console.error('JSON Parsing failed:', error);
    throw new Error('Failed to parse AI generated cards.');
  }
}
