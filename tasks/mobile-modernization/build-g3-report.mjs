import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const base = resolve(import.meta.dirname, 'evidence/G3');
const runtime = join(process.env.LOCALAPPDATA, 'ms-playwright');
const ffmpeg = process.env.PLAYWRIGHT_FFMPEG || join(runtime, readdirSync(runtime).filter(name => name.startsWith('ffmpeg-')).sort().at(-1), 'ffmpeg-win64.exe');
const inputs = [
  { project: 'desktop', folder: 'recorded-alternates-attempt-02', id: '01-shatter-desktop', title: '霜狱剑主 · 碎冰震波', form: '霜狱剑主', route: 'shatter', bond: '冰雷 / 霜卫', viewport: '1280 × 720', complete: true, description: '近身碎冰与随身寒域共同作战，完整记录觉醒、首领胜利、奖励保存和再次挑战。' },
  { project: 'phone', folder: 'recorded-alternates-attempt-02', id: '02-thunderstrike-phone', title: '九霄雷君 · 孤雷天罚', form: '九霄雷君', route: 'thunderstrike', bond: '冰雷 / 雷兽', viewport: '390 × 844', complete: false, description: '雷君普攻和主动技能保留实际跳链；雷电弹选为范围天罚，展示同一构筑中的两种雷击。' },
  { project: 'narrow', folder: 'recorded-narrow-attempt-03', id: '03-hunter-narrow', title: '冥契兽王 · 游猎影军', form: '冥契兽王', route: 'hunter', bond: '霜卫 / 雷兽', viewport: '320 × 844', complete: false, description: '影分身选择随行游猎，兽王主动技能召出驻守近卫；查看真实羁绊条件并继续触屏战斗。' },
  { project: 'narrow', folder: 'recorded-guard-attempt-03', id: '04-guard-narrow', title: '冥契兽王 · 守阵影军', form: '冥契兽王', route: 'guard', bond: '霜卫 / 雷兽', viewport: '320 × 844', complete: false, description: '影分身选择定点守阵，对照游猎路线，验证窄屏选择、暂停、特效开关及退出重开。' },
];
const rules = JSON.parse(readFileSync(join(base, 'rules.json'), 'utf8'));
const regressions = JSON.parse(readFileSync(join(base, 'regressions.json'), 'utf8'));
const checks = JSON.parse(readFileSync(join(base, 'checks.json'), 'utf8'));
if (!rules.success || rules.numPassedTests !== 946 || rules.numPendingTests ||
    regressions.stats.expected !== 87 || regressions.stats.unexpected || regressions.stats.skipped || regressions.stats.flaky ||
    checks.checks.length !== 9 || checks.checks.some(check => check.exitCode !== 0)) throw new Error('G3 validation prerequisites are not complete');
