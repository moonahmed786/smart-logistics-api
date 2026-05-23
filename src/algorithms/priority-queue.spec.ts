import { MinHeap } from './priority-queue';

describe('MinHeap', () => {
  it('returns undefined when popping an empty heap', () => {
    const h = new MinHeap<number>((a, b) => a - b);
    expect(h.pop()).toBeUndefined();
    expect(h.peek()).toBeUndefined();
    expect(h.size).toBe(0);
  });

  it('pops numbers in ascending order', () => {
    const h = new MinHeap<number>((a, b) => a - b);
    [5, 3, 8, 1, 9, 2, 7].forEach((n) => h.push(n));
    const out: number[] = [];
    while (h.size > 0) out.push(h.pop()!);
    expect(out).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it('peek does not mutate', () => {
    const h = new MinHeap<number>((a, b) => a - b);
    h.push(3);
    h.push(1);
    h.push(2);
    expect(h.peek()).toBe(1);
    expect(h.size).toBe(3);
    expect(h.peek()).toBe(1);
  });

  it('supports custom comparator (strings)', () => {
    const h = new MinHeap<string>((a, b) => a.localeCompare(b));
    ['delta', 'alpha', 'charlie', 'bravo'].forEach((s) => h.push(s));
    const out: string[] = [];
    while (h.size > 0) out.push(h.pop()!);
    expect(out).toEqual(['alpha', 'bravo', 'charlie', 'delta']);
  });

  it('sorts a large random sequence', () => {
    const h = new MinHeap<number>((a, b) => a - b);
    const xs: number[] = [];
    for (let i = 0; i < 10_000; i++) {
      const n = Math.floor(Math.random() * 1_000_000);
      xs.push(n);
      h.push(n);
    }
    const out: number[] = [];
    while (h.size > 0) out.push(h.pop()!);
    xs.sort((a, b) => a - b);
    expect(out).toEqual(xs);
  });
});
