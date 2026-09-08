import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, 'evidence/P2k');
const read = path => JSON.parse(readFileSync(join(root, path), 'utf8'));
const write = (path, data) => writeFileSync(join(root, path), JSON.stringify(data, null, 2) + '\n');
const ffmpeg = process.env.PLAYWRIGHT_FFMPEG || join(process.env.LOCALAPPDATA, 'ms-playwright/ffmpeg-1011/ffmpeg-win64.exe');
const flatten = suites => suites.flatMap(suite => [...suite.specs.flatMap(spec => spec.tests.map(test => ({ title: spec.title, ...test }))), ...flatten(suite.suites || [])]);
const folders = ['boss-contact-01', 'regression-natural-01', 'regression-imported-02', 'regression-native-01'];
const attempts = folders.map(folder => { const report = read(`${folder}/results.json`); return { folder, stats: report.stats, tests: flatten(report.suites) }; });
if (attempts.some(attempt => attempt.tests.some(test => test.results.length !== 1 || !['passed', 'failed'].includes(test.results[0].status)))) throw new Error('Incomplete or retried attempt: inspect original results');
const rules = read('rules.json');
if (!rules.success || rules.numFailedTests || rules.numPendingTests) throw new Error('Rules failed');
mkdirSync(join(root, 'videos'), { recursive: true });
mkdirSync(join(root, 'frames'), { recursive: true });
const runs = [], setupFailures = [];
for (const attempt of attempts.filter(attempt => attempt.folder !== 'regression-native-01')) {
  const rawRoot = join(root, attempt.folder, 'test-results');
  for (const folder of readdirSync(rawRoot).filter(name => statSync(join(rawRoot, name)).isDirectory()).sort()) {
    const raw = join(rawRoot, folder);
    const project = ['desktop', 'phone', 'narrow'].find(name => folder.endsWith(`-${name}`));
    if (!existsSync(join(raw, 'natural-settlement-input.json'))) {
      const failed = attempt.tests.find(test => test.projectName === project && test.title.startsWith('supplemental'));
      if (attempt.folder !== 'regression-natural-01' || !folder.startsWith('settlement-supplemental') || failed?.results[0].status !== 'failed') throw new Error(`Missing input evidence: ${folder}`);
      setupFailures.push({ project, source: `${attempt.folder}/test-results/${folder}`, failure: failed.results[0].error?.message.replace(/\u001b\[[0-9;]*m/g, ''), resolution: 'Wait for import input to become enabled; rerun in regression-imported-02.' });
      continue;
    }
    const input = JSON.parse(readFileSync(join(raw, 'natural-settlement-input.json'), 'utf8'));
    const test = attempt.tests.find(test => test.projectName === project &&
      (input.profile === 'imported-low-growth' ? test.title.startsWith('supplemental') : input.outcome === 'defeat' ? test.title.includes('corner-contact') : test.title.includes(input.outcome)));
    if (!test || !input.observed?.persistenceVerified || !input.observed?.replayVerified || input.errors.length) throw new Error(`Incomplete observed settlement: ${folder}`);
    const id = `${input.profile === 'imported-low-growth' ? 'imported' : 'fresh'}-${input.outcome}-${project}`;
    const files = readdirSync(raw).filter(name => name.endsWith('.webm'));
    if (files.length !== 1) throw new Error(`Expected one original recording: ${folder}`);
    const video = `videos/${id}.webm`, target = join(root, video);
    copyFileSync(join(raw, files[0]), target);
    const metadata = spawnSync(ffmpeg, ['-hide_banner', '-i', target], { encoding: 'utf8' }).stderr;
    const match = metadata.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
    if (!match) throw new Error(`Unreadable video: ${id}`);
    const duration = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    const decoded = spawnSync(ffmpeg, ['-hide_banner', '-v', 'error', '-xerror', '-i', target, '-vf', 'scale=2:2', '-c:v', 'png', '-f', 'image2', '-update', '1', '-y', 'NUL'], { encoding: 'utf8' });
    if (decoded.status !== 0) throw new Error(`Decode failed: ${id}: ${decoded.stderr}`);
    const poster = `frames/${id}-combat.png`;
    const extracted = spawnSync(ffmpeg, ['-hide_banner', '-v', 'error', '-ss', String(Math.min(60, duration / 2)), '-i', target, '-frames:v', '1', '-y', join(root, poster)], { encoding: 'utf8' });
    if (extracted.status !== 0) throw new Error(extracted.stderr);
    for (const name of readdirSync(raw).filter(name => name.endsWith('.png'))) copyFileSync(join(raw, name), join(root, 'frames', `${id}-${name}`));
    const passed = test.results[0].status === 'passed';
    const title = `${input.profile === 'imported-low-growth' ? '导入低成长' : '原始初始配置'} · ${{ victory: '主动通关', defeat: '生命耗尽测试', timeout: '原地等待' }[input.outcome]}`;
    const marks = [{ label: '开始战斗', seconds: Math.max(0, input.timeline[0].seconds - 1) },
      { label: '实际结算', seconds: Math.max(0, input.observed.seconds - 1) },
      { label: '重试与存档核对', seconds: Math.min(duration - 1, input.observed.seconds + 1) }];
    const boss = input.timeline.find(item => item.boss !== null);
    if (boss) marks.splice(1, 0, { label: '首领阶段', seconds: Math.max(0, boss.seconds - 1) });
    runs.push({ id, title, project, viewport: { desktop: '1280 × 720', phone: '390 × 844', narrow: '320 × 844' }[project],
      video, poster, duration, bytes: statSync(target).size, sha256: createHash('sha256').update(readFileSync(target)).digest('hex'),
      passed, fullDecodePassed: true, profile: input.profile, requestedOutcome: input.outcome, actualOutcome: input.observed.title,
      observed: input.observed, errors: input.errors, strategy: input.strategy, source: `${attempt.folder}/test-results/${folder}`,
      failure: passed ? null : test.results[0].error?.message.replace(/\u001b\[[0-9;]*m/g, ''), marks,
      timeline: input.timeline.map(item => ({ seconds: item.seconds, event: `${item.time} · ${item.hp}` })) });
    console.log(`${id}: ${passed ? 'passed' : 'FAILED target'}; ${input.observed.title}; decoded ${duration}s`);
  }
}
if (runs.length !== 12 || new Set(runs.map(run => run.id)).size !== 12) throw new Error('Expected 12 distinct complete recordings');
if (setupFailures.some(failure => !runs.some(run => run.profile === 'imported-low-growth' && run.project === failure.project && run.passed))) throw new Error('Import setup failures have not passed rerun');
const synthetic = readdirSync(join(root, 'synthetic-pressure-01')).filter(name => name.endsWith('.json')).map(name => read(`synthetic-pressure-01/${name}`));
const summary = { gateClosed: runs.filter(run => run.requestedOutcome === 'defeat' && run.profile === 'fresh-baseline').length === 3 && runs.filter(run => run.requestedOutcome === 'defeat' && run.profile === 'fresh-baseline').every(run => run.passed),
  rules: { passed: rules.numPassedTests, total: rules.numTotalTests }, browser: { passed: attempts.reduce((n, a) => n + a.stats.expected, 0), failed: attempts.reduce((n, a) => n + a.stats.unexpected, 0) },
  natural: { passed: runs.filter(run => run.passed).length, failed: runs.filter(run => !run.passed).length },
  resolvedSetupFailures: setupFailures,
  synthetic: { total: synthetic.length, outcomes: synthetic.reduce((out, run) => ({ ...out, [run.end]: (out[run.end] || 0) + 1 }), {}), minimum: synthetic.reduce((a, b) => a.minHp < b.minHp ? a : b) } };
write('recordings.json', runs); write('attempts.json', attempts.map(({ tests, ...attempt }) => ({ ...attempt, tests: tests.map(test => ({ title: test.title, project: test.projectName, status: test.status })) }))); write('summary.json', summary);

// Reuse the existing report's visual language without changing historical evidence.
const previous = readFileSync(resolve(root, '../G3/index.html'), 'utf8');
const style = previous.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const data = JSON.stringify(runs).replaceAll('<', '\\u003c');
writeFileSync(join(root, 'index.html'), `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>万界无双 · P2k 结算验收实录</title><link rel="icon" href="data:,"><style>${style}
video{height:auto}.scroll-hint{display:none}@media(max-width:800px){.scroll-hint{display:block}}.selector{grid-template-columns:repeat(3,minmax(0,1fr))}.fail{color:#ffc4a3;border-color:#ac7053}.outcome{font-size:19px;color:var(--gold);margin:12px 0}.choice strong{font-size:15px}@media(max-width:800px){.selector{grid-template-columns:1fr}.selector{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}.choice{flex:0 0 min(84vw,310px);padding:12px 14px;scroll-snap-align:start}}
</style></head><body><main>
<header><div class="eyebrow">万界无双 / P2k / 2026.09.08</div><h1>结算实录，保留每次结果。</h1><p class="intro">本批追查原始初始配置的自然生命耗尽路径。修正测试过早结束的问题，并补齐实际战果、存档和重新挑战的证据。录像来自真实浏览器的正常速度操作，可跳转结算、倍速播放和下载原件。</p></header>
<div class="notice">${summary.gateClosed ? '初始配置生命耗尽目标已通过三种尺寸验证。' : '验收缺口仍在：原始初始配置的生命耗尽目标尚未通过。实际发生的胜利或超时不能代替生命耗尽。'}本批没有修改游戏规则或角色配置。</div>
<div class="stats" aria-label="本批验证结果"><div class="stat"><strong>${summary.browser.passed} / ${summary.browser.passed + summary.browser.failed}</strong><span>浏览器尝试通过 / 总次数（${summary.browser.failed} 项失败）</span></div><div class="stat"><strong>${summary.rules.passed} / ${summary.rules.total}</strong><span>规则与存档测试通过</span></div><div class="stat"><strong>${runs.length} 段原片</strong><span>完整自然操作与存档核对</span></div><div class="stat"><strong>54 组诊断</strong><span>合成策略研究，单独统计</span></div></div>
<nav class="selector" aria-label="选择录屏"></nav><div class="player-grid"><section aria-label="实战录像播放器"><div class="screen"><video controls playsinline preload="metadata" aria-label="自动化测试原速录像"></video><div class="video-bar"><span id="video-info"></span><label>播放速度 <select id="speed"><option value="1">原速 1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div></div><p class="outcome" id="actual-outcome"></p><p class="description" id="description"></p><p class="error" id="player-error" role="status"></p><a id="download" download>下载原始录像（WebM）</a></section><aside aria-label="录像关键步骤"><span class="pass" id="status"></span><h2 id="run-title"></h2><div class="timestamps"></div><p class="meta">时间点按操作日志估算，约有 1 秒偏差。游戏时间与录像时间不同，弹框和存档操作也包含在录像中。当前没有音轨。</p></aside></div>
<details><summary>展开本段生命与时间记录</summary><div class="full-timeline"></div></details>
<section class="evidence"><div class="eyebrow">测试结果与边界</div><h2>区分初始配置与补充分支</h2><p class="meta scroll-hint">左右滑动表格，可查看完整内容与结论。</p><div class="checks"><table><thead><tr><th>范围</th><th>实测内容</th><th>结论</th></tr></thead><tbody>
<tr><td>原始初始配置</td><td>6 级 H001、原装备与术式，贴近首领且不主动释放技能。</td><td>保留原生命耗尽断言；按每段实际结算展示，失败不改成通过。</td></tr>
<tr><td>通关与超时回归</td><td>主动通关 / 原地等待，三个浏览器尺寸。</td><td>核对奖励、星级、刷新后的存档以及再次挑战。</td></tr>
<tr><td>导入低成长存档</td><td>经可见存档界面导入测试配置，正常操作直至生命耗尽。</td><td>仅补充验证失败结算；不能代替原始初始配置验收。</td></tr>
<tr><td>已修复的测试时序</td><td>首次导入在存档列表加载时提交，三次均在开战前失败；补上等待可用后重跑。</td><td>三个尺寸重跑通过。原失败录像与断言保留在原始尝试目录，计入总执行次数。</td></tr>
<tr><td>54 组合成诊断</td><td>6 种策略 × 3 个种子 × 3 种尺寸；直接调用核心并记录伤害与回血。</td><td>21 次胜利、33 次超时、0 次生命耗尽。不代表浏览器自然验收，也不证明死亡不可能。</td></tr>
</tbody></table></div><p>自然录像只使用页面按钮、键盘、触控和画面像素定位。存储故障、并发及重复结算使用单独的合成夹具验证。本次旧版五项检查、49 个基线文件校验、类型检查与构建通过。</p><div class="notice">390 × 844 和 320 × 844 为 Chrome 触屏模拟，不代表实体 iPhone 或 Android 验收。完整套件仍有未关闭目标；真机操作、性能、长时间稳定性、完整内容迁移与 PWA 待完成。</div><p><a href="summary.json">结果汇总</a> · <a href="recordings.json">录屏清单与校验值</a> · <a href="attempts.json">全部尝试</a> · <a href="final-gates.json">最终工程检查</a></p></section><footer class="footer">P2k 开发检查点 · 保留 G3 玩法与旧版入口 · GitHub 提供源码及完整证据包</footer>
</main><script type="application/json" id="recording-data">${data}</script><script>
const runs=JSON.parse(document.getElementById('recording-data').textContent),video=document.querySelector('video'),nav=document.querySelector('.selector'),speed=document.getElementById('speed');
const clock=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
function jump(seconds){video.currentTime=seconds;video.play().catch(()=>{document.getElementById('player-error').textContent='请点击播放按钮继续观看。';});}
function select(index){const run=runs[index];video.pause();document.getElementById('player-error').textContent='';video.src=run.video;video.poster=run.poster;video.load();video.playbackRate=Number(speed.value);document.querySelectorAll('.choice').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));document.getElementById('run-title').textContent=run.title;document.getElementById('actual-outcome').textContent='实际结算：'+run.actualOutcome+' · '+run.observed.stars;document.getElementById('description').textContent='已核对战果入库、重新挑战和刷新存档。'+(run.profile==='imported-low-growth'?'这是导入低成长测试配置的补充证据。':'开局导出存档已与原始初始配置逐字段比对。');const status=document.getElementById('status');status.textContent=run.passed?'本段目标通过 · 浏览器错误 0':'本段目标失败 · 实际结果已保存';status.className=run.passed?'pass':'pass fail';document.getElementById('video-info').textContent=clock(run.duration)+' · '+run.viewport+' · 原始录像';document.getElementById('download').href=run.video;const marks=document.querySelector('.timestamps');marks.replaceChildren();for(const mark of run.marks){const b=document.createElement('button');b.className='timestamp';b.textContent=clock(mark.seconds)+'  '+mark.label;b.onclick=()=>jump(mark.seconds);marks.append(b);}const timeline=document.querySelector('.full-timeline');timeline.replaceChildren();for(const item of run.timeline){const b=document.createElement('button');b.textContent=clock(item.seconds)+'  '+item.event;b.onclick=()=>jump(Math.max(0,item.seconds-1));timeline.append(b);}}
runs.forEach((run,index)=>{const b=document.createElement('button'),title=document.createElement('strong'),meta=document.createElement('small');b.className='choice';b.setAttribute('aria-pressed','false');title.textContent=run.title;meta.textContent=run.viewport+' · '+run.actualOutcome+' · '+(run.passed?'目标通过':'目标失败');b.append(title,meta);b.onclick=()=>select(index);nav.append(b);});speed.onchange=()=>{video.playbackRate=Number(speed.value);};video.addEventListener('error',()=>{document.getElementById('player-error').textContent='录像无法加载。请将 videos 与本页保留在同一文件夹。';});select(0);
</script></body></html>`);
console.log(JSON.stringify({ runs: runs.length, browser: summary.browser, gateClosed: summary.gateClosed }));
