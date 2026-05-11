// Jeep / Desert-Crossing problem.
// Given pile of N kg at position 0, town at distance D, cart capacity C,
// horse fuel rate F kg/km (load-independent), return max nuts deliverable.
//
// Strategy: while mass > C, shuttle with k = ceil(mass / C) loads, advancing
// the depot by d_k = (mass - (k-1)*C) / ((2k-1)*F) per step (one full load
// consumed per step at rate (2k-1)*F kg/km). Stop early if the segment
// overshoots the town.

export function solve(D, N, F, C) {
  if (D <= 0) return N;
  if (N <= 0 || C <= 0) return 0;
  if (F <= 0) return N;

  let pos = 0;
  let mass = N;

  while (pos < D) {
    if (mass <= C) {
      return Math.max(0, mass - F * (D - pos));
    }
    const k = Math.ceil(mass / C);
    const dropTo = (k - 1) * C;
    const rate = (2 * k - 1) * F;
    const segment = (mass - dropTo) / rate;
    const remain = D - pos;

    if (segment >= remain) {
      return Math.max(0, mass - rate * remain);
    }
    pos += segment;
    mass = dropTo;
  }
  return mass;
}

export function processInput(text) {
  return text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(',').map(s => Number(s.trim()));
      if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) {
        return `${line} -> error: expected 4 comma-separated numbers (D,N,F,C)`;
      }
      const [D, N, F, C] = parts;
      const X = solve(D, N, F, C);
      return `${line} -> X = ${X}`;
    })
    .join('\n');
}
