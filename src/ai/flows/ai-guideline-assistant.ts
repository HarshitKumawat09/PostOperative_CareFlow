'use server';

import { generateJson } from '@/ai/genkit';
import { z } from 'zod';
import { clinicalKnowledge } from '@/lib/clinical-knowledge';

const GuidelineAssistantInputSchema = z.object({
  question: z.string().describe('Free-form clinical question from staff'),
  patientSummary: z
    .string()
    .describe('Short narrative summary of the patient and recent logs (pain, tasks, notes, timeline).'),
});

export type GuidelineAssistantInput = z.infer<typeof GuidelineAssistantInputSchema>;

const GuidelineAssistantOutputSchema = z.object({
  answer: z.string().describe('Guideline-aware answer tailored to this patient.'),
  usedSources: z.array(z.string()).describe('Titles of knowledge base items that were used as context.'),
});

export type GuidelineAssistantOutput = z.infer<typeof GuidelineAssistantOutputSchema>;

function scoreKnowledgeItem(question: string, itemTags: string[]): number {
  const q = question.toLowerCase();
  return itemTags.reduce((score, tag) => (q.includes(tag.toLowerCase()) ? score + 1 : score), 0);
}

function retrieveRelevantKnowledge(question: string) {
  const scored = clinicalKnowledge
    .map(item => ({
      item,
      score: scoreKnowledgeItem(question, item.tags),
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter(s => s.score > 0).slice(0, 3).map(s => s.item);
  return top.length > 0 ? top : clinicalKnowledge.slice(0, 2);
}

export async function askGuidelineAssistant(
  input: GuidelineAssistantInput,
): Promise<GuidelineAssistantOutput> {
  const knowledge = retrieveRelevantKnowledge(input.question);
  const knowledgeText = knowledge
    .map(k => `[${k.title}]\n${k.content}`)
    .join('\n\n');

  const prompt = `You are a cautious clinical assistant helping staff interpret post-operative patient logs.

First, carefully read the patient summary.
Then, review the provided guideline snippets. Use them as primary ground truth when possible.

If the question goes beyond the snippets, you may use general medical knowledge but you must:
- Clearly separate what comes from the snippets vs. general knowledge.
- Avoid making firm diagnoses or prescribing medication.
- Encourage contacting the supervising doctor or appropriate service when risk is non-trivial.

Patient summary:
${input.patientSummary}

Relevant guideline snippets:
${knowledgeText}

Staff question:
"${input.question}"

Respond ONLY with JSON in this exact format and nothing else:
{
  "answer": "Main answer, clearly referencing any guideline snippets you rely on and flagging uncertainty.",
  "usedSources": [${knowledge.map(k => `"${k.title}"`).join(', ')}]
}`;

  try {
    const raw = await generateJson<unknown>(prompt);
    return GuidelineAssistantOutputSchema.parse(raw);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (
      msg.includes('Missing OPENAI_API_KEY') ||
      msg.includes('Missing GEMINI_API_KEY') ||
      msg.includes('GOOGLE_API_KEY')
    ) {
      return {
        answer:
          'AI unavailable. Please set OPENAI_API_KEY (recommended) or GEMINI_API_KEY/GOOGLE_API_KEY in .env.local and restart the server.',
        usedSources: knowledge.map(k => k.title),
      };
    }
    throw err;
  }
}
