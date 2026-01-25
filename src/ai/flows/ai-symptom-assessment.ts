'use server';

/**
 * @fileOverview An AI-powered symptom assessment tool for staff members to analyze patient logs.
 *
 * - analyzePatientLogs - A function that analyzes patient logs and provides symptom assessments.
 * - AnalyzePatientLogsInput - The input type for the analyzePatientLogs function.
 * - AnalyzePatientLogsOutput - The return type for the analyzePatientLogs function.
 */

import { generateJson } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzePatientLogsInputSchema = z.object({
  currentLog: z.string().describe('The current daily log entry from the patient.'),
  previousLogs: z
    .array(z.string())
    .describe('An array of previous daily log entries from the patient.'),
});
export type AnalyzePatientLogsInput = z.infer<typeof AnalyzePatientLogsInputSchema>;

const AnalyzePatientLogsOutputSchema = z.object({
  relevantSymptoms: z
    .array(z.string())
    .describe('Symptoms from previous logs that are relevant to the current log.'),
  suggestedSymptomClusters: z
    .array(z.string())
    .describe('Possible symptom clusters that might indicate a worsening condition.'),
  recommendations: z
    .string()
    .describe('Suggested actions or recommendations for doctors based on the analysis.'),
});
export type AnalyzePatientLogsOutput = z.infer<typeof AnalyzePatientLogsOutputSchema>;

export async function analyzePatientLogs(input: AnalyzePatientLogsInput): Promise<AnalyzePatientLogsOutput> {
  const prompt = `You are an AI assistant that analyzes patient logs to identify potential issues.

Analyze the patient's current log and previous logs to identify relevant symptoms and suggest possible symptom clusters that might indicate a worsening condition. Provide recommendations for doctors based on your analysis.

Current Log: ${input.currentLog}
Previous Logs:\n${input.previousLogs.map(l => `- ${l}`).join('\n')}

Respond ONLY with JSON in the following format and nothing else:
{
  "relevantSymptoms": ["..."],
  "suggestedSymptomClusters": ["..."],
  "recommendations": "..."
}`;

  try {
    const raw = await generateJson<unknown>(prompt);
    return AnalyzePatientLogsOutputSchema.parse(raw);
  } catch (err: any) {
    const msg = String(err?.message || err);
    if (msg.includes('Missing GEMINI_API_KEY') || msg.includes('GOOGLE_API_KEY')) {
      return {
        relevantSymptoms: [],
        suggestedSymptomClusters: [],
        recommendations: 'AI unavailable. Please set GEMINI_API_KEY or GOOGLE_API_KEY and restart the server.',
      };
    }
    throw err;
  }
}
