import data from '../data/gear.json';
import { instanceScore } from './growth';
import type { GearInstance } from './saveTypes';

/** Preserve the effective legacy sort, RNG and clock order for non-Boss drops. */
export function generateGear(hero: string, source: 'gold' | 'chest', random = Math.random, now = Date.now): GearInstance {
  const rarity = source === 'gold' ? 'gold' : 'purple';
  const catalog: Record<string, { name: string; slot: string; score: number; boss?: string }> = data.catalog;
  const pool = Object.keys(catalog).filter(id => !catalog[id]!.boss);
  const templateId = pool[Math.floor(random() * pool.length)]!, template = catalog[templateId]!;
  const affixes = data.affixPool.slice().sort(() => random() - .5).slice(0, data.rarityAffixCounts[rarity])
    .map(([key, , min, max]) => ({ key: String(key), value: Number(min) + random() * (Number(max) - Number(min)) }));
  const item: GearInstance = { uid: 'G' + now().toString(36) + random().toString(36).slice(2, 8), templateId, id: templateId, name: template.name, slot: template.slot, rarity, score: template.score, source, affixes, acquiredAt: now() };
  item.score = instanceScore(item, hero);
  return item;
}
