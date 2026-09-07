import data from '../data/gear.json';
import { instanceScore } from './growth';
import type { GearInstance } from './saveTypes';
import firstBoss from '../data/firstBoss.json';

interface DropOptions { difficulty?: string; dropBonus?: number; templateId?: string; rawScore?: boolean }
/** Template, rarity, affix sort/values, UID, then acquisition clock: order affects RNG. */
export function generateGear(hero: string, source: 'gold' | 'chest' | 'elite' | 'boss', random = Math.random, now = Date.now, options: DropOptions = {}): GearInstance {
  const catalog: Record<string, { name: string; slot: string; score: number; boss?: string }> = data.catalog;
  const pool = source === 'boss' ? firstBoss.pool : Object.keys(catalog).filter(id => !catalog[id]!.boss);
  const templateId = options.templateId || pool[Math.floor(random() * pool.length)]!, template = catalog[templateId]!;
  let rarity: 'gold' | 'purple' | 'mythic' = source === 'gold' || source === 'boss' ? 'gold' : 'purple';
  if (source === 'boss' && options.difficulty === 'nightmare' && random() < .14) rarity = 'mythic';
  else if (source === 'boss' && options.difficulty === 'hard' && random() < .05) rarity = 'mythic';
  if (rarity === 'gold' && (options.dropBonus || 0) > 0 && random() < options.dropBonus! * .45) rarity = 'mythic';
  const affixes = data.affixPool.slice().sort(() => random() - .5).slice(0, data.rarityAffixCounts[rarity])
    .map(([key, , min, max]) => ({ key: String(key), value: Number(min) + random() * (Number(max) - Number(min)) }));
  const item: GearInstance = { uid: 'G' + now().toString(36) + random().toString(36).slice(2, 8), templateId, id: templateId, name: template.name, slot: template.slot, rarity, score: template.score, source, affixes, acquiredAt: now() };
  if (!options.rawScore) item.score = instanceScore(item, hero);
  return item;
}

export function bossGearChoices(hero: string, random = Math.random, now = Date.now, options: DropOptions = {}): GearInstance[] {
  return firstBoss.pool.slice().sort(() => random() - .5).map(templateId => generateGear(hero, 'boss', random, now, { ...options, templateId, rawScore: true }));
}
