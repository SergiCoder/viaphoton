import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = path.resolve(__dirname, '..');
const TSX_BIN = path.resolve(REPO_ROOT, 'node_modules/.bin/tsx');
const CLI_PATH = path.resolve(REPO_ROOT, 'scripts/cli.ts');

function runCli(input: string): string {
  return execFileSync(TSX_BIN, [CLI_PATH], {
    cwd: REPO_ROOT,
    input,
    encoding: 'utf8',
  });
}

describe('scripts/cli.ts — end-to-end via child_process', () => {
  it('echoes valid lines with computed X', () => {
    const out = runCli('5,10,1,10\n0,100,1,10\n').trim().split('\n');
    expect(out).toEqual(['5,10,1,10 -> X = 5', '0,100,1,10 -> X = 100']);
  });

  it('handles the canonical jeep trap correctly', () => {
    const out = runCli('10,100,1,10\n').trim();
    expect(out).toMatch(/^10,100,1,10 -> X = 13\.997/);
    expect(out).not.toMatch(/-> X = 0$/);
  });

  it('emits error rows for invalid lines without failing the run', () => {
    const out = runCli('1,2,3\n5,10,1,10\n').trim().split('\n');
    expect(out[0]).toMatch(/^1,2,3 -> error:/);
    expect(out[1]).toBe('5,10,1,10 -> X = 5');
  });

  it('produces no output for empty stdin', () => {
    const out = runCli('');
    expect(out).toBe('');
  });
});
