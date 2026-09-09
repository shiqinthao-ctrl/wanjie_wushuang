export type StarterId = 'H001' | 'H010' | 'H012';
export type Journey = 'classic' | 'evolution';
export const starters = [
  { id: 'H001', name: '赤焰战神', style: '近战 · 炎刃', description: '贴近敌群，以斩击和炎龙突进破阵。', skill: '炎龙斩', ult: '赤龙降世', active: ['A003', 'A011'], passive: 'P026', color: '#ef7958' },
  { id: 'H010', name: '炎忍', style: '远射 · 游击', description: '投掷爆炎飞刃，突进布下燃烧路径。', skill: '炎龙疾走', ult: '炎羽天降', active: ['A011', 'A054'], passive: 'P026', color: '#ffc46b' },
  { id: 'H012', name: '影忍', style: '穿透 · 协同', description: '穿透影刃配合分身，灵活切入敌阵。', skill: '影袭瞬杀', ult: '万影杀阵', active: ['A015', 'S001'], passive: 'P033', color: '#86d6d9' },
] as const;
export const isStarter = (id: string): id is StarterId => starters.some(hero => hero.id === id);
export const starter = (id: string) => {
  const hero = starters.find(hero => hero.id === id);
  if (!hero) throw new Error('尚未支持此初始英雄。');
  return hero;
};
export const heroForms = [
  { id: 'dragon', hero: 'H001', name: '赤龙武圣', detail: '普攻斩击追加向前火刃，技能突进破阵。', awakening: '三道火刃，全周斩击。', color: '#ff9d66' },
  { id: 'bulwark', hero: 'H001', name: '焚城炎君', detail: '环形普攻；技能建立火域并获得护盾。', awakening: '扩大火域，提高护盾上限。', color: '#ffce78' },
  { id: 'phoenix', hero: 'H010', name: '烈羽凰使', detail: '三道扇形火羽；技能突进留下火径。', awakening: '五道火羽，延长火径。', color: '#ffc86b' },
  { id: 'legion', hero: 'H010', name: '焰影统领', detail: '投刃攻击；技能召出两名定时攻击的焰影。', awakening: '三名焰影，持续时间延长。', color: '#f5ad86' },
  { id: 'void', hero: 'H012', name: '虚空行者', detail: '穿透影刃；技能生成牵引风暴。', awakening: '提升穿透，扩大牵引风暴。', color: '#6bd5df' },
  { id: 'reaper', hero: 'H012', name: '无间修罗', detail: '近战环斩；技能突进并连续斩击。', awakening: '全周双斩；闪避追加影刃。', color: '#c6e6c0' },
  { id: 'frostlord', hero: 'H001', name: '霜狱剑主', detail: '霜环减速敌群，技能展开随身寒域。引导寒霜环成长。', awakening: '扩大寒域并延长持续时间。', color: '#8de8ff' },
  { id: 'thunderlord', hero: 'H010', name: '九霄雷君', detail: '普攻跳链，技能连锁雷击。引导雷电弹成长。', awakening: '普攻与主动技能增加跳链目标。', color: '#d9f48e' },
  { id: 'beastlord', hero: 'H012', name: '冥契兽王', detail: '穿透双刃，技能召出驻守近卫。引导影分身成长。', awakening: '四名近卫，延长驻守时间。', color: '#9ce7bb' },
  { id: 'windwarden', hero: 'H012', name: '岚影剑尊', detail: '三道穿透影刃；技能在前方布下固定风阵。引导龙卷风成长，围绕风阵牵引敌群。', awakening: '影刃穿透提升至三次；风阵扩大并延长至六秒。', color: '#a4edd5' },
  { id: 'frostflame', hero: 'H001', name: '霜焰剑皇', detail: '霜环减速后射出穿透火刃；技能先降霜、再留下火域。引导寒霜环成长，组合冰火羁绊。', awakening: '扩大霜环与剑域，火刃穿透提升至三次，火域延长至五秒。', color: '#a8e7ee' },
] as const;
export type FormId = typeof heroForms[number]['id'];
export const skillRoutes = [
  { id: 'volley', skill: 'A011', name: '连珠火球', detail: '三道扇射，单发伤害为原来的 65%。' },
  { id: 'nova', skill: 'A011', name: '爆星火球', detail: '单发速度降低，爆炸范围扩大，伤害为原来的 145%。' },
  { id: 'ringfire', skill: 'A011', name: '八方焰轮', detail: '向八个方向同时射出火球，每发伤害为普通的 45%，爆炸范围缩小。适合敌群围绕时清场。' },
  { id: 'roaming', skill: 'A026', name: '游龙风暴', detail: '龙卷向目标游走，持续牵引前方敌人。' },
  { id: 'orbit', skill: 'A026', name: '环身风暴', detail: '龙卷围绕自身旋转，清理近身敌人。' },
  { id: 'ambush', skill: 'A026', name: '伏阵风暴', detail: '在最近目标方向布下固定风阵，最多前置 220 距离。范围扩大，单次伤害为普通龙卷的 80%。' },
  { id: 'hunter', skill: 'S001', name: '游猎影军', detail: '分身跟随移动，向敌人射出影刃。' },
  { id: 'guard', skill: 'S001', name: '守阵影军', detail: '分身留守召唤位置，周期释放范围斩击。' },
  { id: 'glacier', skill: 'G2_FROST', name: '极寒领域', detail: '霜环变为驻留寒域，持续伤害并减速区域内敌人。' },
  { id: 'shatter', skill: 'G2_FROST', name: '碎冰震波', detail: '扩大霜环范围，提高瞬间伤害与减速时间。' },
  { id: 'relay', skill: 'A013', name: '万钧连锁', detail: '多跳两个目标，每跳伤害为普通的 72%。' },
  { id: 'thunderstrike', skill: 'A013', name: '孤雷天罚', detail: '停止跳链，对首目标周围造成 210% 范围雷击。' },
] as const;
export type RouteId = typeof skillRoutes[number]['id'];
export const activeSkills = ['A003', 'A011', 'A021', 'A026', 'A027', 'A054', 'A013', 'A015', 'S001', 'G2_FROST'] as const;
export const journeySkillNames: Record<string, string> = { G2_FROST: '寒霜环' };
export const signatureSkills: Partial<Record<FormId, string>> = { frostlord: 'G2_FROST', thunderlord: 'A013', beastlord: 'S001', windwarden: 'A026', frostflame: 'G2_FROST' };
export const passiveSkills = ['P026', 'P016', 'P017', 'P018', 'P019', 'P030', 'P033', 'P023', 'P024', 'P036', 'P039'] as const;
export const skillTags: Record<string, string> = { A003: '炎', A011: '炎', A021: '炎', A027: '炎', A054: '炎', A026: '风', A013: '雷', A015: '影', S001: '影/召', G2_FROST: '冰' };
export const hasSkillTag = (id: string, tag: string) => skillTags[id]?.split('/').includes(tag) || false;
export const skillDetails: Record<string, string> = {
  A003: '近身扇形斩击，附带短暂火域。', A011: '自动瞄准火球，命中爆炸。Lv.3 可选连珠 / 爆星 / 焰轮。',
  A021: '跟随角色的持续燃烧领域。', A026: '牵引附近敌人的龙卷。Lv.3 可选游龙 / 环身 / 伏阵。',
  A027: '在敌群上空召唤多颗陨石。', A054: '向前铺设持续伤害的火径。',
  A013: '雷电在相邻敌人间跳链。Lv.3 可选连锁 / 天罚。', A015: '多道穿透手里剑。', S001: '召出定时攻击的分身。Lv.3 可选游猎 / 守阵。',
  G2_FROST: '范围霜环，敌人移速降低 45%，首领免疫减速。Lv.3 可选寒域 / 碎冰。',
  P026: '提高炎系技能伤害。', P030: '提高风系技能伤害。', P033: '提高影系技能伤害。', P016: '扩大技能范围。',
  P017: '延长领域与分身持续时间。', P018: '缩短自动技能冷却。', P019: '提高技能伤害。', P023: '增加雷电跳链目标。',
  P024: '火球命中后分裂，增加手里剑数量。', P036: '提高分身伤害。', P039: '增加分身数量。',
};
export const bonds = [
  { id: 'wildfire', name: '风火燎原', tags: ['炎', '风'], detail: '龙卷脉冲追加火焰伤害。', needs: '任一炎系技能 + 龙卷风' },
  { id: 'stormhunt', name: '雷影追猎', tags: ['雷', '影'], detail: '雷电弹多跳一个目标，首领也可跳链。', needs: '雷电弹 + 手里剑或影分身' },
  { id: 'shadowfire', name: '影火同源', tags: ['影', '炎'], detail: '成功闪避在起点留下持续燃烧影印。', needs: '任一炎系技能 + 手里剑或影分身' },
  { id: 'superconduct', name: '冰雷超导', tags: ['冰', '雷'], detail: '雷电命中减速中的敌人，伤害提高 35%。', needs: '寒霜环 + 雷电弹' },
  { id: 'winterlegion', name: '霜卫契约', tags: ['冰', '召'], detail: '召唤单位攻击时追加小范围霜环与减速。', needs: '寒霜环 + 影分身' },
  { id: 'thunderlegion', name: '雷兽共鸣', tags: ['雷', '召'], detail: '召唤单位攻击间隔缩短至 0.6 秒。', needs: '雷电弹 + 影分身' },
  { id: 'galephantom', name: '风影合袭', tags: ['风', '影'], detail: '风暴每次脉冲向附近最近目标射出一枚穿透影刃；无目标时不发射。', needs: '龙卷风 + 手里剑或影分身' },
  { id: 'thermalshock', name: '霜火淬炼', tags: ['冰', '炎'], detail: '火焰命中寒霜减速中的普通或精英敌人，伤害提高 30%。不消耗减速；首领不触发。', needs: '寒霜环 + 任一炎系技能' },
] as const;
