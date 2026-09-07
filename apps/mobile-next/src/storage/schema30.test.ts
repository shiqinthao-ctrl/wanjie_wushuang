import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { MAX_IMPORT_BYTES, parseSchema30, previewBlocker } from './schema30';

describe('Schema30 copy boundary', () => {
  it('preserves every existing and unknown field without changing the input', () => {
    const source = { ...structuredClone(fresh), futureFeature: { text: '<script>example</script>', nested: [null, { retained: true }] } };
    const raw = JSON.stringify(source), parsed = parseSchema30(raw);
    expect(parsed).toEqual(source);
    parsed.heroes.H001!.level++;
    expect(JSON.stringify(source)).toBe(raw);
    expect(Object.values(source.chapters).flatMap(chapter => Object.values(chapter.stars))).toEqual(Array(12).fill(0));
  });
  it.each(['not json', 'null', '[]', '{}', '{"schemaVersion":31}', '{"schemaVersion":29}'])('rejects %s without substituting a fresh save', raw => {
    expect(() => parseSchema30(raw)).toThrow();
  });
  it.each([
    (s: Record<string, unknown>) => { s.gold = -1; },
    (s: Record<string, unknown>) => { s.gold = 1.5; },
    (s: Record<string, unknown>) => { s.heroes = []; },
    (s: Record<string, unknown>) => { s.inventory = { gearInstances: [{ uid: 'bad' }] }; },
    (s: Record<string, unknown>) => { s.chapters = { ST001: { stars: { 'ST001-01': 4 } } }; },
    (s: Record<string, unknown>) => { s.build = { active: 1, passive: [] }; },
  ])('rejects malformed required fields', mutate => {
    const source: Record<string, unknown> = structuredClone(fresh); mutate(source);
    expect(() => parseSchema30(JSON.stringify(source))).toThrow();
  });
  it('rejects unsafe object keys, non-finite JSON numbers, deep and oversized documents', () => {
    expect(() => parseSchema30(JSON.stringify(fresh).replace('"accountLv":12', '"__proto__":{"polluted":true},"accountLv":12'))).toThrow();
    expect(() => parseSchema30(JSON.stringify(fresh).replace('"gold":6000', '"gold":1e400'))).toThrow();
    expect(() => parseSchema30(' '.repeat(MAX_IMPORT_BYTES + 1))).toThrow();
    let nested: unknown = null;
    for (let i = 0; i < 70; i++) nested = { nested };
    expect(() => parseSchema30(JSON.stringify({ ...fresh, nested }))).toThrow();
    expect(Object.prototype).not.toHaveProperty('polluted');
  });
  it('stores other content unchanged while explaining the current preview boundary', () => {
    const raw = JSON.stringify({ ...fresh, hero: 'H010', selectedStage: 'ST003-01' });
    expect(parseSchema30(raw).hero).toBe('H010');
    expect(previewBlocker(parseSchema30(raw))).toContain('赤焰战神');
    expect(previewBlocker(parseSchema30(JSON.stringify(fresh)))).toBe('');
    expect(previewBlocker({ ...structuredClone(fresh), mode: 'endless' })).toContain('剧情');
    expect(previewBlocker({ ...structuredClone(fresh), build: { active: ['A099'], passive: ['P026'] } })).toContain('技能');
  });
  it.each([
    { difficulty: 'hard' },
    { selectedChapter: 'ST002' },
    { runes: ['R999'] },
    { talents: { T999: 1 } },
    { equipInst: { weapon: 'missing' } },
  ])('blocks unimplemented preparation without altering its stored fields: %j', change => {
    const source = { ...structuredClone(fresh), ...change };
    const save = parseSchema30(JSON.stringify(source));
    expect(save).toEqual(source);
    expect(previewBlocker(save)).not.toBe('');
  });
  it('blocks equipped unknown templates while retaining their original data', () => {
    const source = structuredClone(fresh);
    source.inventory.gearInstances[0]!.templateId = 'EQ_UNKNOWN';
    expect(previewBlocker(parseSchema30(JSON.stringify(source)))).not.toBe('');
  });
});
