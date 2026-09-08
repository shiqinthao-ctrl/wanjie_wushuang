import type { SaveRepository, SaveSlot } from './SaveRepository';
import { isStarter } from '../core/evolutionCatalog';

export async function prepareHero(repository: SaveRepository, slot: SaveSlot, hero: string): Promise<SaveSlot> {
  const committed = await repository.transactOnce(slot.id, `hero-${crypto.randomUUID()}`, slot.revision, save => {
    if (!isStarter(hero) || !save.heroes[hero]?.unlocked) throw new Error('此初始英雄尚未解锁。');
    save.hero = hero;
    return { hero };
  });
  return committed.slot;
}
