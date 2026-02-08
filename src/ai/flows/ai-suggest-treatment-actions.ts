'use server';

/**
 * @fileOverview An AI-powered tool that suggests treatment actions or recommendations for medical staff based on a patient's daily logs and identified symptom clusters.
 *
 * - suggestTreatmentActions - A function that takes patient logs as input and returns suggested treatment actions.
 * - SuggestTreatmentActionsInput - The input type for the suggestTreatmentActions function.
 * - SuggestTreatmentActionsOutput - The return type for the suggestTreatmentActions function.
 */

import { generateJson } from '@/ai/genkit';
import { z } from 'zod';

const DailyLogSchema = z.object({
  painLevel: z.number().describe('Pain level reported by the patient (1-10).'),
  woundImage: z.string().describe('Data URI of the wound image.'),
  taskCompletion: z.object({
    completed: z.boolean().describe('Whether the daily tasks were completed.'),
  }).describe('Task completion status'),
  additionalNotes: z.string().describe('Additional notes from the patient.'),
  timestamp: z.number().describe('Timestamp of the log entry'),
});

const SuggestTreatmentActionsInputSchema = z.object({
  patientId: z.string().describe('The ID of the patient.'),
  dailyLogs: z.array(DailyLogSchema).describe('Array of patient daily logs.'),
});

export type SuggestTreatmentActionsInput = z.infer<typeof SuggestTreatmentActionsInputSchema>;

const SuggestTreatmentActionsOutputSchema = z.object({
  suggestedActions: z.array(z.string()).describe('Array of suggested treatment actions or recommendations.'),
  symptomClusters: z.array(z.string()).describe('Array of identified symptom clusters.'),
});

export type SuggestTreatmentActionsOutput = z.infer<typeof SuggestTreatmentActionsOutputSchema>;

export async function suggestTreatmentActions(input: SuggestTreatmentActionsInput): Promise<SuggestTreatmentActionsOutput> {
  const logsText = input.dailyLogs
    .map(l => `- Pain Level: ${l.painLevel}, Wound Image: [image], Task Completion: ${l.taskCompletion.completed}, Additional Notes: ${l.additionalNotes}, Timestamp: ${l.timestamp}`)
    .join('\n');

  const prompt = `You are an AI assistant designed to analyze patient daily logs and suggest treatment actions or recommendations for medical staff.

Analyze the following patient daily logs and identify any symptom clusters. Based on the identified symptom clusters and trends in the logs, suggest treatment actions or recommendations. Consider factors such as pain level, wound appearance (from the image description), task completion, and any additional notes provided by the patient.

Patient ID: ${input.patientId}
Daily Logs:\n${logsText}

Respond ONLY with JSON in the following format and nothing else:
{
  "suggestedActions": ["..."],
  "symptomClusters": ["..."]
}`;

  try {
    const raw = await generateJson<unknown>(prompt);
    return SuggestTreatmentActionsOutputSchema.parse(raw);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('Missing GEMINI_API_KEY') || msg.includes('GOOGLE_API_KEY')) {
      return {
        suggestedActions: [
          'AI unavailable. Please set GEMINI_API_KEY or GOOGLE_API_KEY and restart the server.',
        ],
        symptomClusters: [],
      };
    }
    throw err;
  }
}
