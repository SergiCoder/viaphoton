import { z } from 'zod';

export const ParamsSchema = z.object({
  D: z.number().int().nonnegative(),
  N: z.number().int().nonnegative(),
  F: z.number().int().nonnegative(),
  C: z.number().int().nonnegative(),
});

export type Params = z.infer<typeof ParamsSchema>;

export type ParsedLine =
  | { ok: true; input: string; value: Params }
  | { ok: false; input: string; error: string };

export function parseLine(raw: string): ParsedLine {
  const input = raw.trim();
  if (input === '') {
    return { ok: false, input, error: 'empty line' };
  }
  const parts = input.split(',').map((piece) => piece.trim());
  if (parts.length !== 4) {
    return {
      ok: false,
      input,
      error: `expected 4 comma-separated values, got ${parts.length}`,
    };
  }
  const numbers = parts.map((piece) => Number(piece));
  if (numbers.some((n) => Number.isNaN(n))) {
    return { ok: false, input, error: 'one or more values are not numeric' };
  }
  const [D, N, F, C] = numbers as [number, number, number, number];
  const parsed = ParamsSchema.safeParse({ D, N, F, C });
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    return { ok: false, input, error: message };
  }
  return { ok: true, input, value: parsed.data };
}
