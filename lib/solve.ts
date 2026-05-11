/**
 * Maximum nuts deliverable across a desert (Jeep / Desert-Crossing problem).
 *
 * Given a pile of `N` kg at position 0, a town at distance `D` km, cart capacity `C` kg,
 * and a horse that burns `F` kg of nuts per km regardless of cart load, compute the
 * maximum amount `X` that can be delivered to the town.
 *
 * Strategy: while `mass > C`, shuttle with `k = ceil(mass / C)` loads, advancing the
 * depot by `d_k = (mass - (k - 1) * C) / ((2k - 1) * F)` per step (one full load
 * consumed per step at rate `(2k - 1) * F` kg/km). Stop early if the segment would
 * overshoot the town. Once `mass <= C`, finish with one direct trip.
 */
export function solve(D: number, N: number, F: number, C: number): number {
  if (D <= 0) return N;
  if (N <= 0 || C <= 0) return 0;
  if (F <= 0) return N;

  let pos = 0;
  let mass = N;

  while (mass > C) {
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
  return Math.max(0, mass - F * (D - pos));
}
