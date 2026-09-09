import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('./assets/', import.meta.url));
const groups = [
  ['PORTRAIT-START', '初始英雄立绘', 3, '张'], ['PORTRAIT-FORM', '进化立绘', 11, '张'],
  ['AWAKEN', '觉醒增补', 11, '套'], ['COMBAT', '战斗角色外观', 14, '套'],
  ['ANIMATION', '角色八类动作三朝向', 14, '套(8类;三朝向)'],
  ['ENEMY', '普通敌人含动作', 6, '套'], ['ELITE', '精英含独立外观动作', 2, '套'],
  ['BOSS', '首领三阶段及招式转阶段死亡', 2, '套'],
  ['THEME', '章节场景主题', 1, '套'], ['MAP', '关卡布局', 3, '张'],
  ['PROP', '场景装饰', 24, '件'], ['INTERACT', '交互物与状态', 8, '类'],
  ['ICON-HERO', '英雄形态图标', 14, '枚'], ['ICON-SKILL', '术式心法路线图标', 33, '枚'],
  ['ICON-BOND', '羁绊图标', 8, '枚'], ['ICON-CHARM', '战备图标', 6, '枚'], ['ICON-UI', '通用图标', 24, '枚'],
  ['VFX-SKILL', '术式主体', 10, '项'], ['VFX-ROUTE', '路线变化', 12, '项'],
  ['VFX-FORM', '形态主动或必杀', 22, '包'], ['VFX-BOND', '羁绊特效', 8, '项'], ['VFX-COMMON', '通用反馈', 8, '类'],
  ['MUSIC', '循环音乐', 5, '首'], ['AMBIENCE', '环境音', 3, '组'], ['SFX', '音效', 40, '项'],
];
const inventory = groups.map(([id, name, quantity, unit]) => ({ id, name, quantity, unit, status: 'not-commissioned', sampleApproved: false, files: [], license: null }));
const icons = inventory.filter(item => item.id.startsWith('ICON-')).reduce((sum, item) => sum + item.quantity, 0);
if (icons !== 85 || inventory.find(item => item.id === 'COMBAT').quantity * 8 !== 112) throw new Error('Asset quantities do not reconcile');
const columns = ['资产编号', '项目', '数量', '单位', '供应商', '制作类型', '单价', '币种', '含税口径', '修改轮次', '工作日', '源文件要求及费用', '授权范围', '第三方许可', '引擎接入费', '样板抵扣', '备注'];
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
const lines = [columns, ...inventory.map(item => [item.id, item.name, item.quantity, item.unit, ...Array(columns.length - 4).fill('')])];
await mkdir(target, { recursive: true });
await writeFile(`${target}/inventory.json`, JSON.stringify({ version: 1, status: 'quotation-spec-only', iconCount: icons, animationClasses: 112, directionalClipsUpTo: 336, groups: inventory }, null, 2) + '\n');
await writeFile(`${target}/quote-items.csv`, '\uFEFF' + lines.map(row => row.map(quote).join(',')).join('\r\n') + '\r\n');
console.log(`Validated ${inventory.length} quote groups, ${icons} icons, 112 animation classes / up to 336 directional clips.`);
