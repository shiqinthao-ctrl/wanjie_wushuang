import fresh from '../data/freshSave.json';
import type { GameSave } from '../core/saveTypes';
import { calculateStartup } from '../core/growth';
import gear from '../data/gear.json';
import runePets from '../data/runePets.json';
import talents from '../data/talents.json';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const invalid = (field: string): never => { throw new Error(`存档字段无效：${field}。原存档未被覆盖。`); };
const record = (value: unknown, field: string): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(field);
  return value as Record<string, unknown>;
};
const text = (value: unknown, field: string): void => { if (typeof value !== 'string' || !value.length) invalid(field); };
const integer = (value: unknown, field: string, min = 0, max = Number.MAX_SAFE_INTEGER): void => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) invalid(field);
};
const strings = (value: unknown, field: string, max = Infinity): void => {
  if (!Array.isArray(value) || value.length > max || value.some(id => typeof id !== 'string' || !id)) invalid(field);
};
function jsonTree(value: unknown, depth = 0): void {
  if (depth > 64) invalid('数据嵌套过深');
  if (typeof value === 'number' && !Number.isFinite(value)) invalid('非有限数值');
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) invalid('不安全的属性名');
    jsonTree(child, depth + 1);
  }
}

/** Validate copies at the boundary. Never normalize by dropping unknown fields. */
export function parseSchema30(raw: string): GameSave {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES) throw new Error('存档文件超过 5 MB，请使用单个存档文件。');
  let value: unknown;
  try { value = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { throw new Error('文件不是有效的 JSON 存档。原存档未被覆盖。'); }
  const save = record(value, '存档');
  if (save.schemaVersion !== 30) throw new Error('仅支持 Schema30 存档，请保留原文件。');
  jsonTree(save);
  integer(save.gold, 'gold');
  integer(save.accountLv, 'accountLv', 1, 200);
  for (const field of ['accountXp', 'talentPoints', 'modeTokens']) integer(save[field], field);
  const stats = record(save.stats, 'stats');
  for (const field of ['runs', 'kills', 'bossKills']) integer(stats[field], `stats.${field}`);
  const modes = record(save.modeStats, 'modeStats');
  for (const [id, value] of Object.entries(modes)) {
    const mode = record(value, `modeStats.${id}`);
    for (const field of ['runs', 'wins', 'bestKills', 'bestScore']) integer(mode[field], `${id}.${field}`);
    if (typeof mode.bestTime !== 'number' || !Number.isFinite(mode.bestTime) || mode.bestTime < 0) invalid(`${id}.bestTime`);
  }
  if (!Object.hasOwn(modes, 'story')) invalid('modeStats.story');
  for (const field of ['hero', 'pet', 'selectedChapter', 'selectedStage', 'mode']) text(save[field], field);
  if (save.difficulty !== undefined) text(save.difficulty, 'difficulty');
  for (const [id, value] of Object.entries(record(save.heroes, 'heroes'))) {
    const hero = record(value, `heroes.${id}`);
    integer(hero.level, `${id}.level`, 1, 30); integer(hero.mastery, `${id}.mastery`); integer(hero.star, `${id}.star`, 1, 6);
    if (typeof hero.unlocked !== 'boolean' || typeof hero.awakened !== 'boolean') invalid(`heroes.${id}`);
  }
  if (!Object.hasOwn(save.heroes as object, String(save.hero))) invalid('当前英雄进度');
  const inventory = record(save.inventory, 'inventory');
  for (const field of ['gear', 'runes', 'pets']) strings(inventory[field], `inventory.${field}`);
  if (!Array.isArray(inventory.gearInstances)) invalid('inventory.gearInstances');
  const ids = new Set<string>();
  for (const value of inventory.gearInstances as unknown[]) {
    const item = record(value, '装备');
    for (const field of ['uid', 'templateId', 'slot', 'rarity']) text(item[field], `装备.${field}`);
    if (ids.has(String(item.uid))) invalid('重复装备编号');
    ids.add(String(item.uid));
    if (typeof item.score !== 'number' || !Number.isFinite(item.score)) invalid('装备评分');
    if (!Array.isArray(item.affixes)) invalid('装备词条');
    for (const entry of item.affixes as unknown[]) {
      const affix = record(entry, '装备词条'); text(affix.key, '词条名称');
      if (typeof affix.value !== 'number' || !Number.isFinite(affix.value)) invalid('词条数值');
    }
  }
  for (const value of Object.values(record(save.equipInst, 'equipInst'))) text(value, 'equipInst');
  strings(save.runes, 'runes');
  for (const value of Object.values(record(save.talents, 'talents'))) integer(value, '天赋等级');
  const build = record(save.build, 'build'); strings(build.active, '主动技能', 6); strings(build.passive, '被动技能', 6);
  for (const [id, value] of Object.entries(record(save.chapters, 'chapters'))) {
    const chapter = record(value, id);
    for (const star of Object.values(record(chapter.stars, `${id}.stars`))) integer(star, `${id}.stars`, 0, 3);
  }
  return value as GameSave;
}

export function previewBlocker(save: GameSave, journey: 'classic' | 'evolution' = 'classic'): string {
  if (!(journey === 'evolution' ? ['H001', 'H010', 'H012'].includes(save.hero) : save.hero === 'H001') || !save.heroes[save.hero]?.unlocked) return journey === 'evolution' ? '请选择已解锁的初始英雄：赤焰战神、炎忍或影忍。' : '经典预览仅支持赤焰战神；可切换「进化征途」选择初始英雄，当前存档会保留。';
  if (save.mode !== 'story' || save.selectedChapter !== 'ST001' || save.selectedStage !== 'ST001-01') return '当前预览仅支持剧情首关「边境清剿」，其余关卡和模式正在迁移。';
  if (save.difficulty !== undefined && save.difficulty !== 'normal') return '当前预览仅支持普通难度，其他难度正在迁移。';
  if (save.pet !== 'PET001') return '当前预览仅支持火灵同行，其他宠物正在迁移。';
  if (journey === 'classic' && (save.build.active.some(id => !fresh.build.active.includes(id)) || save.build.passive.some(id => !fresh.build.passive.includes(id)))) return '此存档含有尚未迁移的技能，可保留并导出。';
  if (save.runes.some(id => !Object.hasOwn(runePets.runes, id)) || Object.keys(save.talents).some(id => !Object.hasOwn(talents, id))) return '此存档含有尚未支持的符文或天赋，可保留并导出。';
  for (const [slot, uid] of Object.entries(save.equipInst)) {
    const item = save.inventory.gearInstances.find(item => item.uid === uid);
    if (!['weapon', 'armor', 'accessory'].includes(slot) || !item || item.slot !== slot || !Object.hasOwn(gear.catalog, item.templateId)) return '此存档含有尚未支持的装备，可保留并导出。';
  }
  try {
    const { player } = calculateStartup(save);
    if (Object.values(player).some(value => !Number.isFinite(value) || value < 0) || player.maxHp <= 0) return '此存档的出征属性暂不支持。';
  } catch { return '此存档含有尚未支持的装备属性，可保留并导出。'; }
  return '';
}
