import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export const DEFAULT_GEMINI_MODEL = 'models/gemini-flash-latest';

export async function generateJson<T = unknown>(
  prompt: string,
  modelName: string = DEFAULT_GEMINI_MODEL,
): Promise<T> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        return JSON.parse(match[1]) as T;
      }
      throw new Error('Gemini did not return valid JSON');
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a helpful assistant that only returns valid JSON.' },
        { role: 'user', content: prompt },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? '';
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error('OpenAI did not return valid JSON');
    }
  }

  throw new Error('Missing GEMINI_API_KEY/GOOGLE_API_KEY or OPENAI_API_KEY in environment');
}
