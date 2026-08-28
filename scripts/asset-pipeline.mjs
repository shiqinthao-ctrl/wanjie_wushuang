import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const manifestPath='assets/js/config/asset-manifest.js';
const runtimePath='assets/js/presentation/first-playable-assets.js';
const expectedScripts=[
 'assets/js/config/game-data.js',
 manifestPath,
 runtimePath,
 'assets/js/ui/heroes.js','assets/js/ui/loadout.js','assets/js/ui/build.js','assets/js/ui/world.js',
 'assets/js/combat/engine.js','assets/js/ui/tutorial-settings.js','assets/js/ui/result.js','assets/js/systems/director-balance.js',
 'assets/js/systems/save-slots-start.js','assets/js/presentation/quality-presentation.js','assets/js/presentation/art-ui-cinematics.js',
 'assets/js/combat/hero-identity.js','assets/js/combat/skill-forms.js','assets/js/combat/boss-map-interactions.js',
 'assets/js/systems/gear-affix-loot.js','assets/js/systems/runes-pets.js','assets/js/systems/meta-growth.js',
 'assets/js/systems/game-modes.js','assets/js/systems/daily-mutators.js','assets/js/core/stability-v30.js',
 'assets/js/ui/ui-shell.js','assets/js/ui/nexus-hub.js','assets/js/core/v31-project.js'
];

function check(condition,message,failures){if(!condition)failures.push(message)}

async function runtimeScenario(outcomes){
 class FakeImage{
  set src(value){this.currentSrc=value;queueMicrotask(()=>{if(outcomes[value]===false)this.onerror?.(new Error('asset failed'));else this.onload?.()})}
 }
 const sandbox={window:{WW:{config:{}}},Image:FakeImage,console,Promise,queueMicrotask};
 sandbox.WW=sandbox.window.WW;
 vm.createContext(sandbox);
 vm.runInContext(read(manifestPath),sandbox,{filename:manifestPath});
 vm.runInContext(read(runtimePath),sandbox,{filename:runtimePath});
 await sandbox.window.WW.assets.ready;
 return sandbox.window.WW.assets;
}

