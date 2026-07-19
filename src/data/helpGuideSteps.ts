export interface HelpStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  codeOrFormat?: string;
  tips: string[];
}

export const HELP_GUIDE_STEPS: HelpStep[] = [
  {
    id: 'welcome',
    stepNumber: 1,
    title: 'WELCOME TO DEVDECK',
    subtitle: 'Offline-First Spaced Repetition for Developers',
    description: 'DevDeck is engineered for high-velocity software engineers. All decks, SRS intervals, and logs run 100% locally on local SQLite persistence.',
    codeOrFormat: 'LOCAL PERSISTENCE · ZERO CLOUD LATENCY · BRUTALIST UX',
    tips: [
      'Study cards across MCQ, Flashcard, and Scenario (Q&A) modes.',
      'SRS schedules review cards dynamically based on your accuracy and response speed.',
    ],
  },
  {
    id: 'byo_llm',
    stepNumber: 2,
    title: 'BYO-LLM & JSON IMPORT',
    subtitle: 'Generate Custom Decks Using ChatGPT / Claude',
    description: 'You can generate custom decks using any AI model for free. Simply copy our unified prompt, paste it into ChatGPT/Claude, and paste the JSON output back into DevDeck!',
    codeOrFormat: `{\n  "topic": "System Design & Caching",\n  "mcqs": [\n    {\n      "question": "What is Cache Stampede?",\n      "options": ["A", "B", "C", "D"],\n      "answer": "A",\n      "explanation": "..." \n    }\n  ]\n}`,
    tips: [
      'Go to Settings → Prompt Editor to view or copy the self-generation prompt template.',
      'Tap "NEW TOPIC" or "ADD CARDS" and paste the raw JSON response to import cards immediately.',
      'You don’t even need to type the topic name—DevDeck automatically extracts it from the JSON!',
    ],
  },
  {
    id: 'groq_ai',
    stepNumber: 3,
    title: 'AUTOMATIC GROQ SYNTHESIS',
    subtitle: '1-Click Deck Generation',
    description: 'Prefer automatic generation directly in the app? Add your free Groq API key in Settings to synthesize decks instantly with Llama-3.3-70B.',
    codeOrFormat: 'SETTINGS → EXTERNAL MODEL AUTHENTICATION → GROQ API KEY',
    tips: [
      'Groq offers high-speed free tier API access at console.groq.com.',
      'When your queue runs low (< 5 due cards), DevDeck auto-synthesizes non-duplicate cards in the background.',
    ],
  },
  {
    id: 'study_modes',
    stepNumber: 4,
    title: '3 ASSESSMENT MODES',
    subtitle: 'MCQ, Flashcard & Debugging Scenarios',
    description: 'Master concepts from multiple angles:',
    codeOrFormat: '▸ MCQ: Distractor option analysis\n▸ FLASHCARD: Instant flip & self-assessment\n▸ SCENARIO: Real-world problem breakdown & Git terminal sandbox',
    tips: [
      'In Scenario mode for Git, use the interactive terminal sandbox to run commands!',
      'Tap "REVEAL ANALYSIS" to review explanations when stuck.',
    ],
  },
  {
    id: 'timers_goals',
    stepNumber: 5,
    title: 'QUESTION TIMERS & GOALS',
    subtitle: 'Timer Pausing, Daily Goals & History Filters',
    description: 'Maintain focus without stress. The Question Timer automatically pauses as soon as you reveal an answer so you can study explanations at your own pace.',
    codeOrFormat: 'ANSWER REVEALED → QUESTION TIMER PAUSES → TAP NEXT QUESTION TO RESUME',
    tips: [
      'Configure Stopwatch or Timer mode in Settings.',
      'Set daily goals and review session logs using Today, 7-day, 30-day, or All-time filters in History.',
    ],
  },
];
