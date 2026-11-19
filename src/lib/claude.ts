import { Law, ExplainResult, CreateLawResult, CorrelationResult } from '../types';
import { buildExplainPrompt } from './prompts/explain';
import { buildCreateLawPrompt } from './prompts/create';
import { buildCorrelationsPrompt } from './prompts/correlations';

const CLAUDE_API_URL = '/api/claude'; // Edge Function proxy

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await res.json();
  return data.content;
}

function parseJSON<T>(raw: string): T {
  // מחלץ JSON מתוך תגובה שעשויה להכיל טקסט נוסף
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]) as T;
}

export async function explainPhenomenon(
  phenomenon: string
): Promise<ExplainResult> {
  const prompt = buildExplainPrompt(phenomenon);
  const raw = await callClaude(prompt);
  return parseJSON<ExplainResult>(raw);
}

export async function createNewLaw(
  parentLaws: Law[]
): Promise<CreateLawResult> {
  const prompt = buildCreateLawPrompt(parentLaws);
  const raw = await callClaude(prompt);
  return parseJSON<CreateLawResult>(raw);
}

export async function findCorrelations(
  law: Law
): Promise<CorrelationResult> {
  const prompt = buildCorrelationsPrompt(law);
  const raw = await callClaude(prompt);
  return parseJSON<CorrelationResult>(raw);
}
