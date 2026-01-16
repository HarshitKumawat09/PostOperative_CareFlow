'use server';

/**
 * @fileOverview An AI-powered symptom assessment tool for staff members to analyze patient logs.
 *
 * - analyzePatientLogs - A function that analyzes patient logs and provides symptom assessments.
 * - AnalyzePatientLogsInput - The input type for the analyzePatientLogs function.
 * - AnalyzePatientLogsOutput - The return type for the analyzePatientLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return analyzePatientLogsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePatientLogsPrompt',
  input: {schema: AnalyzePatientLogsInputSchema},
  output: {schema: AnalyzePatientLogsOutputSchema},
  prompt: `You are an AI assistant that analyzes patient logs to identify potential issues.

  Analyze the patient's current log and previous logs to identify relevant symptoms and suggest possible symptom clusters that might indicate a worsening condition. Provide recommendations for doctors based on your analysis.

  Current Log: {{{currentLog}}}
  Previous Logs: {{#each previousLogs}}{{{this}}}{{#unless @last}}\n---\n{{/unless}}{{/each}}

  Output your response in JSON format:
  {
    "relevantSymptoms": ["..."],
    "suggestedSymptomClusters": ["..."],
    "recommendations": "..."
  }
  `,
});

const analyzePatientLogsFlow = ai.defineFlow(
  {
    name: 'analyzePatientLogsFlow',
    inputSchema: AnalyzePatientLogsInputSchema,
    outputSchema: AnalyzePatientLogsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
