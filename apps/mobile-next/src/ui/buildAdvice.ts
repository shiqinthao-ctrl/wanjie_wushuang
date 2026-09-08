import { activeSkills, bonds, hasSkillTag, skillRoutes } from '../core/evolutionCatalog';
import type { RouteId } from '../core/evolutionCatalog';
import type { EvolutionSnapshot } from '../core/RunEvolution';
import { skillName } from '../core/progression';
import type { LevelOption, SkillLevels } from '../core/progression';

const routeStyles: Record<RouteId, { style: string; tradeoff: string }> = {
  volley: { style: '扇射清场 · 拉开距离覆盖前方', tradeoff: '单发伤害降低，需要多发命中发挥优势。' },
  nova: { style: '爆炸破群 · 将敌人引到一起', tradeoff: '弹速较慢，远处快速移动的敌人更难命中。' },
  roaming: { style: '前方牵引 · 跟着风暴推进', tradeoff: '风暴离开身边，仍需处理近身威胁。' },
  orbit: { style: '环身防线 · 绕行近处敌群', tradeoff: '围绕自身运转，难以覆盖远处敌群。' },
  hunter: { style: '随行游击 · 边移动边集火', tradeoff: '以影刃攻击目标，需要弹道命中。' },
  guard: { style: '定点守阵 · 围绕召唤点拉怪', tradeoff: '近卫留在原位，移动过远会脱离火力。' },
  glacier: { style: '驻留控场 · 将敌人引入寒域', tradeoff: '伤害分段生效，敌人离开寒域后不再受到领域伤害。' },
  shatter: { style: '近身爆发 · 趁敌群靠近扫出缺口', tradeoff: '瞬间释放，间隔期间没有驻留寒域。' },
  relay: { style: '跳链清场 · 利用相邻敌人传导', tradeoff: '单次命中伤害降低，目标间距过大会中断跳链。' },
  thunderstrike: { style: '集中轰击 · 将敌人聚在首目标附近', tradeoff: '取消跳链，分散的敌人无法被同一次雷击覆盖。' },
};

export function routeAdvice(id: string | undefined) {
  const route = skillRoutes.find(route => route.id === id);
  return route && { ...route, ...routeStyles[route.id], alternative: skillRoutes.find(other => other.skill === route.skill && other.id !== id)!.name };
}

export function bondRequirements(tags: readonly string[], skills: SkillLevels) {
  return tags.map(tag => {
    const candidates = activeSkills.filter(id => hasSkillTag(id, tag));
    const owned = candidates.filter(id => (skills[id] || 0) > 0);
    return { tag, met: owned.length > 0, skills: (owned.length ? owned : candidates).map(skillName) };
  });
}

export function choiceAdvice(option: LevelOption, journey: EvolutionSnapshot | undefined, skills: SkillLevels) {
  const route = journey ? routeAdvice(option.kind === 'route' ? option.id : journey.routes[option.id]) : undefined;
  const advanced = journey && option.kind === 'active' && !(skills[option.id] || 0) ? bonds.filter(bond =>
    bond.tags.some(tag => hasSkillTag(option.id, tag) && !bondRequirements([tag], skills)[0]!.met),
  ).map(bond => ({ name: bond.name, completes: bondRequirements(bond.tags, { ...skills, [option.id]: 1 }).every(condition => condition.met) })) : [];
  return { route, detail: route?.detail || option.detail, bonds: advanced };
}
