'use client';

import GeminiAssistantSimple from '@/components/dashboard/gemini-assistant-simple';

export default function TestGeminiPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Gemini Medical Assistant Test</h1>
      <p className="text-gray-600 mb-4">Test the Gemini AI Medical Assistant here</p>
      <GeminiAssistantSimple />
    </div>
  );
}
