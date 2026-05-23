import { Edge } from '../domain/types';
import { buildEdgePredicate, resolveWeight } from './weight-resolver';

const edge = (over: Partial<Edge> = {}): Edge => ({
  from: 'A',
  to: 'B',
  cost: 10,
  ...over,
});

describe('resolveWeight', () => {
  it("'shortest' uses cost", () => {
    expect(resolveWeight('shortest')(edge({ cost: 7, durationMinutes: 99 }))).toBe(7);
  });

  it("'fastest' uses durationMinutes when present", () => {
    expect(resolveWeight('fastest')(edge({ cost: 7, durationMinutes: 3 }))).toBe(3);
  });

  it("'fastest' falls back to cost when durationMinutes is missing", () => {
    expect(resolveWeight('fastest')(edge({ cost: 7 }))).toBe(7);
  });
});

describe('buildEdgePredicate', () => {
  it('allows everything when constraints are undefined', () => {
    const p = buildEdgePredicate(undefined);
    expect(p(edge({ tags: ['highway'] }))).toBe(true);
    expect(p(edge())).toBe(true);
  });

  it('allows everything when constraints are empty', () => {
    const p = buildEdgePredicate({});
    expect(p(edge({ tags: ['highway'] }))).toBe(true);
  });

  it('rejects highway edges when avoidHighways=true', () => {
    const p = buildEdgePredicate({ avoidHighways: true });
    expect(p(edge({ tags: ['highway'] }))).toBe(false);
    expect(p(edge({ tags: ['scenic'] }))).toBe(true);
    expect(p(edge())).toBe(true);
  });

  it('rejects any avoidTags entry', () => {
    const p = buildEdgePredicate({ avoidTags: ['toll', 'ferry'] });
    expect(p(edge({ tags: ['toll'] }))).toBe(false);
    expect(p(edge({ tags: ['ferry', 'scenic'] }))).toBe(false);
    expect(p(edge({ tags: ['scenic'] }))).toBe(true);
  });

  it('combines avoidHighways and avoidTags', () => {
    const p = buildEdgePredicate({ avoidHighways: true, avoidTags: ['toll'] });
    expect(p(edge({ tags: ['highway'] }))).toBe(false);
    expect(p(edge({ tags: ['toll'] }))).toBe(false);
    expect(p(edge({ tags: ['scenic'] }))).toBe(true);
  });
});