mkdirSync(join(base, 'videos'), { recursive: true });
mkdirSync(join(base, 'frames'), { recursive: true });
const testsIn = suites => suites.flatMap(suite => [...suite.specs.flatMap(spec => spec.tests), ...testsIn(suite.suites || [])]);
const runs = inputs.map(input => {
  const report = JSON.parse(readFileSync(join(base, input.folder, 'results.json'), 'utf8'));
  const selected = testsIn(report.suites).filter(test => test.projectName === input.project);
  if (selected.length !== 1 || selected[0].status !== 'expected' || selected[0].results.length !== 1 || selected[0].results[0].status !== 'passed') throw new Error(`Unaccepted recording: ${input.folder}/${input.project}`);
  const root = join(base, input.folder, 'test-results');
  const dir = readdirSync(root).find(name => name.endsWith(`-${input.project}`) && statSync(join(root, name)).isDirectory());
  if (!dir) throw new Error(`Missing test folder: ${input.id}`);
  const raw = join(root, dir), choices = JSON.parse(readFileSync(join(raw, 'natural-evolution-choices.json'), 'utf8'));
  if (choices.errors.length || !choices.choices.some(choice => choice.id === input.route)) throw new Error(`Missing route evidence: ${input.id}`);
  const timeline = JSON.parse(readFileSync(join(raw, 'timeline.json'), 'utf8'));
  if (!timeline.at(-1)?.event.includes('验收完成')) throw new Error(`Incomplete timeline: ${input.id}`);
  const routeName = input.title.split(' · ')[1];
  const selectedRoute = timeline.find(item => item.event.startsWith('选择 技能分支') && item.event.includes(routeName));
  const activeBond = timeline.find(item => item.event.startsWith('查看已激活羁绊：'))?.event.match(/查看已激活羁绊：(.*?)\s*已激活/)?.[1];
  if (!selectedRoute || !activeBond) throw new Error(`Missing route or bond timestamp: ${input.id}`);
  if (input.complete && !timeline.some(item => item.event.startsWith('结算：') && item.event.includes('黄巾巨将已击败'))) throw new Error(`Missing victory: ${input.id}`);
  const video = `videos/${input.id}.webm`, target = join(base, video);
  copyFileSync(join(raw, readdirSync(raw).find(name => name.endsWith('.webm'))), target);
  const metadata = spawnSync(ffmpeg, ['-hide_banner', '-i', target], { encoding: 'utf8' }).stderr;
  const match = metadata.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  if (!match) throw new Error(`Unreadable video: ${input.id}`);
  const duration = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  const decode = spawnSync(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-i', target, '-vf', 'scale=2:2', '-c:v', 'png', '-f', 'image2', '-update', '1', '-y', 'NUL'], { encoding: 'utf8' });
  if (decode.status !== 0) throw new Error(`Decode failed: ${input.id}: ${decode.stderr}`);
  const marks = [
    ['特效开关与羁绊缺项', timeline.find(item => item.event.startsWith('验证羁绊'))?.seconds],
    ['选择英雄形态', timeline.find(item => item.event.startsWith('选择 英雄进化'))?.seconds],
    ['选择技能路线', selectedRoute.seconds],
    ['查看激活条件', timeline.find(item => item.event.startsWith('查看已激活'))?.seconds],
    ['胜利结算', timeline.find(item => item.event.startsWith('结算：'))?.seconds],
    ['重新开局', timeline.find(item => item.event.startsWith('重新进入'))?.seconds],
  ].filter(([, seconds]) => seconds !== undefined).map(([label, seconds]) => ({ label, seconds: Math.max(0, seconds - 1) }));
  const combatTime = Math.min(duration - 5, (timeline.find(item => item.event.startsWith('继续实战展示'))?.seconds || 160) + 4);
  const poster = `frames/${input.id}-combat.png`;
  const frame = spawnSync(ffmpeg, ['-hide_banner', '-v', 'error', '-ss', String(combatTime), '-i', target, '-frames:v', '1', '-y', join(base, poster)], { encoding: 'utf8' });
  if (frame.status !== 0) throw new Error(frame.stderr);
  for (const name of readdirSync(raw).filter(name => name.endsWith('.png'))) copyFileSync(join(raw, name), join(base, 'frames', `${input.id}-${name}`));
  return { ...input, bond: activeBond, video, poster, duration, bytes: statSync(target).size, sha256: createHash('sha256').update(readFileSync(target)).digest('hex'), passed: true, fullDecodePassed: true, errors: choices.errors, timeline, marks };
});
writeFileSync(join(base, 'recordings.json'), JSON.stringify(runs, null, 2) + '\n');
const attempts = readdirSync(base).filter(name => name.startsWith('recorded-')).map(folder => {
  const report = JSON.parse(readFileSync(join(base, folder, 'results.json'), 'utf8'));
  return { folder, stats: report.stats, tests: testsIn(report.suites).map(test => ({ project: test.projectName, status: test.status })) };
});
writeFileSync(join(base, 'attempts.json'), JSON.stringify({ attempts, note: 'Alternates attempt 01 predates the route-layout correction. Alternates attempt 02 narrow reached hunter but did not acquire the requested frost/lightning bond within the unchanged recording budget. Guard attempt 01 completed the route/bond guide but timed out because a level choice intercepted the final Pause click. The helper now resolves pending dialogs before exiting; no game rules, RNG or time injection changed. Guard attempt 02 acquired frost only at the end of the unchanged budget and failed the required guide assertion. All three failed recordings and assertions are retained locally. The viewer selects individually passing recordings and does not claim all attempts passed.' }, null, 2) + '\n');

// Reuse the verified standalone player; historical G2 evidence stays intact.
let html = readFileSync(resolve(base, '../G2/index.html'), 'utf8');
html = html.replaceAll('G2', 'G3').replace('三种进化，三段实战。', '看清招式，选出自己的打法。')
  .replace('冰霜控场、连锁雷击、召唤守阵。本批新增 3 个进化形态、寒霜环、4 条技能分支和 3 个羁绊。', '本批完善实际雷击连线、寒域与碎冰区别、召唤角色标记，以及技能路线取舍和羁绊缺项提示。')
  .replace('3 / 3', '4 / 4').replaceAll('937 / 937', '946 / 946')
  .replace('新玩法自然操作录屏通过', '最终交付的四条路线录屏通过')
  .replace('grid-template-columns:repeat(3,1fr)', 'grid-template-columns:repeat(4,1fr)')
  .replace('组合带来实际战斗变化', '看清范围、命中和组合条件')
  .replace('<th>本批新增</th><th>玩法变化</th><th>验证覆盖</th>', '<th>本批完善</th><th>可见变化</th><th>验证覆盖</th>')
  .replace(/<tbody>[\s\S]*?<\/tbody>/, `<tbody>
    <tr><td>实际雷击路径</td><td>连线连接真实命中目标；范围天罚使用放射冲击。</td><td>目标顺序、坐标复制、关闭表现不影响伤害与掉落。</td></tr>
    <tr><td>寒域与碎冰</td><td>寒域保留边界和剩余时间弧线；碎冰显示瞬间放射冰纹。</td><td>表现上限 40，暂停冻结；危险提示和晶体保持可见。</td></tr>
    <tr><td>召唤角色</td><td>方盾表示驻守近卫，双刃表示随行猎手。</td><td>游猎 / 守阵两条窄屏自然操作录像。</td></tr>
    <tr><td>构筑提示</td><td>十条分支展示打法与取舍，羁绊明确列出已拥有和还缺的术式。</td><td>正等级持有条件、互斥分支、升级沿用当前路线说明。</td></tr>
  </tbody>`)
  .replace('两段手机尺寸录像覆盖路线、羁绊、暂停与重新开局。', '三段手机尺寸录像覆盖天罚、游猎、守阵，以及羁绊、特效开关、暂停与重新开局。')
  .replace('三段录像已完整解码检查', '四段录像已完整解码检查')
  .replace('<p id="gates">', '<p>尝试记录：首轮 3 段录像通过后修正路线文字布局；最终版窄屏游猎曾因未取得目标冰／雷技能失败。守阵首次录制因升级框阻挡脚本的退出操作而超时，已修正脚本先处理弹框再暂停；第二次守阵在录制末尾才取得寒霜环，未完成羁绊展示。原始失败录像与断言均保留，游戏规则未改变。这里展示逐段通过的最终录像，不表示所有尝试首次通过。<a href="attempts.json">查看完整尝试记录</a>。</p><p id="gates">')
  .replace('本地验收交付 · 新版位于 apps/mobile-next · 未发布或切换旧版入口', 'G3 开发里程碑 · 新版位于 apps/mobile-next · GitHub 提供源码与下载包，旧版入口保持原样')
  .replace(/<script type="application\/json" id="recording-data">[\s\S]*?<\/script>/, `<script type="application/json" id="recording-data">${JSON.stringify(runs).replaceAll('<', '\\u003c')}</script>`);
writeFileSync(join(base, 'index.html'), html);
console.log(JSON.stringify(runs.map(({ id, duration, bytes, fullDecodePassed }) => ({ id, duration, bytes, fullDecodePassed })), null, 2));
