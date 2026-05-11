import { NutForm } from '@/components/nut-form';

export default function Page() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nut transport</h1>
        <p className="text-sm text-muted-foreground">
          Maximum nuts deliverable across a desert — the classical Jeep / Desert-Crossing problem.
          Enter one <code className="rounded bg-muted px-1 py-0.5 text-xs">D,N,F,C</code> line per
          case.
        </p>
      </header>
      <NutForm />
    </main>
  );
}
