import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {runCampaignRoute} from './campaign-route.mjs';
import {runAssetPipelineGuard} from './asset-pipeline.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'assets/css/app.css'),'utf8');
const gameData=fs.readFileSync(path.join(root,'assets/js/config/game-data.js'),'utf8');
const gameDataCode=gameData.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const shellPath=path.join(root,'assets/js/ui/ui-shell.js');
const shell=fs.existsSync(shellPath)?fs.readFileSync(shellPath,'utf8'):'';
const shellCode=shell.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const nexusPath=path.join(root,'assets/js/ui/nexus-hub.js');
const nexus=fs.existsSync(nexusPath)?fs.readFileSync(nexusPath,'utf8'):'';
const nexusCode=nexus.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const heroUi=fs.readFileSync(path.join(root,'assets/js/ui/heroes.js'),'utf8');
const heroUiCode=heroUi.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const loadoutUi=fs.readFileSync(path.join(root,'assets/js/ui/loadout.js'),'utf8');
const loadoutUiCode=loadoutUi.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const buildUi=fs.readFileSync(path.join(root,'assets/js/ui/build.js'),'utf8');
const buildUiCode=buildUi.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const worldUi=fs.readFileSync(path.join(root,'assets/js/ui/world.js'),'utf8');
const resultCode=fs.readFileSync(path.join(root,'assets/js/ui/result.js'),'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const engine=fs.readFileSync(path.join(root,'assets/js/combat/engine.js'),'utf8');
const engineCode=engine.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const director=fs.readFileSync(path.join(root,'assets/js/systems/director-balance.js'),'utf8');
const directorCode=director.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const saveSlots=fs.readFileSync(path.join(root,'assets/js/systems/save-slots-start.js'),'utf8');
const saveSlotsCode=saveSlots.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const renderSaveCardsBlock=saveSlotsCode.slice(saveSlotsCode.indexOf('function renderSaveCards()'),saveSlotsCode.indexOf('function loadSlot('));
const qualityPresentation=fs.readFileSync(path.join(root,'assets/js/presentation/quality-presentation.js'),'utf8');
const qualityPresentationCode=qualityPresentation.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const artCinematics=fs.readFileSync(path.join(root,'assets/js/presentation/art-ui-cinematics.js'),'utf8');
const artCinematicsCode=artCinematics.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const heroIdentity=fs.readFileSync(path.join(root,'assets/js/combat/hero-identity.js'),'utf8');
const heroIdentityCode=heroIdentity.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const skillForms=fs.readFileSync(path.join(root,'assets/js/combat/skill-forms.js'),'utf8');
const skillFormsCode=skillForms.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const bossInteractions=fs.readFileSync(path.join(root,'assets/js/combat/boss-map-interactions.js'),'utf8');
const bossInteractionsCode=bossInteractions.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const gearSystem=fs.readFileSync(path.join(root,'assets/js/systems/gear-affix-loot.js'),'utf8');
const gearSystemCode=gearSystem.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const runePetSystem=fs.readFileSync(path.join(root,'assets/js/systems/runes-pets.js'),'utf8');
const runePetSystemCode=runePetSystem.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const metaGrowth=fs.readFileSync(path.join(root,'assets/js/systems/meta-growth.js'),'utf8');
const metaGrowthCode=metaGrowth.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const gameModes=fs.readFileSync(path.join(root,'assets/js/systems/game-modes.js'),'utf8');
const gameModesCode=gameModes.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const stability=fs.readFileSync(path.join(root,'assets/js/core/stability-v30.js'),'utf8');
const stabilityCode=stability.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const tutorialSettings=fs.readFileSync(path.join(root,'assets/js/ui/tutorial-settings.js'),'utf8');
const resultUi=fs.readFileSync(path.join(root,'assets/js/ui/result.js'),'utf8');
const resultUiCode=resultUi.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const requiredIds=['home','heroes','growth','loadout','build','modes','briefing','world','battle','result'];
const requiredText=['万界无双','游戏模式','英雄','世界地图'];
const fail=[];
let campaignRoute=null;
try{campaignRoute=runCampaignRoute()}catch(error){fail.push('isolated campaign route throws: '+error.message)}
let assetPipeline=null;
try{assetPipeline=await runAssetPipelineGuard()}catch(error){fail.push('isolated asset pipeline throws: '+error.message)}
const navBlock=html.slice(html.indexOf('<nav class="nav"'),html.indexOf('</nav>')+6);
const mobileNavPanelBlock=navBlock.slice(navBlock.indexOf('<div class="mobileNavPanel"'),navBlock.indexOf('</div>')+6);
const startBlock=html.slice(html.indexOf('<div class="startScreen"'),html.indexOf('<div class="modalLayer"'));
const homeBlock=html.slice(html.indexOf('<section class="page active" id="home"'),html.indexOf('<section class="page" id="heroes">'));
const heroesBlock=html.slice(html.indexOf('<section class="page" id="heroes"'),html.indexOf('<section class="page" id="growth">'));
const growthBlock=html.slice(html.indexOf('<section class="page" id="growth"'),html.indexOf('<section class="page" id="loadout"'));
const loadoutBlock=html.slice(html.indexOf('<section class="page" id="loadout"'),html.indexOf('<section class="page" id="build">'));
const buildBlock=html.slice(html.indexOf('<section class="page" id="build"'),html.indexOf('<section class="page" id="modes"'));
const modesBlock=html.slice(html.indexOf('<section class="page" id="modes"'),html.indexOf('<section class="page" id="briefing">'));
const briefingBlock=html.slice(html.indexOf('<section class="page" id="briefing"'),html.indexOf('<section class="page" id="world">'));
const worldBlock=html.slice(html.indexOf('<section class="page" id="world"'),html.indexOf('<section class="page" id="battle"'));
const battleBlock=html.slice(html.indexOf('<section class="page" id="battle"'),html.indexOf('<section class="page" id="result"'));
const resultBlock=html.slice(html.indexOf('<section class="page" id="result"'),html.indexOf('\n</section>',html.indexOf('<section class="page" id="result"'))+11);
const renderResultBlock=resultUiCode.slice(resultUiCode.indexOf('function renderResult()'),resultUiCode.indexOf('function renderSettingsToggles'));
const renderModesBlock=gameModesCode.slice(gameModesCode.indexOf('function v29RenderModes()'),gameModesCode.indexOf('function v29SelectMode('));
const briefingStatusBlock=gameModesCode.slice(gameModesCode.indexOf('function v29BriefingStatus()'),gameModesCode.indexOf('function v29BriefingList('));
const briefingRenderBlock=gameModesCode.slice(gameModesCode.indexOf('function v29RenderBriefing()'),gameModesCode.indexOf('function v29OpenBriefingFix('));
const briefingFixBlock=gameModesCode.slice(gameModesCode.indexOf('function v29OpenBriefingFix('),gameModesCode.indexOf('function v29SyncBriefingHeroAction('));
const briefingHeroActionBlock=gameModesCode.slice(gameModesCode.indexOf('function v29SyncBriefingHeroAction('),gameModesCode.indexOf('function v29SyncBriefingContext('));
const briefingSyncBlock=gameModesCode.slice(gameModesCode.indexOf('function v29SyncBriefingContext()'),gameModesCode.indexOf('function v29ClearBriefingContext('));
const briefingBeginBlock=gameModesCode.slice(gameModesCode.indexOf('function v29BeginBriefing('),gameModesCode.indexOf('function v29OpenBriefingEditor('));
const briefingOpenEditorBlock=gameModesCode.slice(gameModesCode.indexOf('function v29OpenBriefingEditor('),gameModesCode.indexOf('function v29ReturnToBriefing('));
const briefingReturnBlock=gameModesCode.slice(gameModesCode.indexOf('function v29ReturnToBriefing('),gameModesCode.indexOf('function v29CompleteBriefingHero('));
const briefingCompleteHeroBlock=gameModesCode.slice(gameModesCode.indexOf('function v29CompleteBriefingHero('),gameModesCode.indexOf('function v29CompleteLoadout('));
const briefingCompleteLoadoutBlock=gameModesCode.slice(gameModesCode.indexOf('function v29CompleteLoadout('),gameModesCode.indexOf('function v29CompleteBuild('));
const briefingCompleteBuildBlock=gameModesCode.slice(gameModesCode.indexOf('function v29CompleteBuild()'),gameModesCode.indexOf('function v29ReplayBriefing('));
const briefingConfirmBlock=gameModesCode.slice(gameModesCode.indexOf('function v29ConfirmBriefing()'),gameModesCode.indexOf('function v29BriefingKeydown('));
const briefingKeydownBlock=gameModesCode.slice(gameModesCode.indexOf('function v29BriefingKeydown('),gameModesCode.indexOf("document.addEventListener('keydown',v29BriefingKeydown)"));
const briefingQuickStartBlock=gameModesCode.slice(gameModesCode.indexOf('function v29QuickStart('),gameModesCode.indexOf('function v29StartSelected('));
const renderWorldBlock=worldUi.slice(worldUi.indexOf('function renderWorld()'),worldUi.indexOf('function selectWorldChapter('));
const selectWorldChapterBlock=worldUi.slice(worldUi.indexOf('function selectWorldChapter('),worldUi.indexOf('function selectWorldStage('));
const selectWorldStageBlock=worldUi.slice(worldUi.indexOf('function selectWorldStage('),worldUi.indexOf('function renderStageList('));
const renderStageListBlock=worldUi.slice(worldUi.indexOf('function renderStageList()'));
const startBattleBlock=engineCode.slice(engineCode.indexOf('function startBattle()'),engineCode.indexOf('function mapEnemyIds('));
const pickChestBlock=engineCode.slice(engineCode.indexOf('function pickChest('),engineCode.indexOf('function forceLevel('));
const v34RunFeatureBlock=[
 engineCode.slice(engineCode.indexOf('function v34TimedRewardTimes('),engineCode.indexOf('function v34InitRunFeatures(')),
 engineCode.slice(engineCode.indexOf('function v34InitRunFeatures('),engineCode.indexOf('function v34ObjectiveCurrent(')),
 engineCode.slice(engineCode.indexOf('function v34ObjectiveCurrent('),engineCode.indexOf('function v34ObjectiveProjection(')),
 engineCode.slice(engineCode.indexOf('function v34ObjectiveProjection('),engineCode.indexOf('function v34UpdateObjectives(')),
 engineCode.slice(engineCode.indexOf('function v34UpdateObjectives('),engineCode.indexOf('function v34TimedRewardProjection(')),
 engineCode.slice(engineCode.indexOf('function v34TimedRewardProjection('),engineCode.indexOf('function v34UpdateTimedRewards(')),
 engineCode.slice(engineCode.indexOf('function v34UpdateTimedRewards('),engineCode.indexOf('function claimTimedReward(')),
 engineCode.slice(engineCode.indexOf('function claimTimedReward('),engineCode.indexOf('function v34RenderCombatLoop('))
].join('\n');
const v34RenderCombatLoopBlock=engineCode.slice(engineCode.indexOf('function v34RenderCombatLoop('),engineCode.indexOf('function tryDodge('));
const renderHeroHallBlock=heroUiCode.slice(heroUiCode.indexOf('function renderHeroHall()'),heroUiCode.indexOf('function focusHero('));
const focusHeroBlock=heroUiCode.slice(heroUiCode.indexOf('function focusHero('),heroUiCode.indexOf('function confirmHeroSelection('));
const heroPreviewBlock=heroUiCode.slice(heroUiCode.indexOf('function v34HeroSelectionPreview('),heroUiCode.indexOf('function renderHeroes('));
const confirmHeroBlock=heroUiCode.slice(heroUiCode.indexOf('function confirmHeroSelection('),heroUiCode.indexOf('function v34BuildNames('));
const cancelHeroBlock=heroUiCode.slice(heroUiCode.indexOf('function v34CancelHeroSelection('),heroUiCode.indexOf('function applyHeroSelection('));
const applyHeroBlock=heroUiCode.slice(heroUiCode.indexOf('function applyHeroSelection('),heroUiCode.indexOf('function selectHero('));
const selectHeroBlock=heroUiCode.slice(heroUiCode.indexOf('function selectHero('));
const focusLoadoutBayBlock=loadoutUiCode.slice(loadoutUiCode.indexOf('function focusLoadoutBay('),loadoutUiCode.indexOf('function equipGear('));
const renderBuildBlock=buildUiCode.slice(buildUiCode.indexOf('function renderBuild()'),buildUiCode.indexOf('function renderBuildSlots('));
const focusBuildLibraryBlock=buildUiCode.slice(buildUiCode.indexOf('function focusBuildLibrary('),buildUiCode.indexOf('function toggleBuild('));
const setGrowthTabBlock=metaGrowthCode.slice(metaGrowthCode.indexOf('function v28SetGrowthTab('),metaGrowthCode.indexOf('function v28HeroStep('));
const renderGrowthBlock=metaGrowthCode.slice(metaGrowthCode.indexOf('function v28Render()'),metaGrowthCode.indexOf('function v28LevelUp('));
const navigationBlock=gameDataCode.slice(gameDataCode.indexOf('const PAGE_TITLES='),gameDataCode.indexOf('function chapterStars('));
const openingTag=id=>html.match(new RegExp('<[^>]+id=["\']'+id+'["\'][^>]*>'))?.[0]||'';
const storySandbox={window:{WW:{config:{}}}};
storySandbox.WW=storySandbox.window.WW;
vm.runInNewContext(gameData.slice(gameData.indexOf('const ENEMIES='),gameData.indexOf('const ELITE_AFFIXES=')),storySandbox);
storySandbox.save={selectedStage:'ST001-01',chapters:{ST001:{stars:{}},ST003:{stars:{}},ST004:{stars:{}}}};
vm.runInNewContext(gameData.slice(gameData.indexOf('function storyStageEntry('),gameData.indexOf('function gearScore(')),storySandbox);
const storyStages=Object.values(storySandbox.WW.config.stage).flatMap(chapter=>chapter.stages);
const storyIds=storyStages.map(stage=>stage[0]);
const storyBossRoutes=Object.fromEntries(storyStages.map(stage=>[stage[0],stage[5].bosses]));
const storyEnemyMaps=vm.runInNewContext('Object.fromEntries(Object.entries(ENEMIES).map(([id,enemy])=>[id,enemy.map]))',storySandbox);
const storyEncounters=storySandbox.WW.config.storyEncounters;
const storyCurve=storySandbox.WW.config.storyCurve||{};

for(const id of requiredIds)if(!new RegExp(`id=["']${id}["']`).test(html))fail.push(`missing #${id}`);
for(const t of requiredText)if(!html.includes(t))fail.push(`missing text ${t}`);

const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
const code=scripts.map(rel=>fs.readFileSync(path.join(root,rel),'utf8')).join('\n');
const expectedScripts=[
 'assets/js/config/game-data.js','assets/js/config/asset-manifest.js','assets/js/presentation/first-playable-assets.js',
 'assets/js/ui/heroes.js','assets/js/ui/loadout.js','assets/js/ui/build.js','assets/js/ui/world.js',
 'assets/js/combat/engine.js','assets/js/ui/tutorial-settings.js','assets/js/ui/result.js','assets/js/systems/director-balance.js',
 'assets/js/systems/save-slots-start.js','assets/js/presentation/quality-presentation.js','assets/js/presentation/art-ui-cinematics.js',
 'assets/js/combat/hero-identity.js','assets/js/combat/skill-forms.js','assets/js/combat/boss-map-interactions.js',
 'assets/js/systems/gear-affix-loot.js','assets/js/systems/runes-pets.js','assets/js/systems/meta-growth.js',
 'assets/js/systems/game-modes.js','assets/js/systems/daily-mutators.js','assets/js/core/stability-v30.js',
 'assets/js/ui/ui-shell.js','assets/js/ui/nexus-hub.js','assets/js/core/v31-project.js'
];
if(JSON.stringify(scripts)!==JSON.stringify(expectedScripts))fail.push('scene-lobby script placement or existing ordered script sequence changed');
if(!assetPipeline?.ok)fail.push('first-playable asset pipeline failed: '+(assetPipeline?.failures||[]).join('; '));
 const firstBossEngagementChecks=['firstBossTargetScoped','firstBossTargetFallthrough','firstBossTargetConsumed','firstBossGuideScoped','firstBossGuidePriority','firstBossGuideConsumed','firstBossCastCleanup','firstBossGuideResponsive','firstBossOutcomeVisibility','firstBossInteractionAuthority','firstBossNoNewAuthority'];
 if(!firstBossEngagementChecks.every(name=>assetPipeline?.checks?.[name]))fail.push('V3.3.8 first Boss engagement guards are incomplete');
 const playableLoopChecks=['playableWorldCamera','floatingJoystick','tacticalMinimapMarkup','tacticalMinimapProjection','tacticalMinimapReadOnly','heroPreviewNonDestructive','heroExplicitConfirmation','objectivesProjection','objectivesReadOnly','timedRewardsProjection','timedRewardsIdempotent','informativeChoices','loopResultSummary','noV34Wrappers'];
 if(!playableLoopChecks.every(name=>assetPipeline?.checks?.[name]))fail.push('V3.4.0 playable combat loop guards are incomplete');
try{
 const rewardSandbox={
  run:{active:true,time:0,paused:false,v29:{id:'story',rule:{duration:360,storyContract:{bosses:['B001']},storyEncounter:{chestAt:[90,210,300]}}},drops:[],kills:0,v25:{used:0}},
  save:{mode:'story'},hints:[],showCalls:0,
  v34RenderCombatLoop(){},
  document:{getElementById(){return null}}
 };
 rewardSandbox.hint=message=>rewardSandbox.hints.push(message);
 rewardSandbox.showChest=()=>{rewardSandbox.showCalls++;rewardSandbox.run.paused=true;rewardSandbox.run.v34ChestOpen=true;return true};
 const rewardContext=vm.createContext(rewardSandbox);vm.runInContext(v34RunFeatureBlock,rewardContext);
 if(vm.runInContext('v34InitRunFeatures()',rewardContext)!==true||vm.runInContext('v34InitRunFeatures()',rewardContext)!==false||rewardSandbox.run.objectives.length!==3||rewardSandbox.run.timedRewards.length!==3)fail.push('V3.4 run objectives or timed rewards do not initialize exactly once');
 const objectiveBefore=JSON.stringify(rewardSandbox.run),objectiveProjection=vm.runInContext('v34ObjectiveProjection()',rewardContext),rewardProjection=vm.runInContext('v34TimedRewardProjection()',rewardContext);
 if(JSON.stringify(rewardSandbox.run)!==objectiveBefore||objectiveProjection.length!==3||rewardProjection.map(item=>item.state).join(',')!=='locked,locked,locked')fail.push('V3.4 objective or timed-reward projection mutates run state or misreports locked state');
 rewardSandbox.run.drops.push({source:'normal'});vm.runInContext('v34UpdateObjectives()',rewardContext);
 if(rewardSandbox.run.objectives[0].current!==0)fail.push('V3.4 Boss objective counts a non-Boss drop');
 rewardSandbox.run.drops.push({source:'boss'});rewardSandbox.run.kills=60;rewardSandbox.run.v25.used=1;vm.runInContext('v34UpdateObjectives()',rewardContext);
 if(rewardSandbox.run.objectives.some(objective=>!objective.complete))fail.push('V3.4 objectives do not consume Boss-drop, kill and existing interaction state deterministically');
 rewardSandbox.run.time=90;
 if(vm.runInContext('v34UpdateTimedRewards()',rewardContext)!==true||vm.runInContext('v34UpdateTimedRewards()',rewardContext)!==false||vm.runInContext("v34TimedRewardProjection()[0].state",rewardContext)!=='ready')fail.push('V3.4 timed reward does not transition from locked to ready exactly once');
 rewardSandbox.run.v26BossLootShown=true;
 if(vm.runInContext('claimTimedReward(0)',rewardContext)!==false||rewardSandbox.showCalls!==0)fail.push('V3.4 timed reward can open while Boss Loot has priority');
 rewardSandbox.run.v26BossLootShown=false;
 if(vm.runInContext('claimTimedReward(0)',rewardContext)!==true||vm.runInContext('claimTimedReward(0)',rewardContext)!==false||rewardSandbox.showCalls!==1)fail.push('V3.4 timed reward can be claimed more than once by rapid input');

 const pickSandbox={
  run:{v34ActiveReward:0,v34ChestOpen:true,v34ChestResolving:false,timedRewards:[{opened:true,claimed:false}],skills:{A001:1},passives:{},evolved:{},fused:{},drops:[],paused:true},
  document:{querySelectorAll(){return[{disabled:false}]}},validOptions(){return[{id:'A001',kind:'active'}]},hint(){},log(){},skillName(id){return id},makeGearDrop(){return{id:'EQ',name:'test'}},v32CloseLayer(){},renderRunSide(){},v34RenderCombatLoop(){}
 };
 const pickContext=vm.createContext(pickSandbox);vm.runInContext(pickChestBlock,pickContext);
 if(vm.runInContext("pickChest({type:'upgrade',id:null})",pickContext)!==true||vm.runInContext("pickChest({type:'upgrade',id:null})",pickContext)!==false||pickSandbox.run.skills.A001!==2||pickSandbox.run.timedRewards[0].claimed!==true)fail.push('V3.4 reward selection can apply more than once after its chest session closes');

 const objectiveList={writes:0,_html:'',dataset:{},get innerHTML(){return this._html},set innerHTML(value){this._html=value;this.writes++}};
 const rewardTrack={writes:0,button:null,_html:'',dataset:{},get innerHTML(){return this._html.replaceAll(' disabled aria-disabled',' disabled="" aria-disabled')},set innerHTML(value){this._html=value;this.writes++;this.button={write:this.writes}}};
 const renderSandbox={run:{time:0,objectives:[{id:'primary',kind:'kills',label:'test',current:0,target:1,complete:false}],timedRewards:[{id:'reward-1',at:90,opened:false,claimed:false}]},fmt:value=>String(value),document:{getElementById(id){return id==='combatObjectiveList'?objectiveList:id==='timedRewardTrack'?rewardTrack:null}}};
 const renderContext=vm.createContext(renderSandbox);vm.runInContext(v34RunFeatureBlock+'\n'+v34RenderCombatLoopBlock,renderContext);
 vm.runInContext('v34RenderCombatLoop()',renderContext);const stableButton=rewardTrack.button;vm.runInContext('v34RenderCombatLoop()',renderContext);
 if(objectiveList.writes!==1)fail.push('V3.4 objective render rebuilds unchanged HUD DOM every frame');
 if(rewardTrack.writes!==1||rewardTrack.button!==stableButton)fail.push('V3.4 timed-reward render replaces an unchanged ready-button DOM node');
 renderSandbox.run.objectives[0].current=1;renderSandbox.run.objectives[0].complete=true;renderSandbox.run.time=90;vm.runInContext('v34RenderCombatLoop()',renderContext);
 if(objectiveList.writes!==2)fail.push('V3.4 objective render does not refresh when objective state changes');
 if(rewardTrack.writes!==2||rewardTrack.button===stableButton)fail.push('V3.4 timed-reward render does not refresh when reward state changes');
}catch(error){fail.push('V3.4 objective or timed-reward runtime test throws: '+error.message)}

try{
 const heroElements=new Map(),heroElement=id=>{if(!heroElements.has(id))heroElements.set(id,{textContent:'',disabled:false,classList:{contains(){return false},toggle(){}},querySelector(){return{textContent:''}},setAttribute(){}});return heroElements.get(id)};
 const heroSandbox={
  WW:{config:{hero:{H001:{name:'关羽',unlock:0,presets:[['赤焰',['A011'],['P026']]]},H002:{name:'赵云',unlock:40,presets:[['雷霆',['A021'],['P017']]]}}}},
  save:{hero:'H001',gold:100,build:{active:['OLD_A'],passive:['OLD_P']},heroes:{H001:{unlocked:true,level:1},H002:{unlocked:true,level:1}}},
  opened:0,closed:0,persisted:0,briefingReturns:0,lastGo:null,
  document:{activeElement:null,getElementById:heroElement,querySelectorAll(){return[{disabled:false}]},querySelector(){return null},addEventListener(){}},
  skillName(id){return id},toast(){},V29_BRIEFING_EDITORS:{heroes:'briefingEditHero'}
 };
 heroSandbox.v32OpenLayer=()=>heroSandbox.opened++;
 heroSandbox.v32CloseLayer=()=>heroSandbox.closed++;
 heroSandbox.persist=()=>heroSandbox.persisted++;
 heroSandbox.go=id=>heroSandbox.lastGo=id;
 heroSandbox.v29ReturnToBriefing=()=>heroSandbox.briefingReturns++;
 const heroContext=vm.createContext(heroSandbox);vm.runInContext(heroUiCode,heroContext);vm.runInContext("heroHallFocusId='H002'",heroContext);
 const previewSave=JSON.stringify(heroSandbox.save);vm.runInContext('confirmHeroSelection()',heroContext);
 if(JSON.stringify(heroSandbox.save)!==previewSave||heroSandbox.persisted!==0||heroSandbox.opened!==1||vm.runInContext('v34PendingHeroId',heroContext)!=='H002')fail.push('V3.4 hero confirmation mutates the active hero or build before final choice');
 vm.runInContext('v34CancelHeroSelection()',heroContext);
 if(JSON.stringify(heroSandbox.save)!==previewSave||vm.runInContext('v34PendingHeroId',heroContext)!==null)fail.push('V3.4 hero confirmation cancel does not preserve the prior hero and build');
 vm.runInContext("v34PendingHeroId='H002'",heroContext);
 if(vm.runInContext("applyHeroSelection('keep')",heroContext)!==true||heroSandbox.save.hero!=='H002'||heroSandbox.save.build.active.join(',')!=='OLD_A'||heroSandbox.save.build.passive.join(',')!=='OLD_P'||heroSandbox.persisted!==1||heroSandbox.lastGo!=='loadout')fail.push('V3.4 keep-build confirmation changes the build or misses final persistence');
 vm.runInContext("save.hero='H001';save.build.active=['OLD_A'];save.build.passive=['OLD_P'];v34PendingHeroId='H002'",heroContext);
 if(vm.runInContext("applyHeroSelection('recommended')",heroContext)!==true||heroSandbox.save.build.active.join(',')!=='A021'||heroSandbox.save.build.passive.join(',')!=='P017')fail.push('V3.4 recommended-build confirmation does not apply the selected hero preset');
 vm.runInContext("save.hero='H001';save.gold=100;save.heroes.H002.unlocked=false;save.build.active=['OLD_A'];save.build.passive=['OLD_P'];heroHallFocusId='H002'",heroContext);const lockedPreview=JSON.stringify(heroSandbox.save);vm.runInContext('confirmHeroSelection()',heroContext);
 if(JSON.stringify(heroSandbox.save)!==lockedPreview)fail.push('V3.4 locked-hero preview charges or unlocks before final confirmation');
 vm.runInContext("v29BriefingContext={editor:'heroes'}",heroContext);
 if(vm.runInContext("applyHeroSelection('keep')",heroContext)!==true||heroSandbox.save.gold!==60||heroSandbox.save.heroes.H002.unlocked!==true||heroSandbox.briefingReturns!==1)fail.push('V3.4 final hero confirmation does not own unlock payment or briefing return');
}catch(error){fail.push('V3.4 hero confirmation runtime test throws: '+error.message)}
if(!shell)fail.push('missing assets/js/ui/ui-shell.js');
for(const key of ['primary','secondary','flowOnly','views','sync'])if(!new RegExp(`\\b${key}\\b`).test(shellCode))fail.push(`WW.ui.shell is missing ${key}`);
for(const name of ['go','startBattle','finishRun','renderResult','updateRun','drawRun'])if(new RegExp(`\\b${name}\\s*=`).test(shellCode))fail.push(`ui-shell reassigns core function ${name}`);
if(!shellCode.includes('WW.ui.shell=Object.freeze('))fail.push('WW.ui.shell is not exposed as a frozen presentation contract');
if((gameDataCode.match(/WW\.ui\.shell\.sync\(id\)/g)||[]).length!==1)fail.push('original go(id) does not directly synchronize WW.ui.shell exactly once');
if(!nexus)fail.push('missing assets/js/ui/nexus-hub.js');
if(!nexusCode.includes('WW.ui.nexusHub=Object.freeze(')||!nexusCode.includes('function render('))fail.push('scene lobby lacks a frozen read-only projection contract');
for(const name of ['go','continueFlow','startBattle','finishRun','renderResult','updateRun','drawRun'])if(new RegExp(`\\b${name}\\s*=`).test(nexusCode))fail.push(`scene lobby reassigns core function ${name}`);
if(/(?:localStorage|sessionStorage|\bpersist\s*\(|\bsave\s*=(?!=)|\bsave\.[\w$]+\s*=(?!=))/.test(nexusCode))fail.push('scene lobby writes save or browser storage');
if((gameDataCode.match(/WW\.ui\?\.nexusHub\?\.render\(\)/g)||[]).length!==1)fail.push('renderTop does not safely refresh the scene lobby projection exactly once before the UI namespace is ready');

if(!startBlock.includes('data-scene-entrance')||!startBlock.includes('class="startWorld"')||!startBlock.includes('class="startCommand"'))fail.push('start screen is not a semantic scene-led world entrance');
for(const action of ['continueGame()','newGameConfirm()','openSaveManager()','openGlobalSettings()'])if(!startBlock.includes(`onclick="${action}"`))fail.push(`start scene lost existing action ${action}`);
if(!homeBlock.includes('data-scene-lobby')||!homeBlock.includes('class="nexusScene"')||!homeBlock.includes('class="nexusMission"')||!homeBlock.includes('class="nexusFocus"')||!homeBlock.includes('class="nexusLoadout"'))fail.push('home is not structured as a dominant scene lobby with peripheral mission and build projections');
if((homeBlock.match(/data-primary-action/g)||[]).length!==1||!homeBlock.includes('data-primary-action onclick="go(\'modes\')"'))fail.push('scene lobby does not expose exactly one dominant mission-selection action');
for(const id of ['homeHero','homeStage','homeBoss','homeGear','homeBuild','homeWorld','homeCampaignLabel','homeCampaignTime'])if(!homeBlock.includes(`id="${id}"`))fail.push(`scene lobby lost dynamic binding #${id}`);
for(const legacyClass of ['heroBanner','kpis','demoStatusCard','featureGrid'])if(homeBlock.includes(`class="${legacyClass}`))fail.push(`home retains dashboard composition ${legacyClass}`);
if(!css.includes('V3.3.5 SCENE LOBBY')||!css.includes('body[data-shell-view="home"]')||!css.includes('.nexusScene{')||!css.includes('.nexusPortal{')||!css.includes('.nexusPrimaryAction{')||!css.includes('@media(max-width:760px)')||!css.includes('.nexusScene{grid-template-columns:minmax(0,1fr)}'))fail.push('scene lobby lacks desktop shell takeover or mobile single-stage adaptation');

const navButtonTags=[...navBlock.matchAll(/<button\b[^>]*\bdata-page="([^"]+)"[^>]*>/g)].map(match=>({id:match[1],tag:match[0]}));
const tierIds=tier=>navButtonTags.filter(item=>item.tag.includes(`data-nav-tier="${tier}"`)).map(item=>item.id);
if(JSON.stringify(tierIds('primary'))!==JSON.stringify(['home','heroes','growth','loadout']))fail.push('navigation primary tier metadata changed');
if(JSON.stringify(tierIds('secondary'))!==JSON.stringify(['build','modes','world']))fail.push('navigation secondary tier metadata changed');
if(JSON.stringify(tierIds('flow'))!==JSON.stringify(['battle','result']))fail.push('navigation must keep exactly battle and result as flow-only buttons');
for(const item of navButtonTags.filter(item=>item.tag.includes('data-nav-tier="flow"'))){
 if(!/\shidden(?:\s|>|=)/.test(item.tag)||!item.tag.includes('aria-hidden="true"')||!item.tag.includes('tabindex="-1"'))fail.push(`${item.id} flow-only navigation button remains ordinarily reachable`);
}

const removedConfigAliases=['HEROES','SKILLS','EVOS','BOSSES','V29_MODES','CHAPTERS','GEAR','RUNES','PETS'];
for(const legacy of removedConfigAliases)if(new RegExp(`\\b${legacy}\\b`).test(code))fail.push(`removed configuration compatibility alias remains in loaded runtime: ${legacy}`);
for(const key of ['hero','skill','evolution','boss','stage','gear','rune','pet'])if(!gameData.includes(`window.WW.config.${key}=`))fail.push(`missing formal WW.config.${key} assignment`);
if(!gameModes.includes('window.WW.config.mode='))fail.push('missing formal WW.config.mode assignment');
if((gameData.match(/WW\.config\.evolution/g)||[]).length!==3)fail.push('game data evolution consumers do not use the formal path twice');
for(const [source,count] of [[buildUiCode,1],[engineCode,3],[artCinematicsCode,5]]){
 if(/\bEVOS\b/.test(source))fail.push('a scoped evolution consumer still reads the legacy alias');
 if((source.match(/WW\.config\.evolution/g)||[]).length!==count)fail.push('a scoped evolution consumer has an unexpected formal-path count');
}
for(const [source,count] of [[engineCode,3],[directorCode,1],[qualityPresentationCode,1],[artCinematicsCode,2]]){
 if(/\bBOSSES\b/.test(source))fail.push('a scoped boss consumer still reads the legacy alias');
 if((source.match(/WW\.config\.boss/g)||[]).length!==count)fail.push('a scoped boss consumer has an unexpected formal-path count');
}
for(const [source,count] of [[saveSlotsCode,2],[qualityPresentationCode,2],[artCinematicsCode,3]]){
 if(/\bHEROES\b/.test(source))fail.push('a scoped hero presentation/save consumer still reads the legacy alias');
 if((source.match(/WW\.config\.hero/g)||[]).length!==count)fail.push('a scoped hero presentation/save consumer has an unexpected formal-path count');
}
if((gameData.match(/WW\.config\.hero/g)||[]).length!==3)fail.push('game data Hero consumers do not use the formal path twice');
for(const [source,count] of [[engineCode,10],[metaGrowthCode,4],[stabilityCode,2]]){
 if(/\bHEROES\b/.test(source))fail.push('a remaining Hero consumer still reads the legacy alias');
 if((source.match(/WW\.config\.hero/g)||[]).length!==count)fail.push('a remaining Hero consumer has an unexpected formal-path count');
}
if((gameData.match(/WW\.config\.gear/g)||[]).length!==2)fail.push('game data Gear consumer does not use the formal path');
for(const [source,count] of [[loadoutUiCode,8],[engineCode,3],[directorCode,5],[artCinematicsCode,2]]){
 if(/\bGEAR\b/.test(source))fail.push('a scoped Gear consumer still reads the legacy alias');
 if((source.match(/WW\.config\.gear/g)||[]).length!==count)fail.push('a scoped Gear consumer has an unexpected formal-path count');
}
if(!gameData.includes('function skillName(id){return WW.config.skill[id]||WW.config.evolution[id]?.[0]||FUSIONS[id]?.[0]||id}'))fail.push('skill-name fallback does not preserve skill/evolution/fusion order');
if(!gameData.includes('function reachableBuildEvos(){return Object.entries(WW.config.evolution)'))fail.push('reachable Build evolutions do not read the formal config');
if(!gameData.includes('function runeScore(){return save.runes.reduce((s,id)=>s+(WW.config.rune[id]?.score||0),0)}'))fail.push('rune scoring does not read WW.config.rune');
if(!gameData.includes('function petScore(){return WW.config.pet[save.pet]?.score||0}'))fail.push('pet scoring does not read WW.config.pet');
if(!gameData.includes("build:{active:['A011','A021','A026','A027','A003','A054'],passive:['P026','P017','P030','P019','P016','P018']}"))fail.push('default skill build changed');
if(!heroUi.includes('Object.entries(WW.config.hero)'))fail.push('hero-selection list does not read WW.config.hero');
if(!heroUi.includes('WW.config.hero[id]'))fail.push('hero selection does not read WW.config.hero');
if(/\bHEROES\b/.test(heroUi))fail.push('hero-selection UI still reads the HEROES alias');
if(!loadoutUi.includes('WW.config.hero[save.hero]'))fail.push('loadout UI does not safely resolve the selected hero through WW.config.hero');
if(/\bHEROES\b/.test(loadoutUi))fail.push('loadout UI still reads the HEROES alias');
for(const legacy of ['RUNES','PETS'])if(new RegExp(`\\b${legacy}\\b`).test(loadoutUi))fail.push(`loadout UI still reads the ${legacy} alias`);
if((loadoutUi.match(/WW\.config\.rune/g)||[]).length!==7)fail.push('loadout UI has an unexpected WW.config.rune access count');
if((loadoutUi.match(/WW\.config\.pet/g)||[]).length!==7)fail.push('loadout UI has an unexpected WW.config.pet access count');
if(!buildUi.includes('WW.config.hero[save.hero]'))fail.push('build UI does not read selected hero config through WW.config.hero');
if(!buildUi.includes('Object.values(WW.config.hero)'))fail.push('build UI does not read hero presets through WW.config.hero');
if(/\bHEROES\b/.test(buildUi))fail.push('build UI still reads the HEROES alias');
if(!worldUi.includes('WW.config.stage'))fail.push('world UI does not read WW.config.stage');
if(/\bCHAPTERS\b/.test(worldUi))fail.push('world UI still reads the CHAPTERS alias');
if((gameData.match(/WW\.config\.stage/g)||[]).length!==9)fail.push('game data Chapter consumers or in-place writes have an unexpected formal-path count');
for(const [source,count] of [[engineCode,3],[directorCode,1],[saveSlotsCode,4],[qualityPresentationCode,1],[artCinematicsCode,1],[metaGrowthCode,1],[stabilityCode,4]]){
 if(/\bCHAPTERS\b/.test(source))fail.push('a scoped Chapter consumer still reads or writes the legacy alias');
 if((source.match(/WW\.config\.stage/g)||[]).length!==count)fail.push('a scoped Chapter consumer has an unexpected formal-path count');
}
if(!gameData.includes("function recomputeWorldUnlocks(){WW.config.stage.ST001.unlock=true;WW.config.stage.ST003.unlock=storyStageUnlocked('ST003-01');WW.config.stage.ST004.unlock=storyStageUnlocked('ST004-01')}"))fail.push('Chapter unlock mutations no longer follow the strict Story route');
for(const key of ['combat','skillNames'])if(!heroIdentity.includes(`window.WW.config.heroIdentity.${key}=`))fail.push(`missing formal heroIdentity.${key} config`);
for(const legacy of ['V23_HERO_COMBAT','V23_NAMES'])if(new RegExp(`\\b${legacy}\\b`).test(heroIdentityCode))fail.push(`removed hero identity compatibility alias remains: ${legacy}`);
if(!heroIdentity.includes('window.WW.config.heroIdentity.combat={H001:'))fail.push('hero combat sentinel changed');
if(!heroIdentity.includes('window.WW.config.heroIdentity.skillNames={H001_SLASH:'))fail.push('hero skill-name sentinel changed');
if(/\bHEROES\b/.test(heroIdentity))fail.push('hero identity still reads the HEROES alias');
for(const key of ['descriptions','elementPassives','baseCooldowns','extraNames'])if(!skillForms.includes(`window.WW.config.skillForms.${key}=`))fail.push(`missing formal skillForms.${key} config`);
for(const legacy of ['V24_FORM_DESC','V24_ELEMENT_PASSIVE','V24_BASE_CD','V24_EXTRA_NAMES'])if(new RegExp(`\\b${legacy}\\b`).test(skillFormsCode))fail.push(`removed skillForms compatibility alias remains: ${legacy}`);
for(const legacy of ['EVOS','CHAPTERS','HEROES'])if(new RegExp(`\\b${legacy}\\b`).test(skillForms))fail.push(`skill forms still reads the ${legacy} alias`);
for(const key of ['bosses','interactionNames','interactionDescriptions','damageNames'])if(!bossInteractions.includes(`window.WW.config.bossInteractions.${key}=`))fail.push(`missing formal bossInteractions.${key} config`);
for(const legacy of ['V25_BOSS','V25_INTERACT_NAMES','V25_INTERACT_DESC','V25_DAMAGE_NAMES'])if(new RegExp(`\\b${legacy}\\b`).test(bossInteractionsCode))fail.push(`removed bossInteractions compatibility alias remains: ${legacy}`);
for(const key of ['catalog','sets','affixPool','rarityAffixCounts','bossDrops'])if(!gearSystem.includes(`window.WW.config.gearSystem.${key}=`))fail.push(`missing formal gearSystem.${key} config`);
for(const legacy of ['V26_GEAR_CATALOG','V26_SETS','V26_AFFIX_POOL','V26_RARITY_AFFIX','V26_BOSS_DROPS'])if(new RegExp(`\\b${legacy}\\b`).test(gearSystemCode))fail.push(`removed gear compatibility alias remains: ${legacy}`);
for(const legacy of ['GEAR','RUNES','PETS','HEROES','BOSSES','CHAPTERS','V24_FORM_DESC'])if(new RegExp(`\\b${legacy}\\b`).test(gearSystemCode))fail.push(`gear system still reads the ${legacy} alias`);
if(!gearSystem.includes('Object.assign(WW.config.gear,WW.config.gearSystem.catalog)'))fail.push('gear catalog no longer extends WW.config.gear in place');
for(const key of ['runes','pets'])if(!runePetSystem.includes(`window.WW.config.runePetSystem.${key}=`))fail.push(`missing formal runePetSystem.${key} config`);
for(const legacy of ['V27_RUNES','V27_PETS'])if(new RegExp(`\\b${legacy}\\b`).test(runePetSystemCode))fail.push(`removed rune/pet compatibility alias remains: ${legacy}`);
for(const legacy of ['RUNES','PETS','HEROES','CHAPTERS','V24_BASE_CD'])if(new RegExp(`\\b${legacy}\\b`).test(runePetSystemCode))fail.push(`rune/pet system still reads the ${legacy} alias`);
if(!runePetSystem.includes('Object.assign(WW.config.rune,Object.fromEntries(Object.entries(WW.config.runePetSystem.runes)'))fail.push('rich rune definitions no longer project into WW.config.rune in place');
if(!runePetSystem.includes('const V27_RUNE_IDS=Object.keys(WW.config.runePetSystem.runes)'))fail.push('V27_RUNE_IDS is not derived from the formal rune config');
if(/Object\.assign\(WW\.config\.pet/.test(runePetSystemCode))fail.push('rich pet definitions overwrite the lightweight WW.config.pet object');
if(!stability.includes("if(typeof WW.config.mode!=='undefined'&&!WW.config.mode[s.mode])s.mode='story';else s.mode=s.mode||'story';"))fail.push('Schema30 mode fallback does not read WW.config.mode');
if(/\bV29_MODES\b/.test(stabilityCode))fail.push('stability-v30 still reads the V29_MODES alias');
if((stability.match(/WW\.config\.skill\[id\]/g)||[]).length!==2)fail.push('Schema30 build sanitization does not read WW.config.skill twice');
if(/\bSKILLS\b/.test(stabilityCode))fail.push('stability-v30 still reads the SKILLS alias');
for(const key of ['bossOrder','bossStages','dailyChallenges','firstCampaign'])if(!gameModes.includes(`window.WW.config.gameModes.${key}=`))fail.push(`missing formal gameModes.${key} config`);
for(const legacy of ['V29_BOSS_ORDER','V29_BOSS_STAGE','V29_DAILY'])if(new RegExp(`\\b${legacy}\\b`).test(gameModesCode))fail.push(`removed game mode compatibility alias remains: ${legacy}`);
for(const legacy of ['CHAPTERS','HEROES'])if(new RegExp(`\\b${legacy}\\b`).test(gameModesCode))fail.push(`game modes still reads the ${legacy} alias`);
const modeConfigBlock=gameModes.slice(gameModes.indexOf('window.WW.config.mode='),gameModes.indexOf('window.WW.config.gameModes.bossOrder='));
const dailyConfigBlock=gameModes.slice(gameModes.indexOf('window.WW.config.gameModes.dailyChallenges='),gameModes.indexOf('function v29DateKey'));
if((modeConfigBlock.match(/^\s*[a-z]+:\{/gm)||[]).length!==7)fail.push('seven-mode catalog changed');
if((dailyConfigBlock.match(/^\s*\{name:/gm)||[]).length!==4)fail.push('daily challenge catalog changed');
if(!gameModes.includes("bossOrder=['B001','B002','B003','B006','B008','B009','B010','B011']"))fail.push('Boss order changed');
if(!gameModes.includes("B001:'ST001-01'")||!gameModes.includes("B011:'ST004-04'"))fail.push('Boss stage sentinels changed');
if(!gameModes.includes('dailyChallenges[n%WW.config.gameModes.dailyChallenges.length]'))fail.push('daily rotation no longer reads the formal config');
if(!/firstCampaign=\{stage:'ST001-01',bossId:'B001',duration:360,bossAt:270,eventAt:\[45,150\],chestAt:\[90,210\]/.test(gameModes))fail.push('first campaign milestone contract changed');
if(!gameModes.includes("chestAt:[90,210],spawn:.88,hp:.90,dmg:.82,speed:.96,incoming:.44,recoveryAt:[75,165,255,300,330],recoveryRatio:.22,telegraphScale:1.65,bossHp:3.00"))fail.push('first campaign protection, recovery, telegraph, or Boss pacing contract is incomplete or changed');
if(!gameData.includes("['ST001-01','边境清剿',true,260,'B001',{objective:"))fail.push('ST001-01 is no longer a B001 Boss stage with a campaign contract');
const expectedStoryIds=['ST001-01','ST001-02','ST001-03','ST001-04','ST003-01','ST003-02','ST003-03','ST003-04','ST004-01','ST004-02','ST004-03','ST004-04'];
const expectedStoryBosses={
 'ST001-01':['B001'],'ST001-02':[],'ST001-03':['B002'],'ST001-04':['B003'],
 'ST003-01':[],'ST003-02':[],'ST003-03':['B006'],'ST003-04':['B008'],
 'ST004-01':[],'ST004-02':[],'ST004-03':['B009','B010'],'ST004-04':['B011']
};
if(JSON.stringify(storyIds)!==JSON.stringify(expectedStoryIds))fail.push('12-stage Story route order changed');
if(JSON.stringify(storyBossRoutes)!==JSON.stringify(expectedStoryBosses))fail.push('Story stage-to-Boss route is incoherent');
if(new Set(storyStages.map(stage=>stage[1])).size!==12||new Set(storyStages.map(stage=>stage[5].objective)).size!==12)fail.push('Story stage titles or objectives are not distinct');
if(storyStages.some((stage,index)=>stage[5].duration!==(index===0?360:1200)))fail.push('Story stage duration contract changed');
if(storyStages.some((stage,index)=>stage[5].unlockAfter!==(index===0?null:storyIds[index-1])))fail.push('Story route is not a strict single unlock chain');
if(storyStages.some(stage=>stage[5].stars.clear!==2||stage[5].stars.mastery!==3||stage[5].stars.masteryHp!==.55||stage[5].reward.starGold!==100))fail.push('Story star or reward contract changed');
if(JSON.stringify(Object.keys(storyEncounters))!==JSON.stringify(expectedStoryIds))fail.push('12-stage encounter profile order or coverage changed');
if(JSON.stringify(Object.keys(storyCurve))!==JSON.stringify(expectedStoryIds))fail.push('V3.3.4 Story pressure curve order or coverage is incomplete');
for(const id of expectedStoryIds){
 const curve=storyCurve[id];
 if(!curve||!Number.isFinite(curve.budget)||!curve.beat||!curve.note||['hp','dmg','speed','incoming','bossHp'].some(key=>!Number.isFinite(curve[key])||curve[key]<=0))fail.push(id+' Story pressure budget is incomplete');
}
if(expectedStoryIds.slice(1).some((id,index)=>storyCurve[id]?.budget<=storyCurve[expectedStoryIds[index]]?.budget))fail.push('Story pressure budgets are not strictly progressive');
const firstCurve=storyCurve['ST001-01'];
if(!firstCurve||firstCurve.hp!==.90||firstCurve.dmg!==.82||firstCurve.speed!==.96||firstCurve.incoming!==.58||firstCurve.bossHp!==3.00)fail.push('first campaign pressure curve no longer preserves the accepted multipliers');
const encounterTypes=new Set(['normal','event','chest','elite','horde','boss','end']),eventIds=new Set(['merchant','altar','goldChest','rift']);
for(const stage of storyStages){
 const id=stage[0],chapter=id.slice(0,5),profile=storyEncounters[id];
 if(!profile||!profile.name||!Array.isArray(profile.enemies)||profile.enemies.length<3||!Array.isArray(profile.waves)||profile.waves.length<5)fail.push(id+' encounter profile is incomplete');
 else{
  if(profile.enemies.some(([enemy,weight])=>storyEnemyMaps[enemy]!==chapter||!(weight>0)))fail.push(id+' encounter enemy family escapes its chapter');
  if(profile.waves.some((wave,index)=>wave.at<0||(index&&wave.at<=profile.waves[index-1].at)||!encounterTypes.has(wave.type)||!wave.name||!wave.note))fail.push(id+' encounter waves are invalid or unordered');
  if(profile.waves.at(-1).at!==stage[5].duration||profile.waves.at(-1).type!=='end')fail.push(id+' encounter does not end at the stage duration');
  const encounterBosses=profile.waves.filter(wave=>wave.type==='boss').flatMap(wave=>wave.bosses||[]),bossBeat=profile.waves.find(wave=>wave.type==='boss');
  if(JSON.stringify(encounterBosses)!==JSON.stringify(stage[5].bosses)||(stage[5].bosses.length&&bossBeat?.at!==stage[5].bossAt))fail.push(id+' encounter Boss beat does not match the Story route');
  if(profile.eventPool.some(event=>!eventIds.has(event))||profile.eventAt.some((time,index)=>time<=0||(index&&time<=profile.eventAt[index-1])||time>=stage[5].duration))fail.push(id+' encounter event contract is invalid');
  if(profile.chestAt.some((time,index)=>time<=0||(index&&time<=profile.chestAt[index-1])||time>=stage[5].duration))fail.push(id+' encounter chest contract is invalid');
  if(!['fireline','fog','blast'].includes(profile.hazard.type)||!profile.hazard.name||!profile.hazard.desc)fail.push(id+' encounter hazard contract is invalid');
 }
}
for(let i=1;i<expectedStoryIds.length;i++){
 const left=storyEncounters[expectedStoryIds[i-1]],right=storyEncounters[expectedStoryIds[i]],dimensions=[JSON.stringify(left.enemies)!==JSON.stringify(right.enemies),JSON.stringify(left.waves)!==JSON.stringify(right.waves),left.elite!==right.elite||left.horde!==right.horde||left.spawn!==right.spawn,JSON.stringify(left.eventAt)!==JSON.stringify(right.eventAt)||JSON.stringify(left.eventPool)!==JSON.stringify(right.eventPool),JSON.stringify(left.chestAt)!==JSON.stringify(right.chestAt),JSON.stringify(left.hazard)!==JSON.stringify(right.hazard)].filter(Boolean).length;
 if(dimensions<2)fail.push(expectedStoryIds[i-1]+' and '+expectedStoryIds[i]+' lack two visible encounter differences');
}
if(JSON.stringify(storyEncounters['ST001-01'].eventAt)!==JSON.stringify([45,150])||JSON.stringify(storyEncounters['ST001-01'].chestAt)!==JSON.stringify([90,210])||storyEncounters['ST001-01'].spawn!==.88)fail.push('first campaign encounter milestones or spawn changed');
try{
 const directorSandbox={save:{difficulty:'normal'},run:null};
 vm.runInNewContext(director.slice(0,director.indexOf('/* Wrap spawnEnemy')),directorSandbox);
 for(const [stageId,bosses] of [['ST001-02',[]],['ST003-03',['B006']],['ST004-03',['B009','B010']]]){
  const encounter=storyEncounters[stageId];directorSandbox.run={v29:{id:'story',rule:{storyEncounter:encounter}}};
  const runtimePlan=vm.runInNewContext('v19WavePlan().map(w=>({at:v19WaveSecond(w),type:w.type,bosses:w.bosses||[]}))',directorSandbox);
  const runtimeBosses=runtimePlan.filter(w=>w.type==='boss').flatMap(w=>w.bosses);
  if(JSON.stringify(runtimeBosses)!==JSON.stringify(bosses)||runtimePlan.at(-1).at!==storySandbox.storyStageContract(stageId).duration)fail.push(stageId+' Director runtime plan does not match its encounter profile');
  if(bosses.length&&vm.runInNewContext('v19WaveAt('+storySandbox.storyStageContract(stageId).bossAt+').type',directorSandbox)!=='boss')fail.push(stageId+' Director does not enter its Boss beat at the contract time');
 }
 directorSandbox.run={v29:{id:'clear',rule:{storyEncounter:storyEncounters['ST004-03']}}};
 const nonStoryWaves=vm.runInNewContext('v19WavePlan().map(w=>w.id)',directorSandbox);
 if(nonStoryWaves[0]!=='W01'||nonStoryWaves.at(-1)!=='W16')fail.push('non-Story Director no longer falls back to the legacy V19 wave plan');
}catch(error){
 fail.push('encounter Director runtime test throws: '+error.message);
}

try{
 const weightedSandbox={ENEMIES:{A:{map:'TEST'},B:{map:'TEST'},C:{map:'TEST'}},run:null};
 vm.runInNewContext(engine.slice(engine.indexOf('function mapEnemyIds('),engine.indexOf('function spawnEnemy(')),weightedSandbox);
 weightedSandbox.run={time:0,v29:{id:'story',rule:{storyEncounter:storyEncounters['ST004-03']}}};
 const weightedPicks=[.01,.4,.99].map(roll=>vm.runInNewContext('Math.random=()=>'+roll+';weightedEnemyId("ST004")',weightedSandbox));
 if(JSON.stringify(weightedPicks)!==JSON.stringify(['EN023','EN024','EN027']))fail.push('Story enemy-family weights are not consumed in configured order');
 weightedSandbox.run={time:0,v29:{id:'clear',rule:{storyEncounter:storyEncounters['ST004-03']}}};
 if(vm.runInNewContext('Math.random=()=>.99;weightedEnemyId("TEST")',weightedSandbox)!=='B')fail.push('non-Story enemy selection is contaminated by the Story encounter profile');
}catch(error){
 fail.push('encounter enemy-weight runtime test throws: '+error.message);
}

try{
 const eventElements={eventTitle:{textContent:''},eventChoices:{innerHTML:'',children:[],appendChild(child){this.children.push(child)}}};
 const eventSandbox={run:null,MAP_EVENTS:[{id:'merchant',name:'Merchant'},{id:'altar',name:'Altar'},{id:'goldChest',name:'Chest'},{id:'rift',name:'Rift'}],document:{getElementById:id=>eventElements[id],createElement:()=>({})},v32OpenLayer:()=>{}};
 vm.runInNewContext(engine.slice(engine.indexOf('function showEvent('),engine.indexOf('function pickEvent(')),eventSandbox);
 eventSandbox.run={paused:false,time:123,v29:{id:'story',rule:{storyEncounter:storyEncounters['ST004-03']},encounterEvidence:{events:[]}}};
 vm.runInNewContext('Math.random=()=>.99;showEvent()',eventSandbox);
 if(eventElements.eventTitle.textContent!=='Rift'||eventSandbox.run.v29.encounterEvidence.events[0]?.id!=='rift')fail.push('Story event runtime escapes the selected encounter event pool');
 eventSandbox.run={paused:false,time:123,v29:{id:'clear',rule:{storyEncounter:storyEncounters['ST004-03']},encounterEvidence:{events:[]}}};
 vm.runInNewContext('Math.random=()=>0;showEvent()',eventSandbox);
 if(eventElements.eventTitle.textContent!=='Merchant')fail.push('non-Story event runtime is contaminated by the Story event pool');
}catch(error){
 fail.push('encounter event-pool runtime test throws: '+error.message);
}

try{
 const hazardSandbox={run:null,traps:[],player:{x:450,y:370},AW:900,AH:740,WORLD_W:2400,WORLD_H:1800,chapter:'ST004',damageTaken:0,selectedStageInfo:()=>({chapter:hazardSandbox.chapter}),hurtPlayer:damage=>{hazardSandbox.damageTaken+=damage},log:()=>{}};
 vm.runInNewContext(engine.slice(engine.indexOf('function updateMapMechanic('),engine.indexOf('function showEvent(')),hazardSandbox);
 const blast=storyEncounters['ST004-03'].hazard,evidence={hazardUsed:false,hazardTriggers:0,hazardPeak:0};
 hazardSandbox.run={time:blast.interval,mapHazards:[],v29:{id:'story',rule:{storyEncounter:storyEncounters['ST004-03']},encounterEvidence:evidence}};
 vm.runInNewContext('Math.random=()=>.5;updateMapMechanic(1)',hazardSandbox);
 const storyTrap=hazardSandbox.traps[0];
 if(!evidence.hazardUsed||evidence.hazardTriggers!==1||storyTrap?.r!==blast.size||storyTrap?.life!==blast.life||storyTrap?.dmg!==blast.damage)fail.push('Story hazard runtime does not consume the selected encounter parameters or evidence');
 hazardSandbox.traps.length=0;const isolatedEvidence={hazardUsed:false,hazardTriggers:0,hazardPeak:0};
 hazardSandbox.run={time:6,mapHazards:[],v29:{id:'clear',rule:{storyEncounter:storyEncounters['ST004-03']},encounterEvidence:isolatedEvidence}};
 vm.runInNewContext('Math.random=()=>.5;updateMapMechanic(1)',hazardSandbox);
 const legacyTrap=hazardSandbox.traps[0];
 if(legacyTrap?.r!==44||legacyTrap?.life!==1.3||legacyTrap?.dmg!==16||isolatedEvidence.hazardUsed)fail.push('non-Story hazard defaults are contaminated by the Story encounter profile');
}catch(error){
 fail.push('encounter hazard runtime test throws: '+error.message);
}

try{
 const dodgeSandbox={run:{active:true,paused:false},player:{x:450,y:370,speed:240,dodgeCd:0,inv:0},keys:{d:true},AW:900,AH:740,WORLD_W:2400,WORLD_H:1800,save:{settings:{particles:true}},effects:[]};
 const dodgeRuntime=engine.slice(engine.indexOf('let dodgeDirection='),engine.indexOf('let tutorialStep='))+'\n'+engine.slice(engine.indexOf('function tryDodge('),engine.indexOf('function castHeroSkill('));
 vm.runInNewContext(dodgeRuntime,dodgeSandbox);
 vm.runInNewContext('tryDodge()',dodgeSandbox);
 const firstX=dodgeSandbox.player.x;
 if(firstX<=450||dodgeSandbox.player.y!==370||dodgeSandbox.player.dodgeCd!==4.5||dodgeSandbox.player.inv!==.35||dodgeSandbox.effects[0]?.x!==450)fail.push('directional dodge does not move right while preserving cooldown, invulnerability, and origin feedback');
 dodgeSandbox.player.dodgeCd=0;dodgeSandbox.keys={};vm.runInNewContext('tryDodge()',dodgeSandbox);
 if(dodgeSandbox.player.x<=firstX)fail.push('stationary dodge does not reuse the last movement direction');
 dodgeSandbox.player={x:2380,y:18,speed:240,dodgeCd:0,inv:0};dodgeSandbox.keys={d:true,w:true};vm.runInNewContext('tryDodge()',dodgeSandbox);
 if(dodgeSandbox.player.x>2382||dodgeSandbox.player.y<18)fail.push('directional dodge can escape the world bounds');
 const boundedX=dodgeSandbox.player.x,boundedY=dodgeSandbox.player.y;vm.runInNewContext('tryDodge()',dodgeSandbox);
 if(dodgeSandbox.player.x!==boundedX||dodgeSandbox.player.y!==boundedY)fail.push('dodge cooldown no longer blocks repeated displacement');
}catch(error){
 fail.push('directional dodge runtime test throws: '+error.message);
}

try{
 const worldStart=engine.indexOf('const BATTLE_WORLD_MIN_W='),worldEnd=engine.indexOf('function v331QueueArenaResize(');
 if(worldStart<0||worldEnd<0)throw new Error('battle world and camera helpers are missing');
 const rect={width:900,height:740},cameraCalls=[];
 const worldSandbox={AW:900,AH:740,DPR:1,run:{active:true},player:{x:1200,y:814},canvas:{getBoundingClientRect:()=>rect,width:0,height:0},ctx:{setTransform:(...args)=>cameraCalls.push(args)}};
 vm.runInNewContext(engine.slice(worldStart,worldEnd),worldSandbox);
 vm.runInNewContext('resetBattleWorld();snapBattleCamera()',worldSandbox);
 const initial=vm.runInNewContext('({WORLD_W,WORLD_H,x:battleCamera.x,y:battleCamera.y})',worldSandbox);
 if(initial.WORLD_W<1800||initial.WORLD_H<1480||initial.x<=0||initial.y<=0)fail.push('battle world is not independently larger than the viewport or camera does not center the world start');
 const before=vm.runInNewContext('({x:player.x,y:player.y})',worldSandbox);rect.width=1280;rect.height=800;vm.runInNewContext('resizeArena()',worldSandbox);
 const after=vm.runInNewContext('({x:player.x,y:player.y,WORLD_W,WORLD_H,AW,AH})',worldSandbox);
 if(after.x!==before.x||after.y!==before.y||after.WORLD_W<after.AW*2||after.WORLD_H<after.AH*2)fail.push('arena resize mutates world coordinates or fails to preserve a two-viewport battlefield');
 vm.runInNewContext('player.x=18;player.y=18;snapBattleCamera()',worldSandbox);const topLeft=vm.runInNewContext('({x:battleCamera.x,y:battleCamera.y})',worldSandbox);
 vm.runInNewContext('player.x=WORLD_W-18;player.y=WORLD_H-18;snapBattleCamera()',worldSandbox);const bottomRight=vm.runInNewContext('({x:battleCamera.x,y:battleCamera.y,maxX:WORLD_W-AW,maxY:WORLD_H-AH})',worldSandbox);
 if(topLeft.x!==0||topLeft.y!==0||bottomRight.x!==bottomRight.maxX||bottomRight.y!==bottomRight.maxY)fail.push('follow camera does not clamp to all world edges');
}catch(error){
 fail.push('battle world/camera runtime test throws: '+error.message);
}

try{
 const joystickStart=saveSlots.indexOf('const V331_JOYSTICK_DEAD_ZONE='),joystickEnd=saveSlots.indexOf('function v331ClearInputs(');
 if(joystickStart<0||joystickEnd<0)throw new Error('continuous joystick vector helper is missing');
 const movementSandbox={keys:{d:true,w:true},v20Joy:{active:false,dx:0,dy:0,id:null},document:{getElementById:()=>null}};
 const movementRuntime=engine.slice(engine.indexOf('function movementVector('),engine.indexOf('let tutorialStep='))+'\n'+saveSlots.slice(joystickStart,joystickEnd);
 vm.runInNewContext(movementRuntime,movementSandbox);
 let vector=vm.runInNewContext('movementVector()',movementSandbox);
 if(Math.abs(Math.hypot(vector.x,vector.y)-1)>.0001||vector.x<=0||vector.y>=0)fail.push('keyboard diagonal movement is not normalized to full-speed unit travel');
 movementSandbox.keys={};movementSandbox.v20Joy={active:true,dx:.56,dy:0,id:7};vector=vm.runInNewContext('movementVector()',movementSandbox);
 if(!vector||Math.abs(vector.x-.5)>.0001||vector.y!==0)fail.push('joystick half travel is not preserved as continuous half-speed movement');
 movementSandbox.v20Joy.dx=2;vector=vm.runInNewContext('movementVector()',movementSandbox);
 if(!vector||Math.abs(Math.hypot(vector.x,vector.y)-1)>.0001)fail.push('joystick movement is not capped to unit length');
 movementSandbox.v20Joy.dx=.1;if(vm.runInNewContext('movementVector()',movementSandbox)!==null)fail.push('joystick dead zone no longer stops low-noise movement');
 vm.runInNewContext('v331ResetJoystick()',movementSandbox);
 if(movementSandbox.v20Joy.active||vm.runInNewContext('movementVector()',movementSandbox)!==null)fail.push('joystick release does not stop movement');
 if(vm.runInNewContext("typeof responsiveMovementVector==='function'&&typeof resetMovementResponse==='function'",movementSandbox)!==true)throw new Error('frame-rate-independent movement response helper is missing');
 movementSandbox.keys={d:true};vm.runInNewContext('resetMovementResponse()',movementSandbox);const oneStep=vm.runInNewContext('responsiveMovementVector(.03)',movementSandbox);
 vm.runInNewContext('resetMovementResponse()',movementSandbox);let splitStep;for(let i=0;i<3;i++)splitStep=vm.runInNewContext('responsiveMovementVector(.01)',movementSandbox);
 if(!oneStep||oneStep.x<=0||oneStep.x>=1||Math.abs(oneStep.x-splitStep.x)>.0001)fail.push('movement response is not smooth and frame-rate independent');
 for(let i=0;i<8;i++)vector=vm.runInNewContext('responsiveMovementVector(.03)',movementSandbox);
 if(!vector||Math.abs(vector.x-1)>.001||Math.hypot(vector.x,vector.y)>1.0001)fail.push('movement response does not converge to the existing unit-speed cap');
 movementSandbox.keys={a:true};vector=vm.runInNewContext('responsiveMovementVector(.03)',movementSandbox);
 if(!vector||vector.x>=0||Math.hypot(vector.x,vector.y)>1.0001)fail.push('movement response does not change direction promptly within the unit-speed cap');
 movementSandbox.keys={};for(let i=0;i<8;i++)vector=vm.runInNewContext('responsiveMovementVector(.03)',movementSandbox);
 if(vector!==null||vm.runInNewContext('Math.hypot(movementResponse.x,movementResponse.y)',movementSandbox)!==0)fail.push('movement response does not settle exactly to zero after release');
 movementSandbox.v20Joy={active:true,dx:.56,dy:0,id:7};vm.runInNewContext('resetMovementResponse()',movementSandbox);vector=vm.runInNewContext('responsiveMovementVector(.3)',movementSandbox);
 if(!vector||Math.abs(vector.x-.5)>.0001||vector.y!==0)fail.push('movement response changes the established joystick analog magnitude');
}catch(error){
 fail.push('continuous movement runtime test throws: '+error.message);
}

try{
 const dossierStart=engine.indexOf('function setBattleDossierOpen('),dossierEnd=engine.indexOf('function v32InteractiveKeyTarget(');
 if(dossierStart<0||dossierEnd<0)throw new Error('battle dossier controller is missing');
 const attrs={},stage={classList:testClassList()},dossier={setAttribute:(name,value)=>attrs[name]=value},label={textContent:''},toggle={getAttribute:name=>attrs[name]??'false',setAttribute:(name,value)=>attrs[name]=value};
 const dossierSandbox={document:{getElementById:id=>id==='battleStage'?stage:id==='battleDossier'?dossier:id==='battleDossierToggle'?toggle:id==='battleDossierToggleText'?label:null}};
 vm.runInNewContext(engine.slice(dossierStart,dossierEnd),dossierSandbox);
 if(vm.runInNewContext('setBattleDossierOpen(true)',dossierSandbox)!==true||!stage.classList.contains('dossierOpen')||attrs['aria-expanded']!=='true'||attrs['aria-hidden']!=='false'||label.textContent!=='收起卷宗')fail.push('battle dossier does not open with synchronized visible and accessibility state');
 if(vm.runInNewContext('toggleBattleDossier()',dossierSandbox)!==false||stage.classList.contains('dossierOpen')||attrs['aria-expanded']!=='false'||attrs['aria-hidden']!=='true'||label.textContent!=='展开卷宗')fail.push('battle dossier does not close without changing gameplay state');
}catch(error){
 fail.push('battle dossier runtime test throws: '+error.message);
}

try{
 const focusStart=saveSlots.indexOf('const v331ActionPointers=new Map()'),focusEnd=saveSlots.indexOf('function initMobileControls(');
 if(focusStart<0||focusEnd<0)throw new Error('focus-loss input helpers are missing');
 const releasedPointers=[],pressed=new Set(['joystick','mobileSkill']);
 const inputElement=(id,captured)=>({
  classList:{remove:value=>pressed.delete(id)},
  hasPointerCapture:pointerId=>pointerId===captured,
  releasePointerCapture:pointerId=>releasedPointers.push([id,pointerId])
 });
 const joystickZone=inputElement('joystickZone',7),joystickBase=inputElement('joystick',null),joystickKnob={style:{transform:'translate(20px,0)'}},mobileSkill=inputElement('mobileSkill',8);
 let pauseCalls=0,responseResets=0;
 const focusSandbox={
  keys:{w:true,d:true},v20Joy:{active:true,dx:.8,dy:.2,id:7},run:{active:true,paused:false},blocked:false,
  document:{
   getElementById:id=>id==='mobileMoveZone'?joystickZone:id==='joystickBase'?joystickBase:id==='joystickKnob'?joystickKnob:id==='mobileSkill'?mobileSkill:null,
   querySelectorAll:selector=>selector==='#mobileControls .pressed'?[joystickBase,mobileSkill]:[]
  },
  togglePause(){pauseCalls++;focusSandbox.run.paused=true},resetMovementResponse(){responseResets++},
  v30BlockingOpen:()=>focusSandbox.blocked
 };
 vm.runInNewContext(saveSlots.slice(focusStart,focusEnd),focusSandbox);
 vm.runInNewContext("v331ActionPointers.set('mobileSkill',8);v331HandleFocusLoss()",focusSandbox);
 if(Object.values(focusSandbox.keys).some(Boolean)||focusSandbox.v20Joy.active||focusSandbox.v20Joy.dx||focusSandbox.v20Joy.dy||focusSandbox.v20Joy.id!==null||responseResets!==1)fail.push('focus loss leaves keyboard, joystick, or movement response active');
 if(pressed.size||joystickKnob.style.transform!=='translate(0,0)'||vm.runInNewContext('v331ActionPointers.size',focusSandbox)!==0||releasedPointers.length!==2)fail.push('focus loss leaves a captured or pressed mobile control active');
 if(pauseCalls!==1||!focusSandbox.run.paused)fail.push('focus loss does not safely pause an active unblocked run');
 focusSandbox.keys.a=true;focusSandbox.v20Joy={active:true,dx:-.5,dy:0,id:9};focusSandbox.run.paused=false;focusSandbox.blocked=true;
 vm.runInNewContext('v331HandleFocusLoss()',focusSandbox);
 if(focusSandbox.keys.a||focusSandbox.v20Joy.active||responseResets!==2||pauseCalls!==1)fail.push('blocked focus loss does not clear movement response or incorrectly toggles pause');
}catch(error){
 fail.push('focus-loss input runtime test throws: '+error.message);
}

try{
 const onboardingKeys=['move','skill','dodge','ult','interact','pause'];
 const makeClassList=()=>{const values=new Set();return{toggle:(name,on)=>on?values.add(name):values.delete(name),add:name=>values.add(name),remove:name=>values.delete(name),contains:name=>values.has(name)}};
 const steps=onboardingKeys.map(action=>({dataset:{onboardingStep:action},classList:makeClassList(),setAttribute(){}}));
 const tip={classList:makeClassList(),querySelectorAll:selector=>selector==='[data-onboarding-step]'?steps:[]};
 const count={textContent:''};
 const tutorialOverlay={classList:makeClassList()};
 const onboardingSandbox={
  run:{active:true,paused:false},player:{x:20,y:30,skillCd:0,dodgeCd:0,ult:0},save:{settings:{tutorialSeen:false}},TUTORIAL:[['移动','测试']],tutorialStep:0,persistCalls:0,opened:[],
  document:{getElementById:id=>id==='v30OnboardingTip'?tip:id==='battleOnboardingCount'?count:id==='tutorialOverlay'?tutorialOverlay:null},
  persist(){onboardingSandbox.persistCalls++},v32OpenLayer:id=>onboardingSandbox.opened.push(id),v32CloseLayer:()=>{}
 };
 vm.runInNewContext(tutorialSettings,onboardingSandbox);
 vm.runInNewContext('showTutorial()',onboardingSandbox);
 if(onboardingSandbox.run.paused||onboardingSandbox.opened.length||!tip.classList.contains('show')||count.textContent!=='0/6')fail.push('first-battle checklist pauses play, opens the legacy tutorial, or does not render six pending actions');
 vm.runInNewContext("performBattleAction('skill',()=>{});performBattleAction('dodge',()=>{});performBattleAction('ult',()=>{});performBattleAction('interact',()=>{});performBattleAction('pause',()=>{});performBattleAction('move',()=>{})",onboardingSandbox);
 if(Object.keys(onboardingSandbox.run.onboarding.completed).length)fail.push('failed live actions advance battle onboarding');
 onboardingSandbox.player.ult=100;onboardingSandbox.run.v25={used:0};
 vm.runInNewContext("performBattleAction('ult',()=>player.ult=0);performBattleAction('interact',()=>run.v25.used++);performBattleAction('dodge',()=>player.x+=40);performBattleAction('move',()=>player.y+=2);performBattleAction('skill',()=>player.skillCd=6)",onboardingSandbox);
 if(Object.keys(onboardingSandbox.run.onboarding.completed).join(',')!=='ult,interact,dodge,move,skill'||onboardingSandbox.persistCalls)fail.push('successful battle actions do not advance freely and exactly once before completion');
 vm.runInNewContext("performBattleAction('skill',()=>player.skillCd=9);performBattleAction('pause',()=>run.paused=true)",onboardingSandbox);
 if(Object.keys(onboardingSandbox.run.onboarding.completed).length!==6||!onboardingSandbox.save.settings.tutorialSeen||onboardingSandbox.persistCalls!==1||onboardingSandbox.run.onboarding.active)fail.push('six successful actions do not complete onboarding once through tutorialSeen');
 onboardingSandbox.run={active:true,paused:false};onboardingSandbox.player={x:20,y:30,skillCd:0,dodgeCd:0,ult:0};onboardingSandbox.save.settings.tutorialSeen=false;onboardingSandbox.persistCalls=0;
 vm.runInNewContext('showTutorial();skipTutorial()',onboardingSandbox);
 if(!onboardingSandbox.save.settings.tutorialSeen||onboardingSandbox.persistCalls!==1||onboardingSandbox.run.paused||onboardingSandbox.run.onboarding.active||Object.keys(onboardingSandbox.save.settings).join(',')!=='tutorialSeen')fail.push('dismissal does not persist only the existing tutorialSeen boolean without pausing');
}catch(error){
 fail.push('battle onboarding runtime test throws: '+error.message);
}

try{
 let focused='';
 class TestElement{
  constructor(id,visible=true){this.id=id;this.visible=visible;this.isConnected=true;this.classList={add(){},remove(){}}}
  getClientRects(){return this.visible?[{}]:[]}
  focus(){focused=this.id}
  querySelector(){return null}
 }
 const pauseOverlay=new TestElement('pauseOverlay'),desktopPause=new TestElement('desktopPause',false),mobilePause=new TestElement('mobilePause',true),arenaCanvas=new TestElement('arenaCanvas',true),body=new TestElement('body');
 const focusRestoreSandbox={HTMLElement:TestElement,requestAnimationFrame:fn=>fn(),document:{activeElement:body,body,getElementById:id=>id==='pauseOverlay'?pauseOverlay:id==='mobilePause'?mobilePause:id==='arenaCanvas'?arenaCanvas:null,querySelector:selector=>selector==='[data-battle-pause]'?desktopPause:null}};
 const layerRuntime=saveSlots.slice(saveSlots.indexOf('const v32FocusOrigins=new Map()'),saveSlots.indexOf('function openSaveManager('));
 vm.runInNewContext(layerRuntime,focusRestoreSandbox);vm.runInNewContext("v32CloseLayer('pauseOverlay')",focusRestoreSandbox);
 if(focused!=='mobilePause')fail.push('pause close without origin does not restore the visible mobile pause control');
 focused='';desktopPause.visible=true;mobilePause.visible=false;vm.runInNewContext("v32CloseLayer('pauseOverlay')",focusRestoreSandbox);
 if(focused!=='desktopPause')fail.push('pause close without origin does not prefer the visible desktop pause control');
}catch(error){
 fail.push('pause fallback focus runtime test throws: '+error.message);
}

if(!director.includes('function v19WavePlan(){ return v19StoryEncounter()?.waves||V19_WAVES; }')||!director.includes('(encounter?.elite||1)')||!director.includes('baseBurst*(encounter?.horde||1)'))fail.push('Director does not consume Story waves, elite pressure, and horde pressure');
if(!director.includes('if(!v19StoryEncounter()){')||!director.includes("if(!encounter&&w.type==='boss'"))fail.push('legacy event, chest, or Boss milestones are not isolated away from Story encounters');
if(!engine.includes("const profile=run?.v29?.id==='story'?run.v29.rule?.storyEncounter:null")||!engine.includes('profile?.eventPool?.length')||!engine.includes('hazard.type===\'fireline\'')||!engine.includes("hazard.type==='fog'")||!engine.includes("hazard.type==='blast'"))fail.push('enemy, event, or three hazard runtime consumers are missing');
if(!gameModes.includes('encounterEvidence:evidence')||!gameModes.includes('v29FirstCampaignMilestone(encounter.eventAt,run.events,showEvent)')||!engine.includes('Array.isArray(rule?.storyEncounter?.chestAt)?rule.storyEncounter.chestAt.filter')||/v29FirstCampaignMilestone\([^\n;]*chestAt[^\n;]*showChest/.test(gameModesCode)||!gameModes.includes('lastResult.encounterEvidence=JSON.parse(JSON.stringify(run.v29.encounterEvidence))'))fail.push('encounter event scheduling, active timed rewards or executed-result evidence is incomplete');
if(!worldUi.includes("selectedEncounter.name+' · '+selectedEncounter.hazard.name")||!bossInteractions.includes("encounter.name+' · '+encounter.hazard.name")||!gameModes.includes('<span>实际节奏</span>')||!gameModes.includes('<span>场地机制</span>')||!director.includes("log('怪潮升级 → '+w.name)"))fail.push('map, route preview, battle log, or result evidence is detached from encounter identity');
storySandbox.save.chapters.ST001.stars={'ST001-01':3,'ST001-02':3,'ST001-03':2,'ST001-04':0,'NOT-A-STAGE':3};
if(storySandbox.chapterStars('ST001')!==8)fail.push('chapter stars include unknown save keys');
if(storySandbox.storyStageUnlocked('ST003-01'))fail.push('8 stars can still skip the final stage of a chapter');
storySandbox.save.chapters.ST001.stars['ST001-04']=2;
if(!storySandbox.storyStageUnlocked('ST003-01'))fail.push('completed chapter does not unlock the intended next stage');
if(storySandbox.storyStarAward(false,100,100)!==0||storySandbox.storyStarAward(true,55,100)!==2||storySandbox.storyStarAward(true,56,100)!==3)fail.push('Story defeat or HP star thresholds changed');
storySandbox.save.chapters.ST001.stars['ST001-01']=3;
if(storySandbox.storyBestStars('ST001-01',2)!==3)fail.push('Story replay can lower an earned star record');
if(!gameModes.includes("curve=WW.config.storyCurve?.[save.selectedStage]||null")||!gameModes.includes("...(curve||{}),duration:contract.duration")||!gameModes.includes("storyContract:contract,storyEncounter:encounter,storyCurve:curve"))fail.push('Story runtime rule does not read the selected stage contract, encounter, and pressure curve');
if(!gameModes.includes("if(save.mode==='story'&&!storyStageUnlocked(save.selectedStage)){toast('前置关卡未完成');go('world');return}"))fail.push('Story battle entry does not enforce the strict stage prerequisite');
if(!gameModes.includes("if(contract?.bosses.length&&r.bossAt!=null&&run.time>=r.bossAt&&!run.boss&&!run.bossDefeated)v29SpawnBossId(v29BossForStage())"))fail.push('Story runtime can spawn a Boss outside the stage Boss contract');
if(!gameModes.includes("return bosses[bosses.length-1]||stage[4]||'B001'"))fail.push('Story Boss proxy no longer selects the terminal configured Boss');
if(!stability.includes("save.selectedStage==='ST004-03'")||!stability.includes("old=save.selectedStage;save.selectedStage='ST004-01';_v30SpawnBoss();save.selectedStage=old")||!stability.includes('if(run.boss&&run.v29)run.v29.lastBossSeen=run.boss.id'))fail.push('ST004-03 dual-Boss proxy or accounting changed');
if(!gameModes.includes("if(lastResult.modeId!=='story')document.getElementById('resultTitle').textContent="))fail.push('Story result title can be overwritten by the generic mode title');
if(!gameModes.includes("r.storyContract?.bosses.length&&storyBossGoalComplete(r.storyContract)"))fail.push('ordinary Story stages can report the Boss objective complete at battle start');
if(!gameModes.includes("(rule.firstCampaign?rule.desc:rule.target)+' · '+encounter.hazard.name")||!gameModes.includes("target=r.target||('坚持 '")||!gameModes.includes("v29EncounterSchedule(r.storyEncounter,r.storyContract)")||!gameModes.includes("storyStageSuccess(save.selectedStage):storyStageTimeout(save.selectedStage)"))fail.push('Story loading, battle objective, timeline, or settlement copy is detached from the stage contract');
if(!director.includes('lastResult.directorGoldDelta=tuned-base')||!director.includes('难度/表现金币'))fail.push('result reward breakdown does not explain the existing difficulty/performance adjustment');
if(!bossInteractions.includes("showBossPhase=!lastResult.storyReward||(storyStageContract(lastResult.stage?.[0])?.bosses.length||0)>0"))fail.push('ordinary Story results still present a placeholder Boss phase');
for(const source of [engine,director])if(!source.includes("if(run.time>=20*60&&(save.mode||'story')!=='story')"))fail.push('legacy 20-minute settlement is not isolated away from Story while remaining available to non-Story modes');
if(!/story:\{[^\r\n]*duration:1200/.test(modeConfigBlock))fail.push('later Story duration is no longer 1200 seconds');
if(!gameModes.includes("function v29IsFirstCampaign(id=save.mode,stage=save.selectedStage){return id==='story'&&stage===WW.config.gameModes.firstCampaign.stage}"))fail.push('first campaign is not isolated to Story ST001-01');
if(!gameModes.includes("if(v29IsFirstCampaign(id)){base={...base,...WW.config.gameModes.firstCampaign,firstCampaign:true}}"))fail.push('first campaign pacing no longer merges only through the isolated rule');
if(!gameModes.includes('e.hp*=r.hp;e.maxHp*=r.hp;e.damage*=r.dmg;e.speed*=r.speed'))fail.push('first campaign enemy pacing does not use the existing mode rule');
if(!gameModes.includes('bossHp=r.bossHp??r.hp;run.boss.hp*=bossHp;run.boss.maxHp*=bossHp'))fail.push('Boss HP no longer uses a distinct first-campaign multiplier');
if(!gameModes.includes("const _v29HurtPlayer=hurtPlayer;hurtPlayer=function(dmg){let r=run?.v29?.rule;if(Number.isFinite(r?.incoming))dmg*=r.incoming;_v29HurtPlayer(dmg)}"))fail.push('Story incoming-damage curve is missing or can leak without a finite contract');
if(!gameModes.includes("if(run.time>=r.duration)return finishRun(false,'首战时限到达 · 黄巾巨将未击败')"))fail.push('first campaign timeout no longer settles as defeat');
if(!gameModes.includes("bossLoot=run.drops?.some(drop=>drop.source==='boss')")||!gameModes.includes("if(v29FirstCampaignLootResolved()){")||!gameModes.includes("return finishRun(true,'黄巾巨将已击败 · Boss战利品已领取并归档')")||!gameModes.includes('if(run.bossDefeated&&run.v26BossLootShown===true)return;'))fail.push('first campaign victory no longer requires a real Boss drop before guarded settlement');
if(!gameModes.includes('function v29FirstCampaignPhase()')||!gameModes.includes("id:'advance'")||!gameModes.includes("id:'boss-warning'")||!gameModes.includes("id:'boss-fight'")||!gameModes.includes("id:'loot-opening'")||!gameModes.includes("id:'loot-choice'")||!gameModes.includes("id:'loot-confirmed'")||!gameModes.includes("id:'settling'"))fail.push('first campaign lacks an explicit player-visible phase loop');
if(!gameModes.includes('run.v29.lootResolvedAt=run.time')||!gameModes.includes('run.time-run.v29.lootResolvedAt<.75')||!gameModes.includes("hint('Boss战利品已确认 · 正在封存战果')"))fail.push('first campaign does not visibly confirm loot before guarded settlement');
if(!html.includes('id="v29CampaignPhase"')||!html.includes('id="v29CampaignCue"')||!html.includes('id="v26LootSummary"'))fail.push('desktop, phone, or Boss-loot first-campaign status anchors are missing');
if(!gearSystem.includes("选择一件装备后将立即完成首战目标并进入结算")||!gearSystem.includes('v29BattleUI()'))fail.push('Boss loot choice does not explain or refresh the first-campaign settlement handoff');
if(!resultUi.includes('Boss战利品')||!resultUi.includes('已归档'))fail.push('result ledger does not identify the archived Boss reward');
if(!campaignRoute?.checks.firstCampaignPhaseSequence||!campaignRoute?.checks.firstCampaignLootDelay)fail.push('isolated first-campaign phase or delayed-loot settlement evidence is incomplete');
if(!heroIdentity.includes('function v23AutoTarget(){return v338FirstBossTarget(nearest(),run.boss)}')||!heroIdentity.includes('let h=save.hero,t=v23AutoTarget();'))fail.push('hero auto-attacks no longer use scoped active-Boss targeting');
if(!heroIdentity.includes("if(t===run.boss)damageBoss(player.atk*.72,'H002_CHAIN');else v23Chain"))fail.push('H002 Boss chain damage is routed through normal-enemy accounting');
if(!html.includes('id="homeCampaignLabel"')||!html.includes('id="homeCampaignTime"')||!html.includes('id="battleSchedule"'))fail.push('first campaign player-facing copy anchors are missing');
if(!gameModes.includes("document.getElementById('v29CurrentDesc').textContent=r.desc")||!gameModes.includes("document.getElementById('missionTargetText').textContent=r.target||r.desc")||!gameModes.includes('(rule.firstCampaign?rule.desc:rule.target)')||!gameModes.includes('):rule.desc;'))fail.push('mission board or loading copy does not use the active first-campaign rule');
if(!gameModes.includes('首战保护已启用')||!gameModes.includes("tags:['6分钟首战','首战保护','Boss战利品']")||!gameModes.includes("schedule.textContent=r.firstCampaign?'首战保护 ·"))fail.push('first campaign protection is not explained in loading and battle copy');
if(!gameModes.includes('<span>压力节拍</span>')||!gameModes.includes("r.storyCurve.beat+' · '+r.storyCurve.budget.toFixed(2)"))fail.push('Story pressure beat is not visible in the battle objective');
if(!campaignRoute?.ok)fail.push('isolated campaign route failed: '+(campaignRoute?.failures||[]).join('; '));
if(!campaignRoute?.checks.initialEntry||!campaignRoute?.checks.finalUnlock||!campaignRoute?.checks.allStageEntries||!campaignRoute?.checks.routeMonotonic)fail.push('campaign route entry, unlock, or monotonic progression evidence is incomplete');
if(!campaignRoute?.checks.dualBossPhase1Rejected||!campaignRoute?.checks.dualBossPhase2Accepted||!campaignRoute?.checks.bossMargins)fail.push('campaign normal/single/dual-Boss completion evidence is incomplete');
if(!campaignRoute?.checks.replayMonotonic||!campaignRoute?.route.every(attempt=>attempt.settlements===1&&attempt.baseSettlements===1))fail.push('campaign replay or one-settlement evidence failed');
if(!campaignRoute?.checks.growthAttainable||!campaignRoute?.checks.nonStoryIsolation||campaignRoute?.curve.length!==12)fail.push('campaign pressure, attainable growth, or non-Story isolation evidence failed');
if(engine.includes('5/10/15分钟宝箱可触发进化或融合'))fail.push('tutorial still promises the legacy fixed chest schedule');
if(!gameModes.includes("if(id!=='story'||!victory){"))fail.push('non-story star isolation guard missing');
if(!gameModes.includes("lastResult.modeId==='story'?"))fail.push('non-story result star isolation missing');
for(const state of ['save','run','player','enemies','shots'])if(new RegExp(`window\\.WW(?:\\.config)?\\.${state}\\b`).test(code))fail.push(`runtime state exposed through WW: ${state}`);
for(const s of ['V30_SCHEMA','WW.config.mode','WW.config.gearSystem.catalog','WW.config.runePetSystem.runes','V28_TALENTS'])if(!code.includes(s))fail.push(`missing ${s}`);
if(code.includes('player.speed*=.997'))fail.push('permanent aura slow regression');
if(!code.includes("e.key.toLowerCase()==='q'"))fail.push('Q alias missing');
if(!code.includes('run.v30.finalizing'))fail.push('settlement guard missing');
if(!saveSlots.includes('const v331ActionPointers=new Map()')||!saveSlots.includes('v331ActionPointers.has(id)')||!saveSlots.includes("v331ActionPointers.get(id)!==e.pointerId"))fail.push('mobile action buttons lack independent pointer ownership');
if(!saveSlots.includes("button.addEventListener('pointercancel',releasePointer)")||!saveSlots.includes("button.addEventListener('lostpointercapture',releasePointer)"))fail.push('mobile actions do not recover from cancelled or lost pointers');
if(!saveSlots.includes('function v331ClearInputs()')||!saveSlots.includes('Object.keys(keys).forEach(key=>keys[key]=false)')||!saveSlots.includes("document.querySelectorAll('#mobileControls .pressed')"))fail.push('focus-loss input clearing is incomplete');
if(!saveSlots.includes("window.addEventListener('blur',v331HandleFocusLoss)")||!saveSlots.includes("document.addEventListener('visibilitychange'")||!saveSlots.includes("run?.active&&!run.paused")||!saveSlots.includes("v30BlockingOpen"))fail.push('background focus loss does not safely pause an unblocked run');
if(!engine.includes('nextH=Math.max(240,r.height)')||!engine.includes("window.visualViewport?.addEventListener('resize',v331QueueArenaResize)")||!engine.includes("window.addEventListener('orientationchange'"))fail.push('short landscape or rotation arena remap support is missing');
if(!renderSaveCardsBlock.includes("runCount=s.data.stats&&typeof s.data.stats==='object'&&!Array.isArray(s.data.stats)&&Number.isFinite(s.data.stats.runs)?s.data.stats.runs:DEFAULT_SAVE.stats.runs"))fail.push('save cards do not use the slot-local finite total-runs value with display-only default fallback');
if(!renderSaveCardsBlock.includes("killCount=s.data.stats&&typeof s.data.stats==='object'&&!Array.isArray(s.data.stats)&&Number.isFinite(s.data.stats.kills)?s.data.stats.kills:DEFAULT_SAVE.stats.kills"))fail.push('save cards do not use the slot-local finite total-kills value with display-only default fallback');
if(!renderSaveCardsBlock.includes("bossKillCount=s.data.stats&&typeof s.data.stats==='object'&&!Array.isArray(s.data.stats)&&Number.isFinite(s.data.stats.bossKills)?s.data.stats.bossKills:DEFAULT_SAVE.stats.bossKills"))fail.push('save cards do not use the slot-local finite Boss-kills value with display-only default fallback');
if(!renderSaveCardsBlock.includes('accountXp=Number.isFinite(s.data.accountXp)?s.data.accountXp:0'))fail.push('save cards do not use the slot-local finite account-XP value with display-only zero fallback');
if(!renderSaveCardsBlock.includes("'<br>账号经验 '+accountXp+' XP<br>英雄 '"))fail.push('save-card account-XP row is not between account level and hero');
if((renderSaveCardsBlock.match(/账号经验/g)||[]).length!==1)fail.push('save-card account-XP row is missing or duplicated in the renderer');
if(/\bsave\.accountXp\b|v28Ensure|v30NormalizeSave|(?:s\.data|save)\.accountXp\s*=|localStorage|saveV20Slots|snapshotActiveSlot|\bpersist\s*\(|\bmerge\s*\(/.test(renderSaveCardsBlock))fail.push('save-card account-XP display reads active data, normalizes, migrates, or writes a save');
if(!renderSaveCardsBlock.includes("'<br>天赋点 '+(s.data.talentPoints??0)+'<br>总挑战次数 '+runCount+'<br>总击杀数 '+killCount+'<br>Boss击杀数 '+bossKillCount+'<br>最近访问 '"))fail.push('save-card run, kill and Boss-kill rows are not between talent points and recent access');
if((renderSaveCardsBlock.match(/总挑战次数/g)||[]).length!==1)fail.push('save-card total-runs row is missing or duplicated in the renderer');
if((renderSaveCardsBlock.match(/总击杀数/g)||[]).length!==1)fail.push('save-card total-kills row is missing or duplicated in the renderer');
if((renderSaveCardsBlock.match(/Boss击杀数/g)||[]).length!==1)fail.push('save-card Boss-kills row is missing or duplicated in the renderer');
if(/\bsave\.stats\.(?:runs|kills|bossKills)\b|modeStats|v30NormalizeSave/.test(renderSaveCardsBlock))fail.push('save-card totals display reads active or aggregated data, or normalizes a save');
if(!renderSaveCardsBlock.includes('accountLv=Number.isFinite(s.data.accountLv)?s.data.accountLv:1'))fail.push('save cards do not use the slot-local finite account-level value with display-only one fallback');
if(!renderSaveCardsBlock.includes("<p>账号 Lv.'+accountLv+'<br>账号经验 "))fail.push('save-card account-level row does not render the safe slot-local value before account XP');
if(/\bsave\.accountLv\b|v28Ensure|v30NormalizeSave|(?:s\.data|save)\.accountLv\s*=|localStorage|saveV20Slots|snapshotActiveSlot|\bpersist\s*\(|\bmerge\s*\(/.test(renderSaveCardsBlock))fail.push('save-card account-level display reads active data, normalizes, migrates, or writes a save');
if((html.match(/<button type="button" class="mobileAction/g)||[]).length!==4||!html.includes('<button type="button" class="mobilePause" id="mobilePause"'))fail.push('mobile combat actions are not four semantic buttons plus pause');
if(/ontouch(?:start|move|end|cancel)=/.test(html)||/touch(?:start|move|end|cancel)/.test(saveSlotsCode))fail.push('legacy touch-only mobile controls remain');
if(!saveSlotsCode.includes("zone.addEventListener('pointerdown'")||!saveSlotsCode.includes("zone.addEventListener('pointermove'")||!saveSlotsCode.includes("zone.addEventListener('pointercancel'")||!saveSlotsCode.includes('zone.setPointerCapture(e.pointerId)'))fail.push('floating joystick does not use captured Pointer Events on the movement zone');
if(!saveSlotsCode.includes('(Math.min(r.width,r.height)-Math.min(k.width,k.height))/2'))fail.push('joystick radius is not derived from rendered control size');
if(!engineCode.includes("typeof v331JoystickVector==='function'?v331JoystickVector():null")||!directorCode.includes('const move=responsiveMovementVector(dt);if(move){')||!saveSlotsCode.includes('function v331JoystickVector()')||/keys\.d=v20Joy|keys\.a=v20Joy|keys\.s=v20Joy|keys\.w=v20Joy/.test(saveSlotsCode))fail.push('active movement path does not share the continuous keyboard and analog joystick vector');
if(!saveSlotsCode.includes("['mobileSkill','skill',castHeroSkill]")||!saveSlotsCode.includes("['mobileDodge','dodge',tryDodge]")||!saveSlotsCode.includes("['mobileUlt','ult',castUltimate]")||!saveSlotsCode.includes("['mobileInteract','interact',v25UseInteractable]")||!saveSlotsCode.includes("['mobilePause','pause',togglePause]"))fail.push('mobile actions are not bound once to onboarding-aware gameplay functions');
if(!engineCode.includes("setMobileActionState('mobileSkill'")||!engineCode.includes("setMobileActionState('mobileDodge'")||!engineCode.includes("setMobileActionState('mobileUlt'")||!engineCode.includes("setMobileActionState('mobileInteract'"))fail.push('mobile cooldown, ultimate and interaction states are not HUD-driven');
if(engineCode.includes('function remapArenaPoint(')||/points\.forEach\(o=>remapArenaPoint/.test(engineCode)||!engineCode.includes('ensureBattleWorld();clampBattleCamera()'))fail.push('arena resize still remaps entities instead of preserving world coordinates and reclamping the camera');
if(!engineCode.includes('WORLD_W=Math.max(BATTLE_WORLD_MIN_W,Math.ceil(AW*BATTLE_WORLD_VIEW_SCALE))')||!engineCode.includes('WORLD_H=Math.max(BATTLE_WORLD_MIN_H,Math.ceil(AH*BATTLE_WORLD_VIEW_SCALE))')||!engineCode.includes('function updateBattleCamera(dt,instant=false)'))fail.push('battle world dimensions or smooth follow camera contract is missing');
if(!engineCode.includes('player.x=Math.max(18,Math.min(WORLD_W-18')||!directorCode.includes('player.x=Math.max(18,Math.min(WORLD_W-18'))fail.push('normal movement is still clamped to the viewport instead of the world');
if(!resultCode.includes('drawBattleFrame(dt)')||resultCode.includes('updateRun(dt);drawRun();')||!engineCode.includes('ctx.translate(-battleCamera.x,-battleCamera.y);drawRun()'))fail.push('complete ordered draw chain is not wrapped by the shared camera transform');
if(!qualityPresentationCode.includes('ctx.fillRect(0,0,WORLD_W,WORLD_H)')||!bossInteractionsCode.includes('ctx.rect(0,0,WORLD_W,WORLD_H)')||!skillFormsCode.includes('p.x>WORLD_W+100'))fail.push('world background, Boss overlays, or skill projectiles still use viewport bounds');
if(!shellCode.includes("document.body.classList.toggle('mobileBattle',battle)"))fail.push('mobile battle layout state is not owned by ui-shell synchronization');
if(!css.includes('env(safe-area-inset-left)')||!css.includes('env(safe-area-inset-right)')||!css.includes('env(safe-area-inset-bottom)')||!css.includes('@media(max-width:900px) and (max-height:540px)'))fail.push('mobile controls lack safe-area or short-landscape coverage');
if(!css.includes('body.mobileBattle .sidebar,body.mobileBattle .topbar')||!css.includes('body.mobileBattle #arenaCanvas{width:100%;height:100%')||!css.includes('.mobilePause{top:')||!css.includes('width:44px;height:44px'))fail.push('mobile battle does not prioritize a full-viewport arena with a 44px pause target');
const onboardingActions=['move','skill','dodge','ult','interact','pause'];
if(!battleBlock.includes('id="v30OnboardingTip" role="status" aria-live="polite"')||!battleBlock.includes('id="battleOnboardingCount"')||!battleBlock.includes('data-onboarding-dismiss')||!onboardingActions.every(action=>(battleBlock.match(new RegExp(`data-onboarding-step="${action}"`,'g'))||[]).length===1))fail.push('battle onboarding does not expose one dismissible six-action live checklist');
if(!battleBlock.includes('id="arenaCanvas" tabindex="-1"')||!css.includes('.onboardingTip{')||!css.includes('.onboardingDismiss{')||!css.includes('pointer-events:auto')||!css.includes('grid-template-columns:repeat(3,minmax(0,1fr))')||!css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'))fail.push('battle onboarding lacks non-blocking desktop/mobile presentation or Arena focus fallback');
if(!startBattleBlock.includes("if(!save.settings.tutorialSeen)showTutorial()")||/run\.paused\s*=\s*true|v32OpenLayer\(['\"]tutorialOverlay/.test(startBattleBlock)||!/run\.onboarding=\{active:true,completed:\{\}\}/.test(tutorialSettings))fail.push('first battle does not initialize a non-blocking run-local checklist');
if(!tutorialSettings.includes("const BATTLE_ONBOARDING_STEPS=['move','skill','dodge','ult','interact','pause']")||!tutorialSettings.includes('function performBattleAction(action,fn)')||!tutorialSettings.includes('function recordBattleOnboarding(action)')||!tutorialSettings.includes('function completeBattleOnboarding()')||!tutorialSettings.includes('save.settings.tutorialSeen=true;persist()'))fail.push('battle onboarding lifecycle or existing persistence path is missing');
if(!engineCode.includes("performBattleAction('skill',castHeroSkill)")||!engineCode.includes("performBattleAction('dodge',tryDodge)")||!engineCode.includes("performBattleAction('ult',castUltimate)")||!engineCode.includes("performBattleAction('pause',togglePause)")||!directorCode.includes("recordBattleOnboarding('move')")||!bossInteractionsCode.includes("recordBattleOnboarding('interact')"))fail.push('keyboard, movement or interaction success paths do not share onboarding progress');
if(!saveSlotsCode.includes('performBattleAction(action,fn)')||!battleBlock.includes("onclick=\"performBattleAction('skill',castHeroSkill)\"")||!battleBlock.includes("onclick=\"performBattleAction('dodge',tryDodge)\"")||!battleBlock.includes("onclick=\"performBattleAction('ult',castUltimate)\"")||!battleBlock.includes("onclick=\"performBattleAction('pause',togglePause)\""))fail.push('desktop and mobile battle controls do not share successful-action onboarding');
if(stabilityCode.includes('lastOnboarding')||/run\.time<12|run\.time<24|run\.time<36|run\.time<48|run\.time<60/.test(stabilityCode)||!stabilityCode.includes('function v30Onboarding(){')||!stabilityCode.includes('renderBattleOnboarding'))fail.push('legacy time-rotated onboarding remains active');
if(!saveSlotsCode.includes("el.id==='pauseOverlay'")||!saveSlotsCode.includes("document.querySelector('[data-battle-pause]')")||!saveSlotsCode.includes("document.getElementById('mobilePause')")||!saveSlotsCode.includes("document.getElementById('arenaCanvas')")||!saveSlotsCode.includes('getClientRects().length'))fail.push('pause close lacks a visible battle focus fallback');
if(!navBlock.includes('<nav class="nav" aria-label="游戏主导航">')||(navBlock.match(/<button type="button"[^>]*data-page=/g)||[]).length!==9||!navBlock.includes('id="navMore" aria-expanded="false" aria-controls="mobileNavPanel"'))fail.push('main navigation is not semantic nine-page navigation with an accessible More control');
if((mobileNavPanelBlock.match(/data-page=/g)||[]).length!==5||tierIds('secondary').length!==3||tierIds('flow').length!==2||!navBlock.includes('data-page="home" data-nav-tier="primary" aria-current="page"'))fail.push('mobile navigation does not keep four primary, three secondary and two hidden flow-only destinations');
if(!css.includes('.nav button[data-nav-tier="flow"]{display:none!important}')||!css.includes('body.shellBattle .sidebar,body.shellBattle .topbar{display:none}')||!css.includes('body.shellBattle .app{display:block'))fail.push('flow-only navigation hiding or desktop battle shell collapse CSS is missing');
if(!css.includes('.mobileNavPanel{display:contents}')||!css.includes('grid-template-columns:repeat(5,minmax(0,1fr))')||!css.includes('height:calc(64px + env(safe-area-inset-bottom))')||!css.includes('overflow:visible')||!css.includes('.mobileNavPanel.open{display:grid}')||!css.includes('min-height:44px'))fail.push('phone navigation is not a non-scrolling safe-area five-column bottom row');
if(!css.includes('.tleft small,.pillSecondary{display:none}')||!css.includes('.nexusScene{grid-template-columns:minmax(0,1fr)}')||!css.includes('.nexusCommand{position:fixed')||!css.includes('bottom:calc(72px + env(safe-area-inset-bottom))')||!css.includes('padding-bottom:calc(152px + env(safe-area-inset-bottom))'))fail.push('phone scene lobby does not keep its compact shell and primary mission action above the fixed navigation');
if(!openingTag('heroes').includes('class="page"')||!html.includes('<section class="page" id="growth">')||!openingTag('loadout').includes('class="page"')||!html.includes('<section class="page" id="build">')||!css.includes('V3.2.34 MOBILE PROGRESSION PAGES')||!css.includes('#heroes,#growth,#loadout,#build{min-width:0;overflow-wrap:anywhere}'))fail.push('mobile progression pages do not have scoped overflow containment');
if(!css.includes('#heroes .heroGrid,#growth .metaHeroHeader,#loadout .loadoutLayout,#build .buildLayout{grid-template-columns:minmax(0,1fr)}')||!css.includes('#growth .growthTabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}')||!css.includes('#build .buildSlots{grid-template-columns:repeat(2,minmax(0,1fr))')||!css.includes('#build .skillPickGrid{grid-template-columns:repeat(2,minmax(0,1fr))'))fail.push('phone Heroes, Growth or Build grids are not fitted to one or two columns');
if(!css.includes('#heroes .actions .btn,#growth .actions .btn,#loadout .btn,#build .btn{width:100%;min-width:44px;min-height:44px')||!css.includes('#growth .growthTab{min-width:44px;min-height:44px')||!css.includes('#growth .talentNode{min-width:44px;min-height:124px')||!css.includes('#build .buildSlot{min-width:44px;min-height:76px')||!css.includes('#build .pick{min-width:44px;min-height:56px'))fail.push('phone progression actions do not keep 44px touch targets');
if(!css.includes('#heroes .heroIdentity small,#heroes .heroCombatStrip b{font-size:10px')||!css.includes('#growth .talentNode p{font-size:10px')||!css.includes('#loadout .itemCard p,#loadout .runeEffect small,#loadout .petCombatHero small,#loadout .petSkillBox{font-size:10px')||!css.includes('#build .pick b{font-size:10px'))fail.push('phone progression card copy is not raised to readable sizes');
if(!css.includes('.heroGrid{display:grid;grid-template-columns:repeat(3,1fr)')||!css.includes('.buildLayout{display:grid;grid-template-columns:360px minmax(0,1fr)')||!css.includes('.skillPickGrid{display:grid;grid-template-columns:repeat(5,1fr)'))fail.push('desktop progression grid baselines changed');
if(!heroesBlock.includes('data-hero-hall')||!heroesBlock.includes('id="heroHallTitle"')||!heroesBlock.includes('id="heroHallHeroId"')||!heroesBlock.includes('id="heroHallHeroName"')||!heroesBlock.includes('id="heroHallHeroRole"')||!heroesBlock.includes('id="heroHallHeroState"')||!heroesBlock.includes('id="heroHallTrait"')||!heroesBlock.includes('id="heroHallBasic"')||!heroesBlock.includes('id="heroHallSkill"')||!heroesBlock.includes('id="heroHallUlt"')||!heroesBlock.includes('id="heroHallResource"'))fail.push('hero hall lacks its scene landmark or selected identity, role, state and combat dossier');
if((heroesBlock.match(/data-hero-confirm/g)||[]).length!==1||!heroesBlock.includes('onclick="confirmHeroSelection()"')||/startBattle\s*\(/.test(heroesBlock))fail.push('hero hall does not expose exactly one selection confirmation or can start battle directly');
if(!renderHeroHallBlock.includes("d=document.createElement('button');d.type='button'")||!renderHeroHallBlock.includes("d.dataset.heroId=id")||!renderHeroHallBlock.includes("d.setAttribute('aria-pressed',String(heroHallFocusId===id))")||!renderHeroHallBlock.includes("d.onclick=()=>focusHero(id)")||!renderHeroHallBlock.includes("save.hero===id")||!renderHeroHallBlock.includes("!s.unlocked"))fail.push('hero roster is not made of native preview controls with synchronized focused, current-save and locked states');
if(!focusHeroBlock.includes("document.activeElement?.classList.contains('heroRosterEntry')")||!focusHeroBlock.includes('heroHallFocusId=id;renderHeroHall()')||!focusHeroBlock.includes("document.querySelector('#heroGrid .heroRosterEntry[aria-pressed=\"true\"]')?.focus({preventScroll:true})")||/\bsave\.|\bpersist\s*\(|\bselectHero\s*\(/.test(focusHeroBlock))fail.push('hero preview changes save state or fails to restore roster focus after synchronous rerender');
if(!heroPreviewBlock.includes('recommendedPreset:')||/\bsave\.|\bpersist\s*\(|localStorage/.test(heroPreviewBlock)||!confirmHeroBlock.includes('v34PendingHeroId=preview.heroId')||!confirmHeroBlock.includes("v32OpenLayer('heroConfirmOverlay')")||/\bsave(?:\.[\w$]+)+\s*(?:[+\-*/]?=|\+\+|--)|\bpersist\s*\(/.test(confirmHeroBlock)||!cancelHeroBlock.includes('v34PendingHeroId=null')||!applyHeroBlock.includes("choice!=='keep'&&choice!=='recommended'")||!applyHeroBlock.includes('save.gold-=price;heroSave.unlocked=true')||!applyHeroBlock.includes('save.hero=id')||!applyHeroBlock.includes("if(choice==='recommended')")||!applyHeroBlock.includes('save.build.active=[...preview.recommendedPreset.active]')||!applyHeroBlock.includes('save.build.passive=[...preview.recommendedPreset.passive]')||!applyHeroBlock.includes('persist()')||!applyHeroBlock.includes('v29ReturnToBriefing()')||!applyHeroBlock.includes("go('loadout')")||!selectHeroBlock.includes('confirmHeroSelection()')||/startBattle\s*\(/.test(confirmHeroBlock+applyHeroBlock))fail.push('hero confirmation does not preserve preview, explicit build choice, final purchase, persistence and briefing return authority');
if(!heroUiCode.includes("document.addEventListener('ui:view-change'")||!heroUiCode.includes("event.detail?.id==='heroes'")||!heroUiCode.includes('renderHeroHall()'))fail.push('hero hall does not reclaim its scene after ordered legacy presentation scripts load');
if(!css.includes('V3.3.5 SCENE HERO HALL')||!css.includes('body[data-shell-view="heroes"] .app{display:block')||!css.includes('.heroHall{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.heroHallScene{display:grid;grid-template-columns:190px minmax(0,1fr) 320px')||!css.includes('.heroHallCommand{position:relative'))fail.push('desktop hero hall does not keep identity, roster and selection action in one viewport scene');
if(!css.includes('#heroes .heroGrid{display:flex;overflow-x:auto;overflow-y:hidden')||!css.includes('.heroRosterEntry{flex:0 0 92px;min-width:92px;min-height:74px')||!css.includes('.heroHallCommand{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom))')||!css.includes('padding-bottom:calc(154px + env(safe-area-inset-bottom))'))fail.push('phone hero hall lacks a safe-area fixed action, horizontal roster rail or readable touch targets');
const armoryBindingIds=['loadoutHeroName','loadoutHeroStats','equipSlots','runeSlots','petSlot','v26LoadoutBonuses','v26SetSummary','v27RuneEffects','v27RuneResonance','v27PetLoadout','gearGrid','runeGrid','petGrid'];
if(!loadoutBlock.includes('data-expedition-armory')||!loadoutBlock.includes('class="armoryHeroBay"')||!loadoutBlock.includes('class="armoryConfig"')||!loadoutBlock.includes('class="armoryArsenal"')||!armoryBindingIds.every(id=>loadoutBlock.includes(`id="${id}"`)))fail.push('expedition armory lacks its scene landmark, three focal bays or existing render bindings');
if((loadoutBlock.match(/data-loadout-target=/g)||[]).length!==3||!['gear','runes','pets'].every((type,index)=>loadoutBlock.includes(`data-loadout-target="${type}" aria-pressed="${index===0?'true':'false'}" aria-controls="armory-${type}" onclick="focusLoadoutBay('${type}')"`)))fail.push('armory does not expose exactly three native same-page category controls with synchronized initial state');
if(!['gear','runes','pets'].every(type=>loadoutBlock.includes(`id="armory-${type}" class="armoryBay" data-loadout-bay="${type}" tabindex="-1"`))||/startBattle\s*\(/.test(loadoutBlock))fail.push('armory categories do not target three focusable real inventory bays or can start battle directly');
if(!focusLoadoutBayBlock.includes("document.querySelector('[data-loadout-bay=\"'+type+'\"]')")||!focusLoadoutBayBlock.includes("document.querySelectorAll('[data-loadout-target]')")||!focusLoadoutBayBlock.includes("button.setAttribute('aria-pressed',String(active))")||!focusLoadoutBayBlock.includes('target.focus({preventScroll:true})')||!focusLoadoutBayBlock.includes('Math.max(0,target.offsetTop-scroller.offsetTop-8)')||/\bsave\b|\bpersist\s*\(|\bequipGear\s*\(|\btoggleRune\s*\(|\bsetPet\s*\(|\bautoBest\s*\(/.test(focusLoadoutBayBlock))fail.push('armory category helper mutates gameplay state or does not move pressed state, focus and internal scroll together');
if(!css.includes('V3.3.5 SCENE EXPEDITION ARMORY')||!css.includes('body[data-shell-view="loadout"] .app{display:block;min-height:100dvh}')||!css.includes('.armoryScene{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.armoryDeck{display:grid;grid-template-columns:230px minmax(340px,.86fr) minmax(360px,1.14fr)')||!css.includes('.armoryInventoryScroll{min-height:0;overflow-y:auto;overflow-x:hidden'))fail.push('desktop expedition armory does not keep three bays and an internally scrolling arsenal in one viewport scene');
if(!css.includes('body[data-shell-view="loadout"]{overflow-x:hidden;overflow-y:auto}')||!css.includes('.armoryCategoryRail{display:flex;overflow-x:auto;overflow-y:hidden')||!css.includes('.armoryCategory{flex:0 0 112px;min-width:112px;min-height:44px')||!css.includes('#loadout .armoryArsenal .itemGrid{grid-template-columns:minmax(0,1fr)}')||!css.includes('padding:calc(70px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(84px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))'))fail.push('phone armory lacks safe-area spacing, horizontal category rail, 44px targets or single-column inventory');
const buildBindingIds=['buildHeroName','activeCount','activeSlots','passiveCount','passiveSlots','presetGrid','skillPickGrid','buildEntityCount','buildEvoCount','buildFusionCount','buildFormPanel'];
if(!buildBlock.includes('data-build-sanctum')||!buildBlock.includes('class="buildHeroBay"')||!buildBlock.includes('class="buildMatrix"')||!buildBlock.includes('class="buildCodex"')||!buildBindingIds.every(id=>buildBlock.includes(`id="${id}"`)))fail.push('build sanctum lacks its scene landmark, three focal bays or existing render bindings');
if((buildBlock.match(/data-build-target=/g)||[]).length!==3||!['active','passive','presets'].every((type,index)=>buildBlock.includes(`data-build-target="${type}" aria-pressed="${index===0?'true':'false'}" aria-controls="build-library-${type}" onclick="focusBuildLibrary('${type}')"`)))fail.push('build codex does not expose exactly three native same-page category controls with synchronized initial state');
if(!['active','passive','presets'].every(type=>buildBlock.includes(`id="build-library-${type}" class="buildLibraryBay" data-build-library="${type}" tabindex="-1"`))||/startBattle\s*\(/.test(buildBlock))fail.push('build categories do not target three focusable real codex sections or can start battle directly');
if((loadoutBlock.match(/data-build-handoff/g)||[]).length!==1||!loadoutBlock.includes('data-build-handoff onclick="v29CompleteLoadout()"')||!briefingCompleteLoadoutBlock.includes("go('build')")||!buildBlock.includes('onclick="go(\'loadout\')"')||!briefingCompleteBuildBlock.includes("go('world')"))fail.push('armory and build sanctum are not connected by the context-aware configuration handoff');
if(!focusBuildLibraryBlock.includes("document.querySelector('[data-build-library=\"'+type+'\"]')")||!focusBuildLibraryBlock.includes("document.querySelectorAll('[data-build-target]')")||!focusBuildLibraryBlock.includes("button.setAttribute('aria-pressed',String(active))")||!focusBuildLibraryBlock.includes('target.focus({preventScroll:true})')||!focusBuildLibraryBlock.includes('Math.max(0,target.offsetTop-scroller.offsetTop-8)')||/\bsave\b|\bpersist\s*\(|\bclearBuild\s*\(|\btoggleBuild\s*\(|\bapplyPreset\s*\(/.test(focusBuildLibraryBlock))fail.push('build codex helper mutates gameplay state or does not move pressed state, focus and internal scroll together');
if(!renderBuildBlock.includes("d=document.createElement('button');d.type='button'")||!renderBuildBlock.includes("d.setAttribute('aria-pressed',String(active))")||!renderBuildBlock.includes('d.onclick=()=>toggleBuild(id)')||!renderBuildBlock.includes("document.querySelector('[data-build-picks=\"active\"]')")||!renderBuildBlock.includes("document.querySelector('[data-build-picks=\"passive\"]')"))fail.push('real build skill catalog is not split into native selected controls that delegate to toggleBuild');
if(!css.includes('V3.3.5 SCENE BUILD SANCTUM')||!css.includes('body[data-shell-view="build"] .app{display:block;min-height:100dvh}')||!css.includes('.buildSanctum{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.buildLayout{display:grid;grid-template-columns:220px minmax(380px,.98fr) minmax(400px,1.02fr)')||!css.includes('.buildCodexScroll{min-height:0;overflow-y:auto;overflow-x:hidden')||!css.includes('.buildFormScroll{min-height:0;overflow-y:auto;overflow-x:hidden'))fail.push('desktop build sanctum does not keep three bays and its codex/form details inside the first viewport');
if(!css.includes('body[data-shell-view="build"]{overflow-x:hidden;overflow-y:auto}')||!css.includes('.buildCodexRail{display:flex;overflow-x:auto;overflow-y:hidden')||!css.includes('.buildCodexTarget{flex:0 0 124px;min-width:124px;min-height:44px')||!css.includes('#build .buildSkillList{grid-template-columns:minmax(0,1fr)}')||!css.includes('padding:calc(70px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(84px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))'))fail.push('phone build sanctum lacks safe-area spacing, horizontal codex rail, 44px targets or single-column skill lists');
const growthBindingIds=['v28MetaAvatar','v28MetaHeroId','v28MetaHeroName','v28Gold','v28TalentPts','v28AccountLv','v28HeroGrowthGrid','v28Stars','v28MetaEffects','v28AccountBadge','v28AccountXpFill','v28AccountXpText','v28TalentSummary','v28TalentTree','v28MasteryText','v28MasteryFill','v28MasteryNodes','v28AwakenPanel','v28PresetGrid'];
if(!growthBlock.includes('data-growth-court')||!growthBlock.includes('class="growthHeroDossier"')||!growthBlock.includes('class="growthPractice"')||!growthBindingIds.every(id=>growthBlock.includes(`id="${id}"`)))fail.push('growth court lacks its scene landmark, focal planes or existing render bindings');
if((growthBlock.match(/data-growth-target=/g)||[]).length!==4||!['hero','talent','mastery','presets'].every((type,index)=>growthBlock.includes(`data-growth-target="${type}" data-growth="${type}" aria-pressed="${index===0?'true':'false'}" aria-controls="growth-${type}" onclick="v28SetGrowthTab('${type}')"`)))fail.push('growth court does not expose exactly four native path controls with synchronized initial state');
if(!['hero','talent','mastery','presets'].every((type,index)=>growthBlock.includes(`id="growth-${type}" class="growthPane${index===0?' active':''}" data-growth-pane="${type}" tabindex="-1"`))||/startBattle\s*\(/.test(growthBlock))fail.push('growth paths do not target four focusable real panes or can start battle directly');
if(!growthBlock.includes('data-growth-handoff onclick="go(\'build\')"')||!buildBlock.includes("onclick=\"go('growth');v28SetGrowthTab('presets')\""))fail.push('growth court and build sanctum are not connected through the approved preparation handoff');
if(!setGrowthTabBlock.includes("document.querySelectorAll('[data-growth-target]')")||!setGrowthTabBlock.includes("button.setAttribute('aria-pressed',String(active))")||!setGrowthTabBlock.includes("document.querySelectorAll('[data-growth-pane]')")||!setGrowthTabBlock.includes('pane.hidden=!active')||/\bsave\b|\bpersist\s*\(|\bv28Invest\s*\(|\bv28SavePreset\s*\(|\bv28LoadPreset\s*\(/.test(setGrowthTabBlock))fail.push('growth path switching mutates gameplay state or fails to synchronize selected and pane states');
if(!renderGrowthBlock.includes("n=document.createElement('button');n.type='button'")||!renderGrowthBlock.includes("n.setAttribute('aria-disabled',String(!ok||lv>=5))")||!renderGrowthBlock.includes('n.onclick=()=>v28Invest(tid)'))fail.push('growth talent tree is not made of native stateful controls delegating to v28Invest');
if(!css.includes('V3.3.5 SCENE GROWTH COURT')||!css.includes('body[data-shell-view="growth"] .app{display:block;min-height:100dvh}')||!css.includes('.growthCourt{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.growthCourtLayout{display:grid;grid-template-columns:260px minmax(0,1fr)')||!css.includes('.growthPracticeScroll{min-height:0;overflow-y:auto;overflow-x:hidden'))fail.push('desktop growth court does not keep identity, paths and internally scrolling practice inside the first viewport');
if(!css.includes('body[data-shell-view="growth"]{overflow-x:hidden;overflow-y:auto}')||!css.includes('.growthPathRail{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden')||!css.includes('.growthTab{flex:0 0 126px;min-width:126px;min-height:44px')||!css.includes('#growth .talentTree{grid-template-columns:minmax(0,1fr)}')||!css.includes('padding:calc(70px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(84px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))'))fail.push('phone growth court lacks safe-area spacing, non-wrapping horizontal path rail, 44px targets or single-column details');
if(!html.includes('<section class="page" id="modes" data-mission-board')||!css.includes('body[data-shell-view="modes"] #modes{min-width:0;min-height:calc(100dvh - 64px);overflow:visible;overflow-wrap:anywhere}')||!css.includes('.missionConsole{grid-template-columns:minmax(0,1fr);gap:10px;min-height:auto')||!css.includes('.missionConsole .modeCurrent p{min-height:0;max-width:92%;font-size:11px')||!css.includes('.missionTarget b{font-size:11px}'))fail.push('phone mission board is not contained, stacked and readable');
if(!worldBlock.includes('data-rift-atlas')||!worldBlock.includes('id="riftAtlasTitle"')||!worldBlock.includes('id="worldChapterName"')||!worldBlock.includes('id="atlasStageId"')||!worldBlock.includes('id="atlasStageName"')||!worldBlock.includes('id="atlasStageObjective"')||!worldBlock.includes('id="atlasBossRoute"'))fail.push('rift atlas lacks its scene landmark or selected world, stage, objective and Boss route context');
if((worldBlock.match(/data-atlas-confirm/g)||[]).length!==1||!worldBlock.includes('onclick="go(\'modes\')"')||/startBattle\(\)/.test(worldBlock))fail.push('rift atlas does not return through exactly one confirmation path or still starts battle directly');
if(!renderWorldBlock.includes("n=document.createElement('button');n.type='button'")||!renderWorldBlock.includes("n.setAttribute('aria-pressed',String(save.selectedChapter===id))")||!renderWorldBlock.includes('n.disabled=!c.unlock')||!renderWorldBlock.includes('n.onclick=()=>selectWorldChapter(id)'))fail.push('world projections are not native select-only controls with synchronized locked/current state');
if(!renderStageListBlock.includes("d=document.createElement('button');d.type='button'")||!renderStageListBlock.includes("d.setAttribute('aria-pressed',String(save.selectedStage===st[0]))")||!renderStageListBlock.includes('d.disabled=!unlocked')||!renderStageListBlock.includes('d.onclick=()=>selectWorldStage(st[0])'))fail.push('stage route projections are not native select-only controls with synchronized locked/current state');
if(!selectWorldChapterBlock.includes("document.activeElement?.classList.contains('chapterNode')")||!selectWorldChapterBlock.includes("document.querySelector('#worldMap .chapterNode[aria-pressed=\"true\"]')?.focus({preventScroll:true})")||!selectWorldStageBlock.includes("document.activeElement?.classList.contains('stageRow')")||!selectWorldStageBlock.includes("document.querySelector('#stageList .stageRow[aria-pressed=\"true\"]')?.focus({preventScroll:true})"))fail.push('world or stage selection does not restore focus after synchronous atlas rerender');
if(!css.includes('V3.3.5 SCENE RIFT ATLAS')||!css.includes('body[data-shell-view="world"] .app{display:block')||!css.includes('.riftAtlas{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.atlasScene{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr)'))fail.push('desktop rift atlas does not replace the sidebar card grid with a first-viewport scene');
if(!css.includes('body[data-shell-view="world"] #world{min-width:0;min-height:calc(100dvh - 64px);overflow:visible;overflow-wrap:anywhere}')||!css.includes('#world .stageList{display:flex;overflow-x:auto;overflow-y:hidden')||!css.includes('#world .stageRow{flex:0 0 156px;min-width:156px;min-height:112px')||!css.includes('.atlasCommand{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom))'))fail.push('phone rift atlas lacks a safe-area confirmation action or internally scrollable touch stage route');
const resultBindingIds=['resultState','resultTitle','resultReason','resTime','resKills','resStars','resGold','resultRows','dropGrid','resultDamage'];
if(!resultBlock.includes('data-result-chamber')||!['resultChamber','resultChamberBackdrop','resultChamberHeader','resultScene','resultVerdict','resultOutcomeSeal','resultMetrics','resultCommands','resultLedger','resultLedgerScroll','resultPanel'].every(name=>resultBlock.includes(`class="${name}`))||!resultBindingIds.every(id=>resultBlock.includes(`id="${id}"`)))fail.push('Result chamber lacks its scene landmark, focal planes or existing render bindings');
if((resultBlock.match(/data-result-replay/g)||[]).length!==1||(resultBlock.match(/data-result-return/g)||[]).length!==1||!resultBlock.includes('id="resultHandoffStatus"')||!resultBlock.includes('id="resultPrimaryLabel"')||!resultBlock.includes('id="resultPrimaryDetail"')||!resultBlock.includes('data-result-replay onclick="v29OpenResultHandoff()"')||!resultBlock.includes('data-result-return onclick="v29ReturnResultHandoff()"')||/finishRun\s*\(|startBattle\s*\(/.test(resultBlock))fail.push('Result commands do not delegate through exactly one campaign handoff and one return path');
if(!gameModesCode.includes('function v29CampaignHandoff(')||!gameModesCode.includes('function v29ApplyCampaignHandoff(')||!gameModesCode.includes('function v29RenderResultHandoff(')||!gameModesCode.includes('function v29OpenResultHandoff(')||!gameModesCode.includes('function v29ReturnResultHandoff(')||!gameModesCode.includes("event.detail?.id==='result'")||!nexusCode.includes("handoff.kind==='next'")||!nexusCode.includes("handoff.kind==='retry'")||!nexusCode.includes("handoff.kind==='complete'")||!homeBlock.includes('id="nexusMissionState"'))fail.push('authoritative post-settlement handoff is not projected across Result, briefing and lobby');
if(!campaignRoute?.checks?.firstVictoryHandoff||!campaignRoute?.checks?.victoryHandoffSelectionOnly||!campaignRoute?.checks?.defeatHandoff||!campaignRoute?.checks?.defeatHandoffSelectionOnly||!campaignRoute?.checks?.campaignComplete)fail.push('isolated campaign handoff route does not preserve selection-only victory, defeat and completion behavior');
if(!renderResultBlock.includes("page.dataset.resultOutcome=r.victory?'victory':'defeat'")||/localStorage|sessionStorage|\bpersist\s*\(|\bfinishRun\s*\(|\bsave(?:\.|\s*=)/.test(renderResultBlock))fail.push('Result outcome projection is missing or mutates settlement and save state');
if(!css.includes('V3.3.5 SCENE RESULT CHAMBER')||!css.includes('body[data-shell-view="result"] .app{display:block;min-height:100dvh}')||!css.includes('.resultChamber{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.resultScene{display:grid;grid-template-columns:minmax(330px,.82fr) minmax(0,1.18fr)')||!css.includes('.resultLedgerScroll{min-height:0;overflow-y:auto;overflow-x:hidden'))fail.push('desktop Result chamber does not preserve first-viewport verdict, commands and internal ledger scrolling');
if(!css.includes('[data-result-outcome="victory"] .resultOutcomeSeal')||!css.includes('[data-result-outcome="defeat"] .resultOutcomeSeal')||!css.includes('[data-result-outcome="defeat"] .resultChamber'))fail.push('Result victory and defeat lack distinct projected visual identities');
if(!css.includes('body[data-shell-view="result"]{overflow-x:hidden;overflow-y:auto}')||!css.includes('.resultChamber{height:auto;min-height:calc(100dvh - 64px)')||!css.includes('.resultScene{grid-template-columns:minmax(0,1fr)')||!css.includes('.resultLedgerScroll{max-height:none;overflow:visible')||!css.includes('.resultCommands{grid-template-columns:minmax(0,1fr)')||!css.includes('.resultCommands .btn{width:100%;min-width:44px;min-height:44px')||!css.includes('calc(84px + env(safe-area-inset-bottom))'))fail.push('phone Result chamber lacks safe single-column flow and touch-sized commands');
if(!css.includes('.startScreen{place-items:start center;overflow-x:hidden;overflow-y:auto')||!css.includes('.startInner{width:min(100%,560px);grid-template-columns:minmax(0,1fr)')||!css.includes('.menuBtn{min-width:44px;min-height:56px')||!css.includes('.modalBox{width:100%;max-height:100%')||!css.includes('.closeX{flex:0 0 44px;width:44px;height:44px'))fail.push('phone entry and modal shells are not safe-area scrollable with touch-sized controls');
if(!css.includes('.saveCard .actions,.storyIntroCard .actions,.recoveryBox .actions{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}')||!css.includes('.saveCard .btn,.storyIntroCard .btn,.recoveryBox .btn{width:100%;min-width:44px;min-height:44px')||!css.includes('.settingRow{min-height:44px')||!css.includes('.toggle{flex:0 0 44px;width:44px;height:44px')||!css.includes('.audioMeter input{min-width:44px;min-height:44px'))fail.push('phone save, settings, story or recovery actions are below 44px');
if(!css.includes('.overlay,.lootChoiceOverlay{place-items:start center;overflow-x:hidden;overflow-y:auto')||!css.includes('.choiceGrid,.eventGrid,.gearChoiceGrid{grid-template-columns:minmax(0,1fr)}')||!css.includes('.choice,.eventCard,.gearChoiceCard{min-width:44px;min-height:44px')||!css.includes('.pausePanel .btn{width:100%;min-width:44px;min-height:44px'))fail.push('phone battle overlays are not scrollable single-column touch layouts');
if(!css.includes('.mobileControls{z-index:9}')||!css.includes('.mobileMoveZone{position:absolute;left:0;top:0;bottom:0;z-index:9;'))fail.push('floating joystick control plane can cover blocking battle overlays on phone');
if(!css.includes('.combatLoopHud{position:absolute;left:14px;top:118px;z-index:8;'))fail.push('combat objective or timed reward HUD can cover blocking battle overlays');
if(!css.includes('.choiceGrid{display:grid;grid-template-columns:repeat(3,1fr)')||!css.includes('.eventGrid{display:grid;grid-template-columns:repeat(3,1fr)')||!css.includes('.gearChoiceGrid{display:grid;grid-template-columns:repeat(3,1fr)')||!css.includes('.startInner{position:relative;z-index:2;width:min(980px,92vw);display:grid;grid-template-columns:1.1fr .9fr'))fail.push('desktop choice or Start grid baseline changed');
if(!navigationBlock.includes("b.setAttribute('aria-current','page')")||!navigationBlock.includes("navMore.classList.toggle('active',overflowActive)")||!navigationBlock.includes("setMobileNavOpen(false)")||!navigationBlock.includes("e.key==='Escape'")||!navigationBlock.includes('e.stopImmediatePropagation()')||!navigationBlock.includes("growth:'长期成长'")||!navigationBlock.includes("modes:'游戏模式'"))fail.push('navigation state, title, overflow and Escape synchronization guards are missing');
const switchTags=[...html.matchAll(/<button\s+type="button"\s+class="toggle(?:\s+on)?"\s+id="[^"]+"\s+role="switch"\s+aria-label="[^"]+"\s+aria-checked="(?:true|false)"/g)];
if(switchTags.length!==9||!tutorialSettings.includes("el.setAttribute('aria-checked',String(!!save.settings[key]))")||!resultUi.includes("el.setAttribute('aria-checked',String(enabled))")||!saveSlots.includes("e.setAttribute('aria-checked',String(enabled))")||!qualityPresentation.includes("t.setAttribute('aria-checked',String(enabled))"))fail.push('nine settings switches are not native, named and synchronized');
if(!saveSlots.includes("b=document.createElement('button');b.type='button'")||!saveSlots.includes("b.setAttribute('aria-pressed',String(selected))"))fail.push('performance profile buttons do not expose synchronized pressed state');
const dialogIds=['saveModal','settingsModal','storyIntro','v26LootOverlay','levelOverlay','chestOverlay','eventOverlay','tutorialOverlay','pauseOverlay'];
if(!dialogIds.every(id=>{const tag=openingTag(id);return tag.includes('role="dialog"')&&tag.includes('aria-modal="true"')&&tag.includes('aria-labelledby=')}))fail.push('scoped overlays do not expose named modal dialog semantics');
const recoveryTag=openingTag('v30Recovery'),toastTag=openingTag('toast'),loadingTag=openingTag('loadingScreen');
if(!recoveryTag.includes('role="alertdialog"')||!recoveryTag.includes('aria-labelledby=')||!recoveryTag.includes('aria-describedby=')||!toastTag.includes('role="status"')||!toastTag.includes('aria-live="polite"')||!loadingTag.includes('role="status"')||!loadingTag.includes('aria-label="正在进入裂隙"')||!html.includes('aria-label="关闭存档管理"')||!html.includes('aria-label="关闭游戏设置"')||!html.includes('id="masterVolume" aria-label="主音量"'))fail.push('dialog controls or status messages lack accessible names and announcements');
if(!css.includes('.battleLayout{--battle-stage-height:clamp(520px,calc(100dvh - 164px),740px);')||!css.includes('gap:14px;align-items:start}.arena{height:var(--battle-stage-height);min-height:0')||!css.includes('#arenaCanvas{width:100%;height:100%;display:block}')||!css.includes('.battleSide{display:grid;gap:12px;align-content:start;max-height:var(--battle-stage-height)')||!css.includes('overflow-y:auto;scrollbar-color:'))fail.push('desktop battle arena is not viewport-bound independently from the scrolling side panel');
if(!modesBlock.includes('data-mission-board')||!modesBlock.includes('id="missionBoardTitle"')||!modesBlock.includes('id="missionStageName"')||!modesBlock.includes('id="missionHeroName"')||!modesBlock.includes('id="missionBossName"'))fail.push('mission board lacks its scene landmark or selected mission context');
if((modesBlock.match(/data-mission-start/g)||[]).length!==1||!modesBlock.includes('onclick="v29StartSelected()"')||!modesBlock.includes('id="v29StartMode"')||/startBattle\s*\(/.test(modesBlock))fail.push('mission board does not expose exactly one briefing entry or still launches battle directly');
if(!renderModesBlock.includes("d=document.createElement('button');d.type='button'")||!renderModesBlock.includes("d.setAttribute('aria-pressed',String(mid===id))")||!renderModesBlock.includes('d.disabled=!ok')||!renderModesBlock.includes('d.onclick=()=>v29SelectMode(mid)')||/v29QuickStart\(/.test(renderModesBlock))fail.push('mode projections are not native select-only controls with synchronized locked/current state');
const briefingBindingIds=['briefingTitle','briefingStageCode','briefingStageName','briefingObjective','briefingModeName','briefingHeroName','briefingPower','briefingGearList','briefingRuneList','briefingPetName','briefingActiveList','briefingPassiveList','briefingReadiness','briefingBlockers','briefingConfirm'];
if(!briefingBlock.includes('data-expedition-briefing')||!briefingBindingIds.every(id=>briefingBlock.includes(`id="${id}"`))||!['heroes','loadout','build'].every(page=>briefingBlock.includes(`v29OpenBriefingEditor('${page}')`)))fail.push('expedition briefing lacks its semantic page, live save bindings or three preparation entries');
if(!briefingStatusBlock.includes('const blockers=[]')||!briefingStatusBlock.includes('v29Unlocked(save.mode)')||!briefingStatusBlock.includes('storyStageUnlocked(save.selectedStage)')||!briefingStatusBlock.includes('if(!active.length)')||!briefingStatusBlock.includes('if(!passive.length)')||!briefingStatusBlock.includes("active.filter(id=>!WW.config.skill?.[id]||String(id).startsWith('P'))")||!briefingStatusBlock.includes("passive.filter(id=>!WW.config.skill?.[id]||!String(id).startsWith('P'))")||!briefingStatusBlock.includes('Object.entries(slotLabels)')||!briefingStatusBlock.includes('if(!runes.length)')||!briefingStatusBlock.includes('WW.config.pet?.[save.pet]')||!briefingStatusBlock.includes('ready:blockers.length===0'))fail.push('briefing readiness does not re-derive valid non-empty builds and all blocking gameplay configuration from the active save');
if(!briefingRenderBlock.includes("action.className='briefingFix'")||!briefingRenderBlock.includes('action.onclick=()=>v29OpenBriefingFix(blocker.target)')||!briefingFixBlock.includes('V29_BRIEFING_EDITORS[target]')||!briefingFixBlock.includes("target!=='modes'&&target!=='world'")||!briefingFixBlock.includes('v29ClearBriefingContext();go(target)'))fail.push('briefing blockers do not expose direct semantic repair actions for preparation and route problems');
if(!briefingHeroActionBlock.includes('save.hero===id')||!briefingHeroActionBlock.includes('heroSave.unlocked')||!briefingHeroActionBlock.includes('gold>=price')||!briefingHeroActionBlock.includes('button.disabled=disabled')||!briefingCompleteHeroBlock.includes('return confirmHeroSelection()')||briefingCompleteHeroBlock.includes('selectHero(')||briefingCompleteHeroBlock.includes('v29ReturnToBriefing()')||!applyHeroBlock.includes("v29BriefingContext?.editor==='heroes'")||!applyHeroBlock.includes('v29ReturnToBriefing()'))fail.push('briefing hero appointment no longer defers selection, purchase and return until explicit build confirmation');
if((html.match(/data-briefing-return/g)||[]).length!==3||!briefingBeginBlock.includes('window.scrollTo(0,0)')||!briefingOpenEditorBlock.includes('window.scrollTo(0,0)')||!briefingReturnBlock.includes("go('briefing');v29RenderBriefing()")||!briefingReturnBlock.includes("document.getElementById(focusId||'briefingTitle')?.focus()")||briefingReturnBlock.includes('focus({preventScroll:true})')||!briefingKeydownBlock.includes("event.key!=='Escape'")||!briefingKeydownBlock.includes('v29ReturnToBriefing()'))fail.push('preparation pages cannot open from the top or return to a refreshed visible briefing target with Escape');
if(!loadoutBlock.includes('id="loadoutCompleteAction"')||!loadoutBlock.includes('onclick="v29CompleteLoadout()"')||!briefingCompleteLoadoutBlock.includes("v29BriefingContext?.editor==='loadout'")||!briefingCompleteLoadoutBlock.includes('v29ReturnToBriefing()')||!briefingCompleteLoadoutBlock.includes("go('build')")||!buildBlock.includes('id="buildCompleteAction" onclick="v29CompleteBuild()"')||!briefingCompleteBuildBlock.includes("v29BriefingContext?.editor==='build'")||!briefingCompleteBuildBlock.includes('v29ReturnToBriefing()')||!briefingCompleteBuildBlock.includes("go('world')")||!briefingSyncBlock.includes("loadoutComplete.textContent=active?")||!briefingSyncBlock.includes("buildComplete.setAttribute('aria-label',active?"))fail.push('loadout or build completion is not context-aware between briefing return and the ordinary preparation flow');
if(!briefingQuickStartBlock.includes('v29BeginBriefing()')||/startBattle\s*\(/.test(briefingQuickStartBlock)||!gameModesCode.includes('function v29ReplayBriefing(){v29BeginBriefing()}')||!gameModesCode.includes('function v29OpenResultHandoff()')||!briefingConfirmBlock.includes('const status=v29BriefingStatus()')||!briefingConfirmBlock.includes('if(v29BriefingLaunching||v29LoadingTimer)return')||!briefingConfirmBlock.includes('v29BriefingLaunching=true')||(briefingConfirmBlock.match(/startBattle\s*\(/g)||[]).length!==1)fail.push('battle launch is not owned exactly once by explicit briefing confirmation');
if(!css.includes('body[data-shell-view="briefing"]{overflow-x:hidden;overflow-y:auto}')||!css.includes('body[data-shell-view="briefing"] #briefing{min-width:0;min-height:calc(100dvh - 64px);overflow:visible;overflow-wrap:anywhere}')||!css.includes('.briefingBody{grid-template-columns:minmax(0,1fr);gap:10px')||!css.includes('.briefingPanelTitle>button{min-width:104px;min-height:44px')||!css.includes('.briefingCheck li{grid-template-columns:minmax(0,1fr)}')||!css.includes('.briefingFix{width:100%;min-width:0}')||!css.includes('.briefingCommand{position:fixed;left:max(12px,env(safe-area-inset-left))')||!css.includes('.toast{position:fixed;')||!css.includes('pointer-events:none'))fail.push('phone briefing lacks single-column containment, repair actions, safe-area commands, 44px targets or click-through status feedback');
if(!css.includes('V3.3.5 SCENE MISSION BOARD')||!css.includes('body[data-shell-view="modes"] .app{display:block')||!css.includes('.missionBoard{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.missionConsole{display:grid;grid-template-columns:minmax(170px,210px) minmax(0,1fr) minmax(210px,260px)')||!css.includes('.missionLaunch{position:relative;min-height:68px'))fail.push('desktop mission board does not replace the sidebar card wall with a first-viewport scene console');
if(!css.includes('#modes .modeGrid{display:flex;overflow-x:auto;overflow-y:hidden')||!css.includes('#modes .modeCard{flex:0 0 86px;min-width:86px;min-height:72px')||!css.includes('.missionCommand{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom))'))fail.push('phone mission board lacks a safe-area launch action or internally scrollable touch rule rail');
const battleLiveIds=['v29BattleMode','v29BattleObjective','v29ModeProgress','v29ModeAction','directorWave','directorPressureText','directorPressure','directorNext'];
if(!battleBlock.includes('data-battle-theater')||!['battleTheater','battleBackdrop','battleCommandHeader','battleObjectivePanel','battleThreatPanel','battleStage','battleDossier'].every(name=>battleBlock.includes(`class="${name}`))||!battleLiveIds.every(id=>(html.match(new RegExp(`id="${id}"`,'g'))||[]).length===1))fail.push('Battle Theater lacks its scene planes or unique live objective and threat bindings');
if((battleBlock.match(/data-battle-pause/g)||[]).length!==1||!battleBlock.includes('data-battle-pause aria-controls="pauseOverlay" onclick="performBattleAction(\'pause\',togglePause)"'))fail.push('desktop Battle Theater pause command does not delegate exactly once through onboarding to the existing pause overlay');
if((battleBlock.match(/id="battleDossierToggle"/g)||[]).length!==1||!battleBlock.includes('aria-controls="battleDossier" aria-expanded="false" onclick="toggleBattleDossier()"')||!battleBlock.includes('id="battleDossier" aria-label="战术卷宗" aria-hidden="true"'))fail.push('desktop tactical dossier lacks one native toggle with synchronized accessibility targets');
if(!battleBlock.includes('<div class="battleCommandDock"')||!['arenaCanvas','v26LootOverlay','levelOverlay','chestOverlay','eventOverlay','tutorialOverlay','pauseOverlay','joystickBase','mobileSkill','mobileDodge','mobileUlt','mobileInteract','mobilePause'].every(id=>battleBlock.includes(`id="${id}"`)))fail.push('Battle Theater removed an existing arena, overlay, command dock or mobile control');
if(!css.includes('V3.3.5 SCENE BATTLE THEATER')||!css.includes('body[data-shell-view="battle"]{overflow:hidden')||!css.includes('.battleTheater{position:relative;min-height:100dvh;height:100dvh')||!css.includes('.battleCommandHeader{display:grid;grid-template-columns:minmax(180px,.72fr) minmax(320px,1.35fr) minmax(240px,.93fr)')||!css.includes('.battleStage{display:grid;grid-template-columns:minmax(0,1fr);')||!css.includes('.battleDossier{position:absolute;inset:0 0 0 auto;'))fail.push('desktop Battle Theater lacks a full-width Arena with an overlay tactical dossier');
if(!css.includes('@media(min-width:901px) and (max-width:1250px)')||!css.includes('.battleDossier{width:min(320px,calc(100% - 48px))')||!css.includes('@media(max-width:900px)')||!css.includes('body.mobileBattle .battleCommandHeader,body.mobileBattle .battleBackdrop,body.mobileBattle .battleDossier{display:none}')||!css.includes('body.mobileBattle .battleTheater,body.mobileBattle .battleStage{width:100%;height:100%;min-height:0'))fail.push('Battle Theater does not preserve a compact desktop drawer and the proven full-screen mobile control surface');
if(!css.includes('grid-template-rows:86px minmax(0,1fr)')||!css.includes('.battleStage{display:grid;grid-template-columns:minmax(0,1fr);')||!css.includes('.battleStage.dossierOpen .battleDossier{transform:translateX(0);opacity:1;visibility:visible;pointer-events:auto'))fail.push('desktop Battle Theater has not returned the dossier column to the live Arena by default');
if(!engine.includes('function responsiveMovementVector(dt)')||!engine.includes('const move=responsiveMovementVector(dt)')||!director.includes('const move=responsiveMovementVector(dt)')||!startBattleBlock.includes('resetMovementResponse()')||!saveSlots.includes("if(typeof resetMovementResponse==='function')resetMovementResponse()")||!tutorialSettings.includes("if(run.paused&&typeof v331ClearInputs==='function')v331ClearInputs()"))fail.push('live movement path does not use or reset the shared response state at every interruption boundary');
if(!html.includes('<div class="battleCommandDock" role="group" aria-label="战斗快捷操作">')||!html.includes('id="heroSkillAction"')||!html.includes('id="dodgeAction"')||!html.includes('id="ultAction"')||!html.includes('<strong>英雄技</strong>')||!html.includes('<strong>闪避</strong>')||!html.includes('<strong>终极</strong>')||!css.includes('.battleCommandDock{position:absolute;right:14px;bottom:14px')||!engine.includes('function updateDesktopActionsHud()')||!engine.includes("setDesktopActionState('heroSkillAction','skillCdText'")||!engine.includes("setDesktopActionState('dodgeAction','dodgeCdText'")||!engine.includes("setDesktopActionState('ultAction','ultText'")||!engine.includes('updateDesktopActionsHud();updateMobileControlsHud()'))fail.push('desktop command dock lacks visible action names or synchronized readiness feedback');
if(!html.includes('<button type="button" class="actionBtn heroSkill"')||!html.includes('<button type="button" class="actionBtn dodge"')||!html.includes('<button type="button" class="actionBtn ult"')||(engine.match(/createElement\('button'\)/g)||[]).length<3||!engine.includes("d.className='choice'")||!engine.includes("x.className='eventCard'")||!gearSystem.includes("const tag=choice?'button':'div',attrs=choice?' type=\"button\"':''"))fail.push('desktop battle actions or runtime battle choices are not native buttons');
if(!saveSlots.includes('const v32FocusOrigins=new Map()')||!saveSlots.includes("el.querySelector('button:not(:disabled),input:not(:disabled),[tabindex]:not([tabindex=\"-1\"])')")||!saveSlots.includes("first.focus({preventScroll:true})")||!saveSlots.includes('origin instanceof HTMLElement&&origin.isConnected')||!saveSlots.includes("focusTarget.focus({preventScroll:true})"))fail.push('overlay focus entry or restoration guard is missing');
if(!engine.includes("function v32InteractiveKeyTarget(target){return target instanceof Element&&!!target.closest('button,input,select,textarea,[role=\"button\"],[role=\"switch\"]')}")||!engine.includes("if(v32InteractiveKeyTarget(e.target)&&e.key!=='Escape')return"))fail.push('global gameplay keys are not isolated from interactive controls');
if(!css.includes(':where(button,input,[role="button"],[role="switch"],[tabindex]):focus-visible')||!css.includes('outline:3px solid #fff1a8')||!css.includes('@media(prefers-reduced-motion:reduce)')||!css.includes('animation:none!important')||!css.includes('transition-duration:.01ms!important')||!css.includes('scroll-behavior:auto!important'))fail.push('focus-visible or reduced-motion coverage is missing');

function testClassList(initial=[]){const values=new Set(initial);return{add:value=>values.add(value),remove:value=>values.delete(value),contains:value=>values.has(value),toggle(value,force){const next=force===undefined?!values.has(value):force;if(next)values.add(value);else values.delete(value);return next}}}
try{
 const shellDocument={body:{dataset:{},classList:testClassList()},events:[],querySelector(selector){return selector==='.page.active'?{id:'home'}:null},dispatchEvent(event){this.events.push(event);return true}};
 function ShellEvent(type,init){this.type=type;this.detail=init.detail}
 const shellContext={document:shellDocument,CustomEvent:ShellEvent};shellContext.window=shellContext;
 vm.createContext(shellContext);vm.runInContext(shell,shellContext);
 const shellApi=shellContext.WW?.ui?.shell;
 if(!shellApi||JSON.stringify([...shellApi.primary])!==JSON.stringify(['home','heroes','growth','loadout'])||JSON.stringify([...shellApi.secondary])!==JSON.stringify(['build','modes','world'])||JSON.stringify([...shellApi.flowOnly])!==JSON.stringify(['briefing','battle','result']))fail.push('ui-shell runtime metadata does not match the approved view hierarchy');
 if(!Object.isFrozen(shellApi)||!Object.isFrozen(shellApi.views)||shellDocument.body.dataset.shellView!=='home'||shellDocument.body.dataset.shellMode!=='standard')fail.push('ui-shell does not initialize a frozen standard home presentation state');
 shellDocument.events.length=0;
 const battleSynced=shellApi.sync('battle'),battleEvent=shellDocument.events.at(-1);
 if(!battleSynced||shellDocument.body.dataset.shellView!=='battle'||shellDocument.body.dataset.shellMode!=='battle'||!shellDocument.body.classList.contains('shellBattle')||!shellDocument.body.classList.contains('mobileBattle')||battleEvent?.type!=='ui:view-change'||JSON.stringify(battleEvent.detail)!==JSON.stringify({id:'battle',tier:'flow',battle:true}))fail.push('ui-shell battle synchronization does not collapse the shell or dispatch its view event');
 const resultSynced=shellApi.sync('result'),resultEvent=shellDocument.events.at(-1);
 if(!resultSynced||shellDocument.body.dataset.shellView!=='result'||shellDocument.body.dataset.shellMode!=='standard'||shellDocument.body.classList.contains('shellBattle')||shellDocument.body.classList.contains('mobileBattle')||resultEvent?.type!=='ui:view-change'||JSON.stringify(resultEvent.detail)!==JSON.stringify({id:'result',tier:'flow',battle:false}))fail.push('ui-shell result synchronization does not restore the standard shell');
 const eventCount=shellDocument.events.length;
 if(shellApi.sync('unknown')!==false||shellDocument.events.length!==eventCount)fail.push('ui-shell accepts or announces an unknown view');
}catch(error){fail.push('ui-shell runtime contract test throws: '+error.message)}

function testNavElement(page,tier){return{dataset:page?{page,navTier:tier}:{},classList:testClassList(),attributes:{},listeners:{},setAttribute(name,value){this.attributes[name]=value},removeAttribute(name){delete this.attributes[name]},addEventListener(type,listener){this.listeners[type]=listener}}}
const navPages=Object.fromEntries(requiredIds.map(id=>[id,{id,classList:testClassList(id==='home'?['active']:[])}]));
const navTiers=['primary','primary','primary','primary','secondary','secondary','flow','secondary','flow','flow'];
const navButtons=requiredIds.map((id,index)=>testNavElement(id,navTiers[index])),overflowButtons=navButtons.slice(4);
const navPanel={classList:testClassList(),querySelector(selector){const button=overflowButtons.find(item=>selector.includes(`"${item.dataset.page}"`));return button&&!(selector.includes(':not([data-nav-tier="flow"])')&&button.dataset.navTier==='flow')?button:null}};
const navMoreTest=testNavElement();navMoreTest.attributes['aria-expanded']='false';
const navTitle={textContent:'主大厅'},navDocumentListeners={},syncedViews=[];
const navDocument={body:{classList:testClassList()},querySelectorAll(selector){if(selector==='.page')return Object.values(navPages);if(selector==='.nav button[data-page]')return navButtons;return[]},getElementById(id){return id==='mobileNavPanel'?navPanel:id==='navMore'?navMoreTest:id==='pageTitle'?navTitle:navPages[id]},addEventListener(type,listener){navDocumentListeners[type]=listener}};
try{
 const navContext=vm.createContext({document:navDocument,resizeArena:()=>{},WW:{ui:{shell:{sync:id=>syncedViews.push(id)}}}});vm.runInContext(navigationBlock,navContext);
 navMoreTest.listeners.click();
 if(!navPanel.classList.contains('open')||navMoreTest.attributes['aria-expanded']!=='true')fail.push('More control does not open its panel and expose expanded state');
 navContext.go('modes');
 if(!navPages.modes.classList.contains('active')||navButtons[5].attributes['aria-current']!=='page'||!navMoreTest.classList.contains('active')||navPanel.classList.contains('open')||navTitle.textContent!=='游戏模式')fail.push('overflow navigation does not synchronize page, current item, More state, panel and title');
 navMoreTest.listeners.click();const escapeEvent={key:'Escape',prevented:false,stopped:false,preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true}};navDocumentListeners.keydown(escapeEvent);
 if(navPanel.classList.contains('open')||navMoreTest.attributes['aria-expanded']!=='false'||!escapeEvent.prevented||!escapeEvent.stopped)fail.push('Escape does not close and consume the open More panel');
 navContext.go('home');if(navMoreTest.classList.contains('active')||navButtons[0].attributes['aria-current']!=='page'||navTitle.textContent!=='主大厅')fail.push('primary navigation does not clear overflow state and restore current/title state');
 navContext.go('result');if(navMoreTest.classList.contains('active')||syncedViews.join(',')!=='modes,home,result')fail.push('flow-only navigation leaves More highlighted or bypasses direct shell synchronization');
}catch(error){fail.push('mobile navigation state test throws: '+error.message)}

const loadoutElements={};
function loadoutElement(){return{textContent:'',innerHTML:'',className:'',children:[],appendChild(child){this.children.push(child)}}}
const loadoutSave={
 hero:'H001',
 equip:{weapon:'EQW010',armor:'EQA010',accessory:'EQX010'},
 runes:['R046','R035','R033'],pet:'PET999',
 inventory:{gear:['EQW010','EQA010','EQX010'],runes:['R046','R035','R033'],pets:['PET999']}
};
const loadoutContext=vm.createContext({
 WW:{config:{
  hero:{H001:{name:'Hero'}},
  gear:{EQW001:{name:'Weapon',slot:'weapon',score:1},EQA001:{name:'Armor',slot:'armor',score:1},EQX001:{name:'Accessory',slot:'accessory',score:1}},
  rune:{R031:{name:'Rune 1',score:1},R012:{name:'Rune 2',score:1},R043:{name:'Rune 3',score:1}},
  pet:{PET001:{name:'Pet',score:1}}
 }},
 DEFAULT_SAVE:{hero:'H001',equip:{weapon:'EQW001',armor:'EQA001',accessory:'EQX001'},runes:['R031','R012','R043'],pet:'PET001'},
 save:loadoutSave,
 heroStats:()=>({hp:1,atk:1,def:1,aspd:1,crit:1}),combatPower:()=>1,persist:()=>{},toast:()=>{},
 document:{getElementById:id=>loadoutElements[id]||(loadoutElements[id]=loadoutElement()),createElement:loadoutElement}
});
const loadoutBefore=JSON.stringify(loadoutSave);
try{
 vm.runInContext(loadoutUi+'\nrenderLoadout();equipGear("EQW010");toggleRune("R046");setPet("PET999");',loadoutContext);
 if(JSON.stringify(loadoutSave)!==loadoutBefore)fail.push('early loadout rendering or stale-ID actions mutate preserved late-load IDs');
 if(loadoutElements.equipSlots.children.length!==3)fail.push('early loadout fallback does not render all equipment slots');
 if(!loadoutElements.runeSlots.innerHTML.includes('R031')||!loadoutElements.petSlot.innerHTML.includes('PET001'))fail.push('early loadout fallback does not use existing valid defaults');
}catch(error){
 fail.push('early loadout rendering throws for late-load or stale IDs: '+error.message);
}

if(fail.length){
 console.error('SMOKE FAIL');
 fail.forEach(x=>console.error('-',x));
 process.exit(1);
}

console.log('SMOKE OK: main pages, migrated hero/loadout/build/growth UIs, config aliases, runtime systems and V3.0 safety guards detected.');
