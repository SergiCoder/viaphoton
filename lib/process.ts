import { parseLine } from './parse';
import { solve } from './solve';

export type ResultLine =
  | { ok: true; input: string; X: number }
  | { ok: false; input: string; error: string };

export function processInput(text: string): ResultLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line): ResultLine => {
      const parsed = parseLine(line);
      if (!parsed.ok) {
        return { ok: false, input: parsed.input, error: parsed.error };
      }
      const { D, N, F, C } = parsed.value;
      return { ok: true, input: parsed.input, X: solve(D, N, F, C) };
    });
}

export function formatResults(results: ResultLine[]): string {
  return results
    .map((r) => (r.ok ? `${r.input} -> X = ${r.X}` : `${r.input} -> error: ${r.error}`))
    .join('\n');
}
