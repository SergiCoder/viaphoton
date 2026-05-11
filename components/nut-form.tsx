'use client';

import { type FormEvent, useState } from 'react';
import { SAMPLE_INPUT, SampleLegend } from '@/components/sample-legend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { processInput, type ResultLine } from '@/lib/process';

type IndexedResult = ResultLine & { readonly idx: number };

function indexResults(results: ResultLine[]): IndexedResult[] {
  return results.map((r, idx) => ({ ...r, idx }));
}

export function NutForm() {
  const [text, setText] = useState('');
  const [results, setResults] = useState<IndexedResult[]>([]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResults(indexResults(processInput(text)));
  }

  function onClear() {
    setText('');
    setResults([]);
  }

  function onLoadSample() {
    setText(SAMPLE_INPUT);
    setResults([]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Input</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="input">One D,N,F,C per line (integers in decimal notation)</Label>
              <Textarea
                id="input"
                name="input"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'10,100,1,10\n20,200,1,10'}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Compute</Button>
              <Button type="button" variant="outline" onClick={onClear}>
                Clear
              </Button>
              <Button type="button" variant="secondary" onClick={onLoadSample}>
                Load sample
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <section aria-label="results">
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {results.map((r) =>
                  r.ok ? (
                    <div key={String(r.idx)} data-testid="result-ok">
                      <span className="font-mono">{r.input}</span>
                      <span className="text-muted-foreground"> -&gt; X = </span>
                      <span className="font-mono font-semibold">{r.X}</span>
                    </div>
                  ) : (
                    <div
                      key={String(r.idx)}
                      data-testid="result-error"
                      className="text-destructive"
                    >
                      <span className="font-mono">{r.input}</span>
                      <span> -&gt; error: </span>
                      <span>{r.error}</span>
                    </div>
                  ),
                )}
              </pre>
            </section>
          </CardContent>
        </Card>
      )}

      <SampleLegend />
    </div>
  );
}
