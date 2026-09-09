// Synthetic final-run facts for native IndexedDB acceptance. No shipping UI imports this file.
export { SaveRepository } from '../../src/storage/SaveRepository';
export { ChapterRunSession } from '../../src/storage/ChapterRunSession';
export { readChapterProgress, freshChapterProgress } from '../../src/chapter/progress';
export { prepareChapterRun } from '../../src/chapter/prepare';
import type { ChapterFinalRun } from '../../src/chapter/settlement';
export const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 42 } as const;
export const final: ChapterFinalRun = { ...options, endReason: 'victory', time: 310, hp: 200, maxHp: 620,
  level: 8, kills: 150, formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'],
  bonds: ['wildfire', 'shadowfire'], damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: true, bossLootClaimed: true };
export async function receipts(name: string) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(name); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  try { return await new Promise<unknown[]>((resolve, reject) => { const request = db.transaction('receipts').objectStore('receipts').getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
  finally { db.close(); }
}
