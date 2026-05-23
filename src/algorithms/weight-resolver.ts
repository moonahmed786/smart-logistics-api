import { Edge, Preference, RouteConstraints } from '../domain/types';

export function resolveWeight(pref: Preference): (edge: Edge) => number {
  if (pref === 'fastest') {
    return (edge) => edge.durationMinutes ?? edge.cost;
  }
  return (edge) => edge.cost;
}

export function buildEdgePredicate(c?: RouteConstraints): (edge: Edge) => boolean {
  if (!c) return () => true;

  const blocked = new Set<string>();
  if (c.avoidHighways) blocked.add('highway');
  if (c.avoidTags) for (const t of c.avoidTags) blocked.add(t);

  if (blocked.size === 0) return () => true;

  return (edge) => {
    if (!edge.tags || edge.tags.length === 0) return true;
    for (const tag of edge.tags) {
      if (blocked.has(tag)) return false;
    }
    return true;
  };
}
