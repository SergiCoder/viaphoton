import { memo, type JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type SampleCase = {
  readonly line: string;
  readonly expected: string;
  readonly note: string;
};

export const SAMPLE_CASES: readonly SampleCase[] = [
  { line: '0,100,1,10', expected: '100', note: 'D = 0 — town at the pile, no travel' },
  { line: '10,0,1,10', expected: '0', note: 'N = 0 — no nuts to move' },
  { line: '10,100,1,0', expected: '0', note: "C = 0 — cart can't carry anything" },
  { line: '10,100,0,10', expected: '100', note: 'F = 0 — zero fuel cost, all arrives' },
  { line: '5,10,1,10', expected: '5', note: 'Single trip, half the load is fuel' },
  { line: '10,10,1,10', expected: '0', note: 'Single trip, all of it is fuel' },
  { line: '100,5,1,10', expected: '0', note: "One small load can't reach a far town" },
  {
    line: '10,100,1,10',
    expected: '≈ 13.998',
    note: 'Jeep canonical: D·F = C, naive answer is 0 — real answer needs depot shuttling',
  },
  {
    line: '20,200,1,10',
    expected: '≈ 4.797',
    note: 'The hint: D·F > C and X is still positive',
  },
  {
    line: '100,1000,1,10',
    expected: '0',
    note: 'Impossible at scale: harmonic sum of segments grows ~log',
  },
] as const;

export const SAMPLE_INPUT = SAMPLE_CASES.map((c) => c.line).join('\n');

export const SampleLegend = memo(function SampleLegend(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sample cases — what each one probes</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left font-medium text-muted-foreground">D,N,F,C</th>
              <th className="py-2 text-left font-medium text-muted-foreground">Expected X</th>
              <th className="py-2 text-left font-medium text-muted-foreground">What it checks</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_CASES.map((c) => (
              <tr key={c.line} className="border-b last:border-0">
                <td className="py-1.5 pr-3 font-mono text-xs">{c.line}</td>
                <td className="py-1.5 pr-3 font-mono text-xs">{c.expected}</td>
                <td className="py-1.5 pr-3 text-muted-foreground">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});