export async function runAssetPipelineGuard(){
 const failures=[];
 check(fs.existsSync(path.join(root,manifestPath)),'missing local asset manifest',failures);
 check(fs.existsSync(path.join(root,runtimePath)),'missing preload and fallback runtime',failures);
 if(failures.length)return{ok:false,failures,checks:{}};

  const html=read('index.html');
  const manifestSource=read(manifestPath);
  const runtimeSource=read(runtimePath);
  const engineSource=read('assets/js/combat/engine.js');
  const heroUiSource=read('assets/js/ui/heroes.js');
  const saveSlotsSource=read('assets/js/systems/save-slots-start.js');
  const resultSource=read('assets/js/ui/result.js');
  const heroIdentitySource=read('assets/js/combat/hero-identity.js');
  const qualitySource=read('assets/js/presentation/quality-presentation.js');
  const artSource=read('assets/js/presentation/art-ui-cinematics.js');
  const gameModesSource=read('assets/js/systems/game-modes.js');
  const bossInteractionsSource=read('assets/js/combat/boss-map-interactions.js');
  const cssSource=read('assets/css/app.css');
  const recoveryHelperSource=gameModesSource.match(/function v337FirstCampaignRecovery\([\s\S]*?\n}/)?.[0]||'';
  const telegraphHelperSource=bossInteractionsSource.match(/function v337FirstCampaignTelegraph\([\s\S]*?\n}/)?.[0]||'';
  const firstBossTargetHelperSource=heroIdentitySource.match(/function v338FirstBossTarget\([\s\S]*?\n}/)?.[0]||'';
  const firstBossGuideHelperSource=bossInteractionsSource.match(/function v338FirstBossGuideTarget\([\s\S]*?\n}/)?.[0]||'';
  const firstBossCastHelperSource=bossInteractionsSource.match(/function v338ClearFirstBossCast\([\s\S]*?\n}/)?.[0]||'';
  const minimapHelperSource=engineSource.match(/function v34MinimapSnapshot\([\s\S]*?\n}/)?.[0]||'';
  const objectiveHelperSource=engineSource.match(/function v34ObjectiveProjection\([\s\S]*?\n}/)?.[0]||'';
  const timedRewardHelperSource=engineSource.match(/function v34TimedRewardProjection\([\s\S]*?\n}/)?.[0]||'';
  const heroPreviewHelperSource=heroUiSource.match(/function v34HeroSelectionPreview\([\s\S]*?\n}/)?.[0]||'';
 const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(match=>match[1]);
 const manifestSandbox={window:{WW:{config:{}}}};
 manifestSandbox.WW=manifestSandbox.window.WW;
 vm.createContext(manifestSandbox);
 try{vm.runInContext(manifestSource,manifestSandbox,{filename:manifestPath})}catch(error){failures.push('manifest throws: '+error.message)}
 const manifest=manifestSandbox.window.WW.config.firstPlayableAssets;
 const entries=Array.isArray(manifest?.entries)?manifest.entries:[];
 const baseRoles=['battlefield','hero','enemy','boss'];
 const animationRoles=['hero-attack','enemy-hit','boss-entrance','boss-telegraph','boss-hit','boss-defeat'];
 const expectedRoles=[...baseRoles,...animationRoles];
 const paths=entries.map(entry=>entry.path);
 const localPaths=paths.length===expectedRoles.length&&paths.every(assetPath=>typeof assetPath==='string'&&!/^(?:https?:)?\/\//.test(assetPath)&&fs.existsSync(path.join(root,assetPath)));
 const scopedEntries=entries.length===expectedRoles.length&&entries.every(entry=>entry.stageId==='ST001-01'&&entry.id&&entry.path&&Number(entry.render?.width)>0&&Number(entry.render?.height)>0&&Number.isFinite(entry.render?.anchorX)&&Number.isFinite(entry.render?.anchorY));
 const exactEntities=entries.filter(entry=>entry.role.startsWith('hero')).every(entry=>entry.entityId==='H001')&&entries.filter(entry=>entry.role.startsWith('enemy')).every(entry=>entry.entityId==='EN001')&&entries.filter(entry=>entry.role.startsWith('boss')).every(entry=>entry.entityId==='B001');
 const checks={
  fourRoles:baseRoles.every(role=>entries.some(entry=>entry.role===role)),
  animationRoles:animationRoles.every(role=>entries.some(entry=>entry.role===role)),
  uniqueRoles:new Set(entries.map(entry=>entry.role)).size===expectedRoles.length,
  manifestV2:manifest?.version===2,
  localPaths,
  scopedEntries,
  exactEntities,
  orderedScripts:JSON.stringify(scripts)===JSON.stringify(expectedScripts),
  semanticStates:['loading','ready','partial','fallback'].every(state=>runtimeSource.includes(`'${state}'`)),
  scopedConsumers:qualitySource.includes("drawRole('battlefield'")&&qualitySource.includes("drawRole('enemy'")&&qualitySource.includes("drawRole('boss'")&&artSource.includes("drawRole('hero'"),
  animationConsumers:qualitySource.includes("drawRole('enemy-hit'")&&qualitySource.includes("drawRole('boss-entrance'")&&qualitySource.includes("drawRole('boss-telegraph'")&&qualitySource.includes("drawRole('boss-hit'")&&qualitySource.includes("drawRole('boss-defeat'")&&artSource.includes("drawRole('hero-attack'"),
   stateProjection:qualitySource.includes('function v336ObserveCombatPresentation(')&&qualitySource.includes('function v336BossPresentationState(')&&qualitySource.includes('e.flash>0')&&artSource.includes('v336DrawHeroAttack'),
   existingFallbacks:qualitySource.includes("WW.assets?.drawRole('enemy'")&&qualitySource.includes("WW.assets?.drawRole('boss'")&&artSource.includes("WW.assets?.drawRole('hero'"),
   layeredFallbacks:qualitySource.includes('function v336DrawEnemyImpact(')&&qualitySource.includes('function v336DrawBossOverlay(')&&artSource.includes('function v336DrawHeroAttack('),
   flowMarkup:html.includes('data-first-playable-flow="level"')&&html.includes('data-first-playable-flow="chest"')&&html.includes('data-first-playable-flow="outcome"')&&html.includes('aria-live="polite" id="lootToast"'),
   scopedFlow:artSource.includes('function v336FirstPlayableFlowScope(')&&artSource.includes("save.mode==='story'")&&artSource.includes("save.hero==='H001'")&&artSource.includes("stage[0]==='ST001-01'"),
   xpPickupProjection:qualitySource.includes('const xpBefore=run.xp')&&qualitySource.includes('v336PresentXpPickup')&&artSource.includes('function v336PresentXpPickup('),
   levelProjection:engineSource.includes('v336PresentLevelChoices(opts)')&&engineSource.includes('v336PresentLevelChoice(o)')&&artSource.includes('function v336PresentLevelChoices(')&&artSource.includes('function v336PresentLevelChoice('),
   chestProjection:qualitySource.includes('v336PresentChestChoices')&&artSource.includes('function v336PresentChestChoices(')&&artSource.includes('function v336PresentChestChoice(')&&artSource.includes('v336PresentChestChoice(r)'),
   outcomeProjection:qualitySource.includes('v336PresentRunTransition(victory,reason)')&&artSource.includes('function v336PresentRunTransition(')&&artSource.includes('lastResult?.victory===victory'),
   presentationFallthrough:artSource.includes('if(!v336FirstPlayableFlowScope())return false')&&artSource.includes('if(!overlay)return false'),
   flowStyles:cssSource.includes('V3.3.6 FIRST PLAYABLE FLOW')&&cssSource.includes('[data-first-playable-flow="level"].flow-slice-active,[data-first-playable-flow="chest"].flow-slice-active{z-index:14')&&cssSource.includes('[data-first-playable-flow="outcome"]')&&cssSource.includes('@media (prefers-reduced-motion:reduce)'),
   authorityUntouched:!artSource.includes('save.chapters')&&!artSource.includes('finalizeDrops(')&&!artSource.includes('localStorage.setItem'),
   firstVictoryRule:/firstCampaign=\{[^}]*duration:360,bossAt:270[^}]*incoming:\.44[^}]*recoveryAt:\[75,165,255,300,330\][^}]*recoveryRatio:\.22[^}]*telegraphScale:1\.65[^}]*bossHp:3\.00/.test(gameModesSource),
   recoveryScoped:recoveryHelperSource.includes('if(!r?.firstCampaign||!Array.isArray(r.recoveryAt))return false')&&recoveryHelperSource.includes('run.v29.recoveries'),
   recoveryExistingClock:recoveryHelperSource.includes('run.time>=r.recoveryAt[i]')&&recoveryHelperSource.includes('Math.min(player.maxHp')&&recoveryHelperSource.includes("hint('首战恢复")&&recoveryHelperSource.includes("log('首战恢复"),
   recoveryNoNewAuthority:recoveryHelperSource&&!/setInterval|setTimeout|Date\(|performance\.|persist\(|localStorage|save\.chapters|finishRun|finalizeDrops/.test(recoveryHelperSource),
   recoveryConsumedInFirstCampaign:gameModesSource.includes('if(v337FirstCampaignRecovery(r))v29BattleUI();')&&gameModesSource.indexOf('if(v337FirstCampaignRecovery(r))v29BattleUI();')>gameModesSource.indexOf('if(r.firstCampaign){'),
   telegraphScoped:telegraphHelperSource.includes("run?.v29?.rule?.firstCampaign===true")&&telegraphHelperSource.includes("run?.boss?.id==='B001'")&&telegraphHelperSource.includes('delay*run.v29.rule.telegraphScale'),
   telegraphCues:['circle:\'离开红圈\'','line:\'横向闪避\'','cone:\'绕至侧后\''].every(copy=>telegraphHelperSource.includes(copy)),
   telegraphFallthrough:telegraphHelperSource.includes("return{delay,cue:''}")&&bossInteractionsSource.includes('let warning=v337FirstCampaignTelegraph(type,delay);delay=warning.delay')&&bossInteractionsSource.includes("v25ShowCast(name,cue='')")&&bossInteractionsSource.includes("[name,cue].filter(Boolean).join(' · ')"),
   castBannerAccessible:html.includes('class="bossCastBanner" id="bossCastBanner" role="status" aria-live="assertive" aria-atomic="true"'),
   castBannerResponsive:cssSource.includes('V3.3.7 FIRST VICTORY READINESS')&&cssSource.includes('.firstCampaignBattle .bossCastBanner')&&cssSource.includes('body.mobileBattle.firstCampaignBattle .bossCastBanner'),
   firstVictoryAuthority:!recoveryHelperSource.includes('save.')&&!telegraphHelperSource.includes('save.')&&!recoveryHelperSource.includes('run.v29.settlingAt')&&!telegraphHelperSource.includes('run.v29.settlingAt'),
   firstVictoryConstants:/firstCampaign=\{[^}]*duration:360,bossAt:270[^}]*incoming:\.44[^}]*recoveryAt:\[75,165,255,300,330\][^}]*recoveryRatio:\.22[^}]*telegraphScale:1\.65[^}]*bossHp:3\.00/.test(gameModesSource)&&bossInteractionsSource.includes("B001:{name:'黄巾巨将'")&&bossInteractionsSource.includes("skills:[['circle','震地斩'],['line','蛮王冲锋'],['cone','旋风断军']]"),
   firstBossTargetScoped:firstBossTargetHelperSource.includes("run?.v29?.rule?.firstCampaign===true")&&firstBossTargetHelperSource.includes("boss?.id==='B001'")&&firstBossTargetHelperSource.includes('return boss'),
   firstBossTargetFallthrough:firstBossTargetHelperSource.includes('if(!boss)return enemy')&&firstBossTargetHelperSource.includes('if(!enemy)return boss')&&firstBossTargetHelperSource.includes('dist(player,boss)<=dist(player,enemy)?boss:enemy'),
   firstBossTargetConsumed:heroIdentitySource.includes('function v23AutoTarget(){return v338FirstBossTarget(nearest(),run.boss)}')&&heroIdentitySource.includes('function v23Arc(rad,dmg,src,arc=Math.PI*1.35){let t=v23AutoTarget()')&&heroIdentitySource.includes('let h=save.hero,s=run.heroState,p=v23P();player.skillCd=6;hint(p.skill.split(\'：\')[0]);V21Audio.skill();let t=v23AutoTarget()'),
   firstBossGuideScoped:firstBossGuideHelperSource.includes("run?.v29?.rule?.firstCampaign!==true")&&firstBossGuideHelperSource.includes("run?.boss?.id!=='B001'")&&firstBossGuideHelperSource.includes("item.type==='barrel'")&&firstBossGuideHelperSource.includes("item.type==='mechanism'"),
   firstBossGuidePriority:firstBossGuideHelperSource.includes('barrelReady||mechanism||barrel||null')&&bossInteractionsSource.includes("BOSS对策")&&bossInteractionsSource.includes("靠近按 F"),
   firstBossGuideConsumed:bossInteractionsSource.includes("p.classList.toggle('bossGuide',!!guide&&!near)")&&bossInteractionsSource.includes('const guide=v338FirstBossGuideTarget();v.interactables.forEach(x=>v25DrawInteractable(x,x===guide))'),
   firstBossCastCleanup:firstBossCastHelperSource.includes("document.getElementById('bossCastBanner')")&&firstBossCastHelperSource.includes("classList.remove('show')")&&firstBossCastHelperSource.includes("textContent=''")&&firstBossCastHelperSource.includes('clearTimeout(v21ShowBossCast.t)')&&bossInteractionsSource.includes('v338ClearFirstBossCast();\n   v25SpawnInteractables()')&&bossInteractionsSource.includes('if(!run.boss)v338ClearFirstBossCast();')&&bossInteractionsSource.includes('v338ClearFirstBossCast();\n _v25_oldFinish(victory,reason);'),
   firstBossGuideResponsive:cssSource.includes('V3.3.8 FIRST BOSS ENGAGEMENT')&&cssSource.includes('.firstCampaignBattle .interactPrompt.bossGuide')&&cssSource.includes('body.mobileBattle.firstCampaignBattle .interactPrompt.bossGuide'),
   firstBossOutcomeVisibility:cssSource.includes('[data-first-playable-flow="outcome"].flow-slice-active.show{display:grid}')&&!cssSource.includes('[data-first-playable-flow="outcome"].flow-slice-active{display:grid;'),
   firstBossInteractionAuthority:bossInteractionsSource.includes("['barrel',.19,.28]")&&bossInteractionsSource.includes("['mechanism',.76,.70]")&&bossInteractionsSource.includes("damageBoss(D*9.5,'MAP_BARREL')")&&bossInteractionsSource.includes("damageBoss(D*4.0,'MAP_MECHANISM')"),
    firstBossNoNewAuthority:![firstBossTargetHelperSource,firstBossGuideHelperSource,firstBossCastHelperSource].some(source=>/save\.|localStorage|finishRun|finalizeDrops|run\.time\s*=|\.hp\s*[+\-*/]?=|\.used\s*=|setInterval/.test(source)),
    playableWorldCamera:engineSource.includes('BATTLE_WORLD_MIN_W=3600')&&engineSource.includes('BATTLE_WORLD_MIN_H=2400')&&engineSource.includes('BATTLE_CAMERA_LOOK_AHEAD')&&engineSource.includes('function v34CameraIntent('),
    floatingJoystick:html.includes('id="mobileMoveZone"')&&saveSlotsSource.includes("zone.addEventListener('pointerdown'")&&saveSlotsSource.includes('v331PositionJoystickBase(')&&saveSlotsSource.includes("zone.addEventListener('pointercancel'"),
    tacticalMinimapMarkup:html.includes('id="tacticalMinimap"')&&html.includes('id="worldEdgeCue"')&&cssSource.includes('V3.4.0 PLAYABLE LOOP'),
    tacticalMinimapProjection:minimapHelperSource.includes('world:{width:WORLD_W,height:WORLD_H}')&&minimapHelperSource.includes('viewport:{x:battleCamera.x,y:battleCamera.y,width:AW,height:AH}')&&minimapHelperSource.includes('interactions:'),
    tacticalMinimapReadOnly:minimapHelperSource&&!/save\.|localStorage|persist\(|finishRun|finalizeDrops|\.(?:hp|used|time)\s*[+\-*/]?=/.test(minimapHelperSource),
    heroPreviewNonDestructive:heroPreviewHelperSource.includes('heroId:id')&&heroPreviewHelperSource.includes('recommendedPreset:')&&!/save\.|persist\(|localStorage/.test(heroPreviewHelperSource)&&heroUiSource.includes("function applyHeroSelection(choice='keep')")&&heroUiSource.includes("if(choice==='recommended')"),
    heroExplicitConfirmation:html.includes('id="heroConfirmOverlay"')&&html.includes('data-build-choice="keep"')&&html.includes('data-build-choice="recommended"')&&heroUiSource.includes("v32OpenLayer('heroConfirmOverlay')"),
    objectivesProjection:objectiveHelperSource.includes('objective.current')&&objectiveHelperSource.includes('objective.target')&&objectiveHelperSource.includes("state:complete?'complete':'active'")&&engineSource.includes('function v34UpdateObjectives()'),
    objectivesReadOnly:objectiveHelperSource&&!/save\.|localStorage|persist\(|finishRun|finalizeDrops|\.(?:hp|time)\s*[+\-*/]?=/.test(objectiveHelperSource),
    timedRewardsProjection:timedRewardHelperSource.includes("state:reward.claimed?'claimed'")&&timedRewardHelperSource.includes("reward.opened?'choosing'")&&timedRewardHelperSource.includes("run.time>=reward.at?'ready':'locked'")&&engineSource.includes('function claimTimedReward(index)'),
    timedRewardsIdempotent:engineSource.includes("if(!reward||reward.claimed||reward.opened||run.paused||run.v26BossLootShown===true)return false")&&engineSource.includes('reward.opened=true')&&engineSource.includes('reward.claimed=true'),
    informativeChoices:engineSource.includes('function v34ChoiceMeta(')&&engineSource.includes('currentLevel')&&engineSource.includes('nextLevel')&&engineSource.includes('synergyTags')&&engineSource.includes('choiceMetaTags'),
    loopResultSummary:resultSource.includes('v34ObjectiveResults()')&&resultSource.includes('v34TimedRewardResults()')&&resultSource.includes('resultReplayAdvice')&&resultSource.includes('function v34ReplayAdvice('),
    noV34Wrappers:![engineSource,heroUiSource,saveSlotsSource,resultSource].some(source=>/_v34(?:Old|Update|Finish|Render|Start)/.test(source))
  };
 Object.entries(checks).forEach(([name,value])=>check(value,name+' guard failed',failures));

 if(!failures.length){
  try{
   const recoveryHints=[],recoveryLogs=[];
   const recoverySandbox={run:{time:5,v29:{}},player:{hp:50,maxHp:100},hints:recoveryHints,logs:recoveryLogs,hint:message=>recoveryHints.push(message),log:message=>recoveryLogs.push(message),fmt:value=>String(value)};
   vm.createContext(recoverySandbox);vm.runInContext(recoveryHelperSource,recoverySandbox,{filename:'v337-recovery-helper.js'});
   checks.recoveryOutOfScope=recoverySandbox.v337FirstCampaignRecovery({firstCampaign:false,recoveryAt:[5],recoveryRatio:.22})===false&&recoverySandbox.player.hp===50&&recoverySandbox.run.v29.recoveries==null;
   const recoveryRule={firstCampaign:true,recoveryAt:[5],recoveryRatio:.22};
   checks.recoveryAppliesOnce=recoverySandbox.v337FirstCampaignRecovery(recoveryRule)===true&&recoverySandbox.player.hp===72&&recoverySandbox.run.v29.recoveries[0]===true&&recoverySandbox.hints.length===1&&recoverySandbox.logs.length===1&&recoverySandbox.v337FirstCampaignRecovery(recoveryRule)===false&&recoverySandbox.player.hp===72;
   recoverySandbox.run={time:5,v29:{}};recoverySandbox.player={hp:95,maxHp:100};recoveryHints.length=0;recoveryLogs.length=0;
   checks.recoveryCapsAtMax=recoverySandbox.v337FirstCampaignRecovery(recoveryRule)===true&&recoverySandbox.player.hp===100;

   const telegraphSandbox={run:{v29:{rule:{firstCampaign:true,telegraphScale:1.65}},boss:{id:'B001'}}};
   vm.createContext(telegraphSandbox);vm.runInContext(telegraphHelperSource,telegraphSandbox,{filename:'v337-telegraph-helper.js'});
   const circle=telegraphSandbox.v337FirstCampaignTelegraph('circle',.8);
   checks.firstBossTelegraph=Math.abs(circle.delay-1.32)<.0001&&circle.cue==='离开红圈';
   telegraphSandbox.run.boss.id='B002';const otherBoss=telegraphSandbox.v337FirstCampaignTelegraph('line',.8);
   telegraphSandbox.run.boss.id='B001';telegraphSandbox.run.v29.rule.firstCampaign=false;const otherStage=telegraphSandbox.v337FirstCampaignTelegraph('cone',.8);
   checks.telegraphIsolation=otherBoss.delay===.8&&otherBoss.cue===''&&otherStage.delay===.8&&otherStage.cue==='';
   const enemy={id:'EN001',x:10,y:0},boss={id:'B001',x:100,y:0};
   const targetSandbox={run:{v29:{rule:{firstCampaign:true}}},player:{x:0,y:0},dist:(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)};
   vm.createContext(targetSandbox);vm.runInContext(firstBossTargetHelperSource,targetSandbox,{filename:'v338-first-boss-target.js'});
   checks.firstBossTargetPriority=targetSandbox.v338FirstBossTarget(enemy,boss)===boss;
   boss.id='B002';checks.firstBossTargetOtherBoss=targetSandbox.v338FirstBossTarget(enemy,boss)===enemy;
   boss.id='B001';targetSandbox.run.v29.rule.firstCampaign=false;checks.firstBossTargetOtherStage=targetSandbox.v338FirstBossTarget(enemy,boss)===enemy&&targetSandbox.v338FirstBossTarget(null,boss)===boss;

   const readyBarrel={id:'I0',type:'barrel',x:120,y:100,used:false},mechanism={id:'I3',type:'mechanism',x:500,y:500,used:false},fallbackBarrel={id:'I5',type:'barrel',x:800,y:700,used:false};
   const guideSandbox={run:{v29:{rule:{firstCampaign:true}},boss:{id:'B001',x:100,y:100},v25:{used:0,interactables:[readyBarrel,mechanism,fallbackBarrel]}},player:{x:400,y:400}};
   vm.createContext(guideSandbox);vm.runInContext(firstBossGuideHelperSource,guideSandbox,{filename:'v338-first-boss-guide.js'});
   checks.firstBossGuideBarrel=guideSandbox.v338FirstBossGuideTarget()===readyBarrel&&readyBarrel.used===false&&guideSandbox.run.v25.used===0;
   readyBarrel.used=true;checks.firstBossGuideMechanism=guideSandbox.v338FirstBossGuideTarget()===mechanism;
   mechanism.used=true;checks.firstBossGuideFallback=guideSandbox.v338FirstBossGuideTarget()===fallbackBarrel;
   fallbackBarrel.used=true;checks.firstBossGuideExhausted=guideSandbox.v338FirstBossGuideTarget()===null;
   fallbackBarrel.used=false;guideSandbox.run.boss.id='B002';checks.firstBossGuideOtherBoss=guideSandbox.v338FirstBossGuideTarget()===null;

   const banner={textContent:'旧施法',classList:{removed:[],remove(value){this.removed.push(value)}}},clearedTimers=[];
   const castSandbox={run:{v29:{rule:{firstCampaign:false}}},document:{getElementById:()=>banner},v21ShowBossCast:function(){},clearTimeout:value=>clearedTimers.push(value)};castSandbox.v21ShowBossCast.t=7;
   vm.createContext(castSandbox);vm.runInContext(firstBossCastHelperSource,castSandbox,{filename:'v338-first-boss-cast.js'});
   checks.firstBossCastOutOfScope=castSandbox.v338ClearFirstBossCast()===false&&banner.textContent==='旧施法';
   castSandbox.run.v29.rule.firstCampaign=true;checks.firstBossCastCleared=castSandbox.v338ClearFirstBossCast()===true&&banner.textContent===''&&banner.classList.removed.includes('show')&&clearedTimers[0]===7;
   for(const key of ['recoveryOutOfScope','recoveryAppliesOnce','recoveryCapsAtMax','firstBossTelegraph','telegraphIsolation','firstBossTargetPriority','firstBossTargetOtherBoss','firstBossTargetOtherStage','firstBossGuideBarrel','firstBossGuideMechanism','firstBossGuideFallback','firstBossGuideExhausted','firstBossGuideOtherBoss','firstBossCastOutOfScope','firstBossCastCleared'])check(checks[key],key+' isolated guard failed',failures);
  }catch(error){failures.push('isolated first-victory helpers throw: '+error.message)}
 }

 if(!failures.length){
  const successOutcomes=Object.fromEntries(paths.map(assetPath=>[assetPath,true]));
  const failedActionPath=entries.find(entry=>entry.role==='hero-attack')?.path;
  const mixedOutcomes={...successOutcomes,[failedActionPath]:false};
  const failedOutcomes=Object.fromEntries(paths.map(assetPath=>[assetPath,false]));
  try{
   const ready=await runtimeScenario(successOutcomes);
   const partial=await runtimeScenario(mixedOutcomes);
   const fallback=await runtimeScenario(failedOutcomes);
   checks.allSuccessReady=ready.status==='ready'&&ready.snapshot().loaded===expectedRoles.length;
   checks.mixedPartial=partial.status==='partial'&&partial.snapshot().loaded===expectedRoles.length-1&&partial.snapshot().failed===1;
   checks.allFailureFallback=fallback.status==='fallback'&&fallback.snapshot().failed===expectedRoles.length;
   const fakeContext={drawImage(){this.calls=(this.calls||0)+1},save(){},restore(){},translate(){},rotate(){}};
   checks.failedRoleFallsThrough=fallback.drawRole('hero',{stageId:'ST001-01',entityId:'H001',ctx:fakeContext,x:10,y:10})===false&&(fakeContext.calls||0)===0;
   checks.failedActionKeepsBase=partial.drawRole('hero-attack',{stageId:'ST001-01',entityId:'H001',ctx:fakeContext,x:10,y:10})===false&&partial.drawRole('hero',{stageId:'ST001-01',entityId:'H001',ctx:fakeContext,x:10,y:10})===true&&fakeContext.calls===1;
   checks.rotatedActionDraws=ready.drawRole('hero-attack',{stageId:'ST001-01',entityId:'H001',ctx:fakeContext,x:10,y:10,rotation:.5,alpha:.8})===true&&fakeContext.calls===2;
   checks.outOfScopeFallsThrough=ready.drawRole('hero',{stageId:'ST001-02',entityId:'H001',ctx:fakeContext,x:10,y:10})===false;
   for(const key of ['allSuccessReady','mixedPartial','allFailureFallback','failedRoleFallsThrough','failedActionKeepsBase','rotatedActionDraws','outOfScopeFallsThrough'])check(checks[key],key+' runtime guard failed',failures);
  }catch(error){failures.push('isolated asset runtime throws: '+error.message)}
 }
 return{ok:failures.length===0,failures,checks};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=await runAssetPipelineGuard();
 if(!report.ok){console.error('ASSET PIPELINE FAIL');report.failures.forEach(item=>console.error('-',item));process.exit(1)}
  console.log('ASSET PIPELINE OK: local combat assets, first-playable flow and scoped first-victory readiness are verified.');
 }
