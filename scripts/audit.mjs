import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {runCampaignRoute} from './campaign-route.mjs';
import {runAssetPipelineGuard} from './asset-pipeline.mjs';
import {REQUIRED_INPUTS,REQUIRED_ROUTES,validateAcceptance} from './playtest-validate.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const html=read('index.html');
const css=read('assets/css/app.css');
const scripts=[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m=>m[1]);
const code=scripts.map(read).join('\n');
const stripComments=source=>source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g,'');
const loadedSources=new Map(scripts.map(file=>[file,stripComments(read(file))]));
let campaignRoute={ok:false,failures:['route not executed'],checks:{},curve:[],route:[],upgrades:[]};
try{campaignRoute=runCampaignRoute()}catch(error){campaignRoute.failures=[error.message]}
let assetPipeline={ok:false,failures:['asset pipeline not executed'],checks:{}};
try{assetPipeline=await runAssetPipelineGuard()}catch(error){assetPipeline.failures=[error.message]}

const gameData=read('assets/js/config/game-data.js');
const gameDataCode=stripComments(gameData);
const heroes=read('assets/js/ui/heroes.js');
const heroesCode=stripComments(heroes);
const loadout=read('assets/js/ui/loadout.js');
const loadoutCode=stripComments(loadout);
const build=read('assets/js/ui/build.js');
const buildCode=stripComments(build);
const world=read('assets/js/ui/world.js');
const worldCode=stripComments(world);
const engine=read('assets/js/combat/engine.js');
const engineCode=stripComments(engine);
const director=read('assets/js/systems/director-balance.js');
const directorCode=stripComments(director);
const saveSlots=read('assets/js/systems/save-slots-start.js');
const saveSlotsCode=stripComments(saveSlots);
const renderSaveCardsBlock=saveSlotsCode.slice(saveSlotsCode.indexOf('function renderSaveCards()'),saveSlotsCode.indexOf('function loadSlot('));
const qualityPresentation=read('assets/js/presentation/quality-presentation.js');
const qualityPresentationCode=stripComments(qualityPresentation);
const artCinematics=read('assets/js/presentation/art-ui-cinematics.js');
const artCinematicsCode=stripComments(artCinematics);
const heroIdentity=read('assets/js/combat/hero-identity.js');
const heroIdentityCode=stripComments(heroIdentity);
const skillForms=read('assets/js/combat/skill-forms.js');
const skillFormsCode=stripComments(skillForms);
const bossInteractions=read('assets/js/combat/boss-map-interactions.js');
const bossInteractionsCode=stripComments(bossInteractions);
const gearSystem=read('assets/js/systems/gear-affix-loot.js');
const gearSystemCode=stripComments(gearSystem);
const runePetSystem=read('assets/js/systems/runes-pets.js');
const runePetSystemCode=stripComments(runePetSystem);
const metaGrowth=read('assets/js/systems/meta-growth.js');
const metaGrowthCode=stripComments(metaGrowth);
const gameModes=read('assets/js/systems/game-modes.js');
const gameModesCode=stripComments(gameModes);
const stability=read('assets/js/core/stability-v30.js');
const shellCode=loadedSources.get('assets/js/ui/ui-shell.js')||'';
const nexusHubCode=loadedSources.get('assets/js/ui/nexus-hub.js')||'';
const playtestProtocol=read('playtest/PROTOCOL.md');
const playtestTemplate=JSON.parse(read('playtest/session-template.json'));
const playtestValidation=validateAcceptance(playtestTemplate);
const stabilityCode=stripComments(stability);
const tutorialSettings=read('assets/js/ui/tutorial-settings.js');
const resultUi=read('assets/js/ui/result.js');
const resultUiCode=stripComments(resultUi);
const migrationAudit=read('handoff/CONFIG_MIGRATION_AUDIT.md');
const heroCombatConfigBlock=heroIdentity.slice(
 heroIdentity.indexOf('window.WW.config.heroIdentity.combat='),
 heroIdentity.indexOf('function v23P')
);
const heroSkillNamesConfigBlock=heroIdentity.slice(
 heroIdentity.indexOf('window.WW.config.heroIdentity.skillNames='),
 heroIdentity.indexOf(';const _v23sn=')
);
const runeConfigBlock=runePetSystem.slice(
 runePetSystem.indexOf('window.WW.config.runePetSystem.runes='),
 runePetSystem.indexOf('Object.assign(WW.config.rune')
);
const petConfigBlock=runePetSystem.slice(
 runePetSystem.indexOf('window.WW.config.runePetSystem.pets='),
 runePetSystem.indexOf('function v27RuneTypeLabel')
);
const modeConfigBlock=gameModes.slice(
 gameModes.indexOf('window.WW.config.mode='),
 gameModes.indexOf('window.WW.config.gameModes.bossOrder=')
);
const dailyConfigBlock=gameModes.slice(
 gameModes.indexOf('window.WW.config.gameModes.dailyChallenges='),
 gameModes.indexOf('function v29DateKey')
);
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
const worldBlock=html.slice(html.indexOf('<section class="page" id="world"'),html.indexOf('<section class="page" id="battle"'));
const battleBlock=html.slice(html.indexOf('<section class="page" id="battle"'),html.indexOf('<section class="page" id="result"'));
const resultBlock=html.slice(html.indexOf('<section class="page" id="result"'),html.indexOf('\n</section>',html.indexOf('<section class="page" id="result"'))+11);
const renderResultBlock=resultUiCode.slice(resultUiCode.indexOf('function renderResult()'),resultUiCode.indexOf('function renderSettingsToggles'));
const renderWorldBlock=worldCode.slice(worldCode.indexOf('function renderWorld()'),worldCode.indexOf('function selectWorldChapter('));
const selectWorldChapterBlock=worldCode.slice(worldCode.indexOf('function selectWorldChapter('),worldCode.indexOf('function selectWorldStage('));
const selectWorldStageBlock=worldCode.slice(worldCode.indexOf('function selectWorldStage('),worldCode.indexOf('function renderStageList('));
const renderStageListBlock=worldCode.slice(worldCode.indexOf('function renderStageList()'));
const startBattleBlock=engineCode.slice(engineCode.indexOf('function startBattle()'),engineCode.indexOf('function mapEnemyIds('));
const renderHeroHallBlock=heroesCode.slice(heroesCode.indexOf('function renderHeroHall()'),heroesCode.indexOf('function focusHero('));
const focusHeroBlock=heroesCode.slice(heroesCode.indexOf('function focusHero('),heroesCode.indexOf('function confirmHeroSelection('));
const heroPreviewBlock=heroesCode.slice(heroesCode.indexOf('function v34HeroSelectionPreview('),heroesCode.indexOf('function renderHeroes('));
const confirmHeroBlock=heroesCode.slice(heroesCode.indexOf('function confirmHeroSelection('),heroesCode.indexOf('function v34BuildNames('));
const cancelHeroBlock=heroesCode.slice(heroesCode.indexOf('function v34CancelHeroSelection('),heroesCode.indexOf('function applyHeroSelection('));
const applyHeroBlock=heroesCode.slice(heroesCode.indexOf('function applyHeroSelection('),heroesCode.indexOf('function selectHero('));
const selectHeroBlock=heroesCode.slice(heroesCode.indexOf('function selectHero('));
const focusLoadoutBayBlock=loadoutCode.slice(loadoutCode.indexOf('function focusLoadoutBay('),loadoutCode.indexOf('function equipGear('));
const renderBuildBlock=buildCode.slice(buildCode.indexOf('function renderBuild()'),buildCode.indexOf('function renderBuildSlots('));
const focusBuildLibraryBlock=buildCode.slice(buildCode.indexOf('function focusBuildLibrary('),buildCode.indexOf('function toggleBuild('));
const setGrowthTabBlock=metaGrowthCode.slice(metaGrowthCode.indexOf('function v28SetGrowthTab('),metaGrowthCode.indexOf('function v28HeroStep('));
const renderGrowthBlock=metaGrowthCode.slice(metaGrowthCode.indexOf('function v28Render()'),metaGrowthCode.indexOf('function v28LevelUp('));
const navButtonTags=[...navBlock.matchAll(/<button\b[^>]*\bdata-page="([^"]+)"[^>]*>/g)].map(match=>({id:match[1],tag:match[0]}));
const navTierIds=tier=>navButtonTags.filter(item=>item.tag.includes(`data-nav-tier="${tier}"`)).map(item=>item.id);
const navigationBlock=gameDataCode.slice(gameDataCode.indexOf('const PAGE_TITLES='),gameDataCode.indexOf('function chapterStars('));
const openingTag=id=>html.match(new RegExp('<[^>]+id=["\']'+id+'["\'][^>]*>'))?.[0]||'';
const storySandbox={window:{WW:{config:{}}}};
storySandbox.WW=storySandbox.window.WW;
vm.runInNewContext(gameData.slice(gameData.indexOf('window.WW.config.stage='),gameData.indexOf('const ELITE_AFFIXES=')),storySandbox);
storySandbox.save={selectedStage:'ST001-01',chapters:{ST001:{stars:{}},ST003:{stars:{}},ST004:{stars:{}}}};
vm.runInNewContext(gameData.slice(gameData.indexOf('function storyStageEntry('),gameData.indexOf('function gearScore(')),storySandbox);
const storyStages=Object.values(storySandbox.WW.config.stage).flatMap(chapter=>chapter.stages);
const storyIds=storyStages.map(stage=>stage[0]);
const expectedStoryIds=['ST001-01','ST001-02','ST001-03','ST001-04','ST003-01','ST003-02','ST003-03','ST003-04','ST004-01','ST004-02','ST004-03','ST004-04'];
const expectedStoryBosses={
 'ST001-01':['B001'],'ST001-02':[],'ST001-03':['B002'],'ST001-04':['B003'],
 'ST003-01':[],'ST003-02':[],'ST003-03':['B006'],'ST003-04':['B008'],
 'ST004-01':[],'ST004-02':[],'ST004-03':['B009','B010'],'ST004-04':['B011']
};
const storyBossRoutes=Object.fromEntries(storyStages.map(stage=>[stage[0],stage[5].bosses]));
const storyEncounters=storySandbox.WW.config.storyEncounters;
const storyCurve=storySandbox.WW.config.storyCurve||{};
const campaignCurveComplete=JSON.stringify(Object.keys(storyCurve))===JSON.stringify(expectedStoryIds)&&expectedStoryIds.every(id=>{
 const curve=storyCurve[id];
 return curve&&Number.isFinite(curve.budget)&&curve.beat&&curve.note&&['hp','dmg','speed','incoming','bossHp'].every(key=>Number.isFinite(curve[key])&&curve[key]>0);
});
const campaignCurveProgressive=expectedStoryIds.slice(1).every((id,index)=>storyCurve[id]?.budget>storyCurve[expectedStoryIds[index]]?.budget);
const encounterProfilesComplete=JSON.stringify(Object.keys(storyEncounters))===JSON.stringify(expectedStoryIds)&&storyStages.every(stage=>{
 const profile=storyEncounters[stage[0]];
 return profile&&profile.name&&profile.enemies.length>=3&&profile.waves.length>=5&&profile.eventPool.length>=2&&profile.eventAt.length>=2&&profile.chestAt.length>=2&&['fireline','fog','blast'].includes(profile.hazard.type)&&profile.hazard.name&&profile.hazard.desc&&profile.waves.at(-1).at===stage[5].duration&&profile.waves.at(-1).type==='end';
});
const adjacentEncountersDiffer=expectedStoryIds.slice(1).every((id,index)=>{
 const left=storyEncounters[expectedStoryIds[index]],right=storyEncounters[id];
 return [JSON.stringify(left.enemies)!==JSON.stringify(right.enemies),JSON.stringify(left.waves)!==JSON.stringify(right.waves),left.elite!==right.elite||left.horde!==right.horde||left.spawn!==right.spawn,JSON.stringify(left.eventAt)!==JSON.stringify(right.eventAt)||JSON.stringify(left.eventPool)!==JSON.stringify(right.eventPool),JSON.stringify(left.chestAt)!==JSON.stringify(right.chestAt),JSON.stringify(left.hazard)!==JSON.stringify(right.hazard)].filter(Boolean).length>=2;
});
const encounterBossRoutes=storyStages.every(stage=>JSON.stringify(storyEncounters[stage[0]].waves.filter(wave=>wave.type==='boss').flatMap(wave=>wave.bosses||[]))===JSON.stringify(stage[5].bosses));
let encounterDirectorRuntime=false,nonStoryDirectorRuntime=false;
try{
 const sandbox={save:{difficulty:'normal'},run:null};vm.runInNewContext(director.slice(0,director.indexOf('/* Wrap spawnEnemy')),sandbox);
 encounterDirectorRuntime=[['ST001-02',[]],['ST003-03',['B006']],['ST004-03',['B009','B010']]].every(([id,bosses])=>{
  sandbox.run={v29:{id:'story',rule:{storyEncounter:storyEncounters[id]}}};
  const plan=vm.runInNewContext('v19WavePlan().map(w=>({at:v19WaveSecond(w),type:w.type,bosses:w.bosses||[]}))',sandbox);
  return JSON.stringify(plan.filter(wave=>wave.type==='boss').flatMap(wave=>wave.bosses))===JSON.stringify(bosses)&&plan.at(-1).at===storySandbox.storyStageContract(id).duration;
 });
 sandbox.run={v29:{id:'clear',rule:{storyEncounter:storyEncounters['ST004-03']}}};
 nonStoryDirectorRuntime=JSON.stringify(vm.runInNewContext('v19WavePlan().map(w=>w.id)',sandbox))===JSON.stringify(Array.from({length:16},(_,index)=>'W'+String(index+1).padStart(2,'0')));
}catch{}
storySandbox.save.chapters.ST001.stars={'ST001-01':3,'ST001-02':3,'ST001-03':2,'ST001-04':0,'NOT-A-STAGE':3};
const eightStarsStayLocked=storySandbox.chapterStars('ST001')===8&&!storySandbox.storyStageUnlocked('ST003-01');
storySandbox.save.chapters.ST001.stars['ST001-04']=2;
const completedChapterUnlocks=storySandbox.storyStageUnlocked('ST003-01');
storySandbox.save.chapters.ST001.stars['ST001-01']=3;

const removedHeroIdentityAliases=[
 ['V23_HERO_COMBAT','combat'],
 ['V23_NAMES','skillNames']
];
const removedSkillFormAliases=[
 ['V24_FORM_DESC','descriptions'],
 ['V24_ELEMENT_PASSIVE','elementPassives'],
 ['V24_BASE_CD','baseCooldowns'],
 ['V24_EXTRA_NAMES','extraNames']
];
const removedBossInteractionAliases=[
 ['V25_BOSS','bosses'],
 ['V25_INTERACT_NAMES','interactionNames'],
 ['V25_INTERACT_DESC','interactionDescriptions'],
 ['V25_DAMAGE_NAMES','damageNames']
];
const removedGearAliases=[
 ['V26_GEAR_CATALOG','catalog'],
 ['V26_SETS','sets'],
 ['V26_AFFIX_POOL','affixPool'],
 ['V26_RARITY_AFFIX','rarityAffixCounts'],
 ['V26_BOSS_DROPS','bossDrops']
];
const removedRunePetAliases=[
 ['V27_RUNES','runes'],
 ['V27_PETS','pets']
];
const removedGameModeAliases=[
 ['V29_BOSS_ORDER','gameModes.bossOrder'],
 ['V29_BOSS_STAGE','gameModes.bossStages'],
 ['V29_DAILY','gameModes.dailyChallenges']
];
const removedBatchGAliases=[
 ['HEROES','hero'],
 ['SKILLS','skill'],
 ['EVOS','evolution'],
 ['BOSSES','boss'],
 ['V29_MODES','mode']
];
const removedBatchHAliases=[
 ['CHAPTERS','stage'],
 ['GEAR','gear'],
 ['RUNES','rune'],
 ['PETS','pet']
];
const removedCompatibilityAliases=[
 ...removedHeroIdentityAliases,
 ...removedSkillFormAliases,
 ...removedBossInteractionAliases,
 ...removedGearAliases,
 ...removedRunePetAliases,
 ...removedGameModeAliases,
 ...removedBatchGAliases,
 ...removedBatchHAliases
].map(([legacy])=>legacy);
const loadedCode=[...loadedSources.values()].join('\n');
const configAliasInventory=[];

function isAliasWrite(source,index,alias){
 const before=source.slice(Math.max(0,index-40),index);
 const after=source.slice(index+alias.length,index+alias.length+200);
 return /Object\.assign\(\s*$/.test(before)
  ||/^\s*=(?!=)/.test(after)
  ||/^\s*(?:\.[A-Za-z_$][\w$]*|\[[^\]\r\n]+\])+\s*=(?!=)/.test(after);
}

function runtimeAliasUsage(item){
 let reads=0,writes=0;
 const files=[];
 for(const [file,source] of loadedSources){
  const declarationPrefix='const '+item.alias+'=window.WW.config.'+item.formal+'=';
  const declarationIndex=file===item.declaration?source.indexOf(declarationPrefix):-1;
  const declarationTokenIndex=declarationIndex<0?-1:declarationIndex+6;
  let fileReads=0,fileWrites=0;
  for(const match of source.matchAll(new RegExp('\\b'+item.alias+'\\b','g'))){
   if(file===item.declaration&&match.index===declarationTokenIndex)continue;
   if(isAliasWrite(source,match.index,item.alias)){writes++;fileWrites++}
   else{reads++;fileReads++}
  }
  if(fileReads||fileWrites)files.push(file+':R'+fileReads+'/W'+fileWrites);
 }
 return {reads,writes,files};
}

const testSources=['scripts/smoke.mjs','scripts/audit.mjs']
 .map(file=>stripComments(read(file))).join('\n');
const aliasAudit=configAliasInventory.map(item=>{
 const usage=runtimeAliasUsage(item);
 const declarationSource=loadedSources.get(item.declaration)||'';
 const directAlias=declarationSource.includes(
  'const '+item.alias+'=window.WW.config.'+item.formal+'='
 );
 const tests=(testSources.match(new RegExp('\\b'+item.alias+'\\b','g'))||[]).length;
 return {...item,...usage,directAlias,tests};
});

const good=[
 ['Schema30',/const V30_SCHEMA=30/],
 ['zero stars',/'ST001-01':0,'ST001-02':0,'ST001-03':0,'ST001-04':0/],
 ['settlement guard',/run\.v30\.finalizing/],
 ['rift baseline',/riftEliteTarget=run\.riftEliteStart\+3/],
 ['Q alias',/e\.key\.toLowerCase\(\)==='q'/],
 ['bounded directional dodge',
  engineCode.includes('function movementVector()')
   &&engineCode.includes('move=length?{x:input.x/length,y:input.y/length}:dodgeDirection')
   &&engineCode.includes('distance=Math.min(90,player.speed*.34,Math.min(AW,AH)*.16)')
   &&engineCode.includes('player.x=Math.max(18,Math.min(WORLD_W-18,player.x+move.x*distance))')
   &&engineCode.includes('player.y=Math.max(18,Math.min(WORLD_H-18,player.y+move.y*distance))')
   &&engineCode.includes('player.dodgeCd=4.5;player.inv=.35')],
 ['Batch G formal configs',
  [['hero',gameData],['skill',gameData],['evolution',gameData],['boss',gameData],['mode',gameModes]]
   .every(([key,source])=>source.includes('window.WW.config.'+key+'='))],
 ['Batch G config sentinels',
  gameData.includes('window.WW.config.hero={')&&gameData.includes('H001:{')&&gameData.includes('H019:{')
   &&gameData.includes('window.WW.config.skill={A001:')&&gameData.includes('P043:')
   &&gameData.includes('window.WW.config.evolution={E001:')&&gameData.includes('SE018:')
   &&gameData.includes('window.WW.config.boss={')&&gameData.includes('B001:{')&&gameData.includes('B011:{')
   &&gameModes.includes('window.WW.config.mode={')],
 ['Batch H formal configs',
  ['stage','gear','rune','pet'].every(key=>gameData.includes('window.WW.config.'+key+'='))],
 ['Batch H config sentinels',
  gameData.includes('window.WW.config.stage={')&&gameData.includes('ST001:{')&&gameData.includes('ST004:{')
   &&gameData.includes('window.WW.config.gear={')&&gameData.includes('EQW001:{')&&gameData.includes('EQX007:{')
   &&gameData.includes('window.WW.config.rune={R031:')&&gameData.includes('R021:{')
   &&gameData.includes('window.WW.config.pet={PET001:')&&gameData.includes('PET015:{')],
 ['evolution formal config',/window\.WW\.config\.evolution=\{/],
['world stage config',/WW\.config\.stage/.test(world)&&!/\bCHAPTERS\b/.test(world)],
 ['Chapter migrated consumers',
  (gameDataCode.match(/\bCHAPTERS\b/g)||[]).length===0
   &&(gameData.match(/WW\.config\.stage/g)||[]).length===9
   &&gameData.includes("function recomputeWorldUnlocks(){WW.config.stage.ST001.unlock=true;WW.config.stage.ST003.unlock=storyStageUnlocked('ST003-01');WW.config.stage.ST004.unlock=storyStageUnlocked('ST004-01')}")
   &&[[engineCode,3],[directorCode,1],[saveSlotsCode,4],[qualityPresentationCode,1],[artCinematicsCode,1],[metaGrowthCode,1],[stabilityCode,4]].every(([source,count])=>
    !/\bCHAPTERS\b/.test(source)
     &&(source.match(/WW\.config\.stage/g)||[]).length===count
   )],
 ['skill migrated consumers',
  (gameDataCode.match(/\bSKILLS\b/g)||[]).length===0
   &&gameData.includes('function skillName(id){return WW.config.skill[id]||WW.config.evolution[id]?.[0]||FUSIONS[id]?.[0]||id}')
   &&(stability.match(/WW\.config\.skill\[id\]/g)||[]).length===2
   &&!/\bSKILLS\b/.test(stabilityCode)],
 ['evolution migrated consumers',
  (gameDataCode.match(/\bEVOS\b/g)||[]).length===0
   &&(gameData.match(/WW\.config\.evolution/g)||[]).length===3
   &&gameData.includes('function reachableBuildEvos(){return Object.entries(WW.config.evolution)')
   &&[[buildCode,1],[engineCode,3],[artCinematicsCode,5]].every(([source,count])=>
    !/\bEVOS\b/.test(source)
     &&(source.match(/WW\.config\.evolution/g)||[]).length===count
   )],
 ['rune/pet light-config migrated consumers',
  (gameDataCode.match(/\bRUNES\b/g)||[]).length===0
   &&(gameDataCode.match(/\bPETS\b/g)||[]).length===0
   &&gameData.includes('function runeScore(){return save.runes.reduce((s,id)=>s+(WW.config.rune[id]?.score||0),0)}')
   &&gameData.includes('function petScore(){return WW.config.pet[save.pet]?.score||0}')
   &&!/(?:\bRUNES\b|\bPETS\b)/.test(loadoutCode)
   &&(loadout.match(/WW\.config\.rune/g)||[]).length===7
   &&(loadout.match(/WW\.config\.pet/g)||[]).length===7],
 ['boss migrated consumers',
  (gameDataCode.match(/\bBOSSES\b/g)||[]).length===0
   &&[[engineCode,3],[directorCode,1],[qualityPresentationCode,1],[artCinematicsCode,2]].every(([source,count])=>
    !/\bBOSSES\b/.test(source)
     &&(source.match(/WW\.config\.boss/g)||[]).length===count
   )],
 ['hero presentation/save migrated consumers',
  [[saveSlotsCode,2],[qualityPresentationCode,2],[artCinematicsCode,3]].every(([source,count])=>
   !/\bHEROES\b/.test(source)
    &&(source.match(/WW\.config\.hero/g)||[]).length===count
  )],
 ['remaining Hero migrated consumers',
  (gameDataCode.match(/\bHEROES\b/g)||[]).length===0
   &&(gameData.match(/WW\.config\.hero/g)||[]).length===3
   &&[[engineCode,10],[metaGrowthCode,4],[stabilityCode,2]].every(([source,count])=>
    !/\bHEROES\b/.test(source)
     &&(source.match(/WW\.config\.hero/g)||[]).length===count
   )],
 ['Gear migrated consumers',
  (gameDataCode.match(/\bGEAR\b/g)||[]).length===0
   &&(gameData.match(/WW\.config\.gear/g)||[]).length===2
   &&[[loadoutCode,8],[engineCode,3],[directorCode,5],[artCinematicsCode,2]].every(([source,count])=>
    !/\bGEAR\b/.test(source)
     &&(source.match(/WW\.config\.gear/g)||[]).length===count
   )],
 ['hero identity formal configs',
  removedHeroIdentityAliases.every(([,key])=>
   heroIdentity.includes('window.WW.config.heroIdentity.'+key+'=')
  )],
 ['hero identity compatibility aliases removed',
  removedHeroIdentityAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(heroIdentityCode)
  )],
 ['hero identity migrated consumers',
  !/\bHEROES\b/.test(heroIdentityCode)],
 ['6 hero combat identities',(heroCombatConfigBlock.match(/\bH\d{3}:\{/g)||[]).length===6],
 ['19 hero skill names',(heroSkillNamesConfigBlock.match(/\bH\d{3}_[A-Z]+:/g)||[]).length===19],
 ['skill forms formal configs',
  removedSkillFormAliases.every(([,key])=>
   skillForms.includes('window.WW.config.skillForms.'+key+'=')
  )],
 ['skill forms compatibility aliases removed',
  removedSkillFormAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(skillFormsCode)
  )],
 ['skill forms migrated consumers',
  !/(?:\bEVOS\b|\bCHAPTERS\b|\bHEROES\b)/.test(skillFormsCode)],
 ['boss interactions formal configs',
  removedBossInteractionAliases.every(([,key])=>
   bossInteractions.includes('window.WW.config.bossInteractions.'+key+'=')
  )],
 ['boss interactions compatibility aliases removed',
  removedBossInteractionAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(bossInteractionsCode)
  )],
 ['boss interactions migrated consumers',
  removedBossInteractionAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(bossInteractionsCode)
  )],
 ['gear system formal configs',
  removedGearAliases.every(([,key])=>
   gearSystem.includes('window.WW.config.gearSystem.'+key+'=')
  )],
 ['gear compatibility aliases removed',
  removedGearAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(gearSystemCode)
  )],
 ['gear system migrated consumers',
  !/(?:\bGEAR\b|\bRUNES\b|\bPETS\b|\bHEROES\b|\bBOSSES\b|\bCHAPTERS\b|\bV24_FORM_DESC\b)/.test(gearSystemCode)],
 ['gear catalog in-place extension',
  gearSystem.includes('Object.assign(WW.config.gear,WW.config.gearSystem.catalog)')],
 ['rune/pet formal configs',
  removedRunePetAliases.every(([,key])=>
   runePetSystem.includes('window.WW.config.runePetSystem.'+key+'=')
  )],
 ['rune/pet compatibility aliases removed',
  removedRunePetAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(runePetSystemCode)
  )],
 ['rune/pet migrated consumers',
  !/(?:\bRUNES\b|\bPETS\b|\bHEROES\b|\bCHAPTERS\b|\bV24_BASE_CD\b)/.test(runePetSystemCode)],
 ['rune projection in-place',
  runePetSystem.includes('Object.assign(WW.config.rune,Object.fromEntries(Object.entries(WW.config.runePetSystem.runes)')],
 ['rune index derived',
  runePetSystem.includes('const V27_RUNE_IDS=Object.keys(WW.config.runePetSystem.runes)')],
 ['pet configs remain separate',
  !/Object\.assign\(WW\.config\.pet/.test(runePetSystemCode)],
 ['20 rich runes',(runeConfigBlock.match(/^\s*R\d{3}:/gm)||[]).length===20],
 ['5 rich pets',(petConfigBlock.match(/^\s*PET\d{3}:/gm)||[]).length===5],
 ['mode formal config',
  gameModes.includes('window.WW.config.mode=')],
 ['game mode formal configs',
  removedGameModeAliases.every(([,key])=>
   gameModes.includes('window.WW.config.'+key+'=')
  )],
 ['game mode compatibility aliases removed',
  removedGameModeAliases.every(([legacy])=>
   !new RegExp('\\b'+legacy+'\\b').test(gameModesCode)
  )],
 ['29 removed compatibility aliases absent from loaded runtime',
  removedCompatibilityAliases.length===29
   &&removedCompatibilityAliases.every(legacy=>
    !new RegExp('\\b'+legacy+'\\b').test(loadedCode)
   )],
['mode migrated consumers',
  (gameModes.match(/\bV29_MODES\b/g)||[]).length===0
   &&!/(?:\bCHAPTERS\b|\bHEROES\b)/.test(gameModesCode)
   &&stability.includes("if(typeof WW.config.mode!=='undefined'&&!WW.config.mode[s.mode])s.mode='story';else s.mode=s.mode||'story';")
   &&!/\bV29_MODES\b/.test(stabilityCode)],
 ['config migration audit inventory',
  configAliasInventory.every(item=>migrationAudit.includes('| `'+item.alias+'` |'))
   &&removedCompatibilityAliases.every(alias=>migrationAudit.includes('| `'+alias+'` |'))],
 ['7 formal modes',(modeConfigBlock.match(/^\s*[a-z]+:\{/gm)||[]).length===7],
 ['8 Boss order entries',
  gameModes.includes("bossOrder=['B001','B002','B003','B006','B008','B009','B010','B011']")],
 ['8 Boss stage mappings',
  (gameModes.match(/B\d{3}:'ST\d{3}-\d{2}'/g)||[]).length===8],
 ['first campaign milestone contract',
  /firstCampaign=\{stage:'ST001-01',bossId:'B001',duration:360,bossAt:270,eventAt:\[45,150\],chestAt:\[90,210\]/.test(gameModes)],
 ['first campaign pacing contract',
  gameModes.includes("chestAt:[90,210],spawn:.88,hp:.90,dmg:.82,speed:.96,incoming:.44,recoveryAt:[75,165,255,300,330],recoveryRatio:.22,telegraphScale:1.65,bossHp:3.00")],
 ['V3.3.8 first Boss engagement guards',
  ['firstBossTargetScoped','firstBossTargetFallthrough','firstBossTargetConsumed','firstBossGuideScoped','firstBossGuidePriority','firstBossGuideConsumed','firstBossCastCleanup','firstBossGuideResponsive','firstBossOutcomeVisibility','firstBossInteractionAuthority','firstBossNoNewAuthority'].every(name=>assetPipeline.checks[name])],
 ['first campaign B001 stage',
  gameData.includes("['ST001-01','边境清剿',true,260,'B001',{objective:")],
 ['12-stage Story route order',JSON.stringify(storyIds)===JSON.stringify(expectedStoryIds)],
 ['distinct Story titles and objectives',new Set(storyStages.map(stage=>stage[1])).size===12&&new Set(storyStages.map(stage=>stage[5].objective)).size===12],
 ['Story duration contract',storyStages.every((stage,index)=>stage[5].duration===(index===0?360:1200))],
 ['Story Boss route',JSON.stringify(storyBossRoutes)===JSON.stringify(expectedStoryBosses)],
 ['strict Story unlock chain',storyStages.every((stage,index)=>stage[5].unlockAfter===(index===0?null:storyIds[index-1]))&&eightStarsStayLocked&&completedChapterUnlocks],
 ['Story stars derived from formal stages',storySandbox.chapterStars('ST001')===10],
 ['Story defeat and mastery thresholds',storySandbox.storyStarAward(false,100,100)===0&&storySandbox.storyStarAward(true,55,100)===2&&storySandbox.storyStarAward(true,56,100)===3],
 ['Story stars remain monotonic',storySandbox.storyBestStars('ST001-01',2)===3],
 ['Story reward contract',storyStages.every(stage=>stage[5].reward.starGold===100)],
 ['V3.3.4 complete Story pressure budgets',campaignCurveComplete],
 ['V3.3.4 progressive adjacent pressure budgets',campaignCurveProgressive],
 ['V3.3.4 isolated Schema30 route reaches ST004-03 and unlocks ST004-04',campaignRoute.ok&&campaignRoute.checks.freshSchema&&campaignRoute.checks.initialEntry&&campaignRoute.checks.finalUnlock&&campaignRoute.checks.routeMonotonic],
 ['V3.3.4 every Story entry has deterministic pressure and positive Boss margin',campaignRoute.checks.allStageEntries&&campaignRoute.curve.length===12&&campaignRoute.checks.bossMargins],
 ['V3.3.4 defeat, retry, replay and one-settlement guards execute',campaignRoute.checks.replayMonotonic&&campaignRoute.route.some(attempt=>attempt.attempt==='defeat'&&attempt.stars===0)&&campaignRoute.route.some(attempt=>attempt.attempt==='retry'&&attempt.victory)&&campaignRoute.route.every(attempt=>attempt.settlements===1&&attempt.baseSettlements===1)],
 ['V3.3.4 dual-Boss, attainable growth and non-Story isolation execute',campaignRoute.checks.dualBossPhase1Rejected&&campaignRoute.checks.dualBossPhase2Accepted&&campaignRoute.checks.growthAttainable&&campaignRoute.upgrades.length>=3&&campaignRoute.checks.nonStoryIsolation],
 ['V3.3.5 victory, defeat and completed-campaign handoff execute',campaignRoute.checks.firstVictoryHandoff&&campaignRoute.checks.defeatHandoff&&campaignRoute.checks.campaignComplete],
 ['V3.3.5 campaign handoff mutates mission selection only',campaignRoute.checks.victoryHandoffSelectionOnly&&campaignRoute.checks.defeatHandoffSelectionOnly],
 ['V3.3.6 Slice 1 base roles remain declared and consumed',assetPipeline.ok&&assetPipeline.checks.fourRoles&&assetPipeline.checks.localPaths&&assetPipeline.checks.scopedEntries&&assetPipeline.checks.exactEntities&&assetPipeline.checks.scopedConsumers],
 ['V3.3.6 Slice 2 six combat frames are declared and state-projected',assetPipeline.ok&&assetPipeline.checks.manifestV2&&assetPipeline.checks.animationRoles&&assetPipeline.checks.uniqueRoles&&assetPipeline.checks.animationConsumers&&assetPipeline.checks.stateProjection],
 ['V3.3.6 Slice 2 layered visual fallbacks remain executable',assetPipeline.ok&&assetPipeline.checks.layeredFallbacks&&assetPipeline.checks.allSuccessReady&&assetPipeline.checks.mixedPartial&&assetPipeline.checks.allFailureFallback&&assetPipeline.checks.failedRoleFallsThrough&&assetPipeline.checks.failedActionKeepsBase&&assetPipeline.checks.rotatedActionDraws&&assetPipeline.checks.outOfScopeFallsThrough],
 ['V3.3.3 twelve complete encounter profiles',encounterProfilesComplete],
 ['V3.3.3 adjacent stages differ in two visible dimensions',adjacentEncountersDiffer],
 ['V3.3.3 encounter Boss routes match campaign contracts',encounterBossRoutes],
 ['V3.3.3 Story Director consumes normal, single-Boss and dual-Boss plans',encounterDirectorRuntime
  &&director.includes('function v19WavePlan(){ return v19StoryEncounter()?.waves||V19_WAVES; }')
  &&director.includes('(encounter?.elite||1)')
  &&director.includes('baseBurst*(encounter?.horde||1)')],
 ['V3.3.3 non-Story Director keeps the V19 plan',nonStoryDirectorRuntime
  &&director.includes('if(!v19StoryEncounter()){')
  &&director.includes("if(!encounter&&w.type==='boss'")],
 ['V3.3.3 enemy weights and event pools consume the selected Story profile',
  engine.includes("const profile=run?.v29?.id==='story'?run.v29.rule?.storyEncounter:null")
   &&engine.includes('profile.enemies.reduce((sum,row)=>sum+row[1],0)')
   &&engine.includes('profile?.eventPool?.length?MAP_EVENTS.filter')],
 ['V3.3.3 fireline, fog and blast consume encounter hazard parameters',
  engine.includes("hazard.type==='fireline'")
   &&engine.includes("hazard.type==='fog'")
   &&engine.includes("hazard.type==='blast'")
   &&engine.includes('r:hazard.size,life:hazard.life,dmg:hazard.damage')],
 ['V3.4 Story events and Boss timing remain authoritative while active timed rewards replace automatic chests',
  gameModes.includes('v29FirstCampaignMilestone(encounter.eventAt,run.events,showEvent)')
   &&engine.includes('Array.isArray(rule?.storyEncounter?.chestAt)?rule.storyEncounter.chestAt.filter')
   &&!/v29FirstCampaignMilestone\([^\n;]*chestAt[^\n;]*showChest/.test(gameModesCode)
   &&gameModes.includes('contract?.bosses.length&&r.bossAt!=null')
   &&director.includes('if(!v19StoryEncounter()){')],
 ['V3.3.3 encounter evidence records only executed waves, events, chests, hazards and Bosses',
  director.includes('run.v29.encounterEvidence.waves.push')
   &&engine.includes('run.v29.encounterEvidence.chests.push')
   &&engine.includes('run.v29.encounterEvidence.events.push')
   &&engine.includes('evidence.hazardTriggers++')
   &&gameModes.includes('function v29RecordActiveBoss()')
   &&gameModes.includes('lastResult.encounterEvidence=JSON.parse(JSON.stringify(run.v29.encounterEvidence))')],
 ['V3.3.3 loading, map, timeline, threat, log and result surfaces use encounter identity',
  gameModes.includes("loadingStage').textContent=WW.config.mode[save.mode].name")
   &&world.includes("selectedEncounter.name+' · '+selectedEncounter.hazard.name")
   &&gameModes.includes('v29EncounterSchedule(r.storyEncounter,r.storyContract)')
   &&director.includes("e.textContent='第 '+(plan.indexOf(w)+1)+' 阶段 · '+w.name")
   &&director.includes("log('怪潮升级 → '+w.name)")
   &&gameModes.includes('<span>实际节奏</span>')],
 ['V3.3.3 first-stage pacing and V3.3.2 progression regression contract',
  storyEncounters['ST001-01'].spawn===.88
   &&JSON.stringify(storyEncounters['ST001-01'].eventAt)===JSON.stringify([45,150])
  &&JSON.stringify(storyEncounters['ST001-01'].chestAt)===JSON.stringify([90,210])
  &&storySandbox.storyStageContract('ST001-01').duration===360
  &&storySandbox.storyStageContract('ST001-01').bossAt===270
   &&gameModes.includes('spawn:.88,hp:.90,dmg:.82,speed:.96,incoming:.44,recoveryAt:[75,165,255,300,330],recoveryRatio:.22,telegraphScale:1.65,bossHp:3.00')
  &&gameModes.includes("if(id!=='story'||!victory){")
   &&stability.includes('run.v30.finalizing')],
 ['Story runtime consumes selected-stage contract, encounter and pressure curve',
  gameModes.includes("curve=WW.config.storyCurve?.[save.selectedStage]||null")
   &&gameModes.includes("...(curve||{}),duration:contract.duration")
   &&gameModes.includes("storyContract:contract,storyEncounter:encounter,storyCurve:curve")],
 ['Story battle entry enforces prerequisite',
  gameModes.includes("if(save.mode==='story'&&!storyStageUnlocked(save.selectedStage)){toast('前置关卡未完成');go('world');return}")],
 ['ordinary Story stages do not spawn or complete Boss goals',
  gameModes.includes("if(contract?.bosses.length&&r.bossAt!=null&&run.time>=r.bossAt&&!run.boss&&!run.bossDefeated)v29SpawnBossId(v29BossForStage())")
   &&gameModes.includes("r.storyContract?.bosses.length&&storyBossGoalComplete(r.storyContract)")],
 ['ST004-03 dual-Boss proxy and accounting',
  gameModes.includes("return bosses[bosses.length-1]||stage[4]||'B001'")
   &&stability.includes("save.selectedStage==='ST004-03'")
   &&stability.includes("old=save.selectedStage;save.selectedStage='ST004-01';_v30SpawnBoss();save.selectedStage=old")
   &&stability.includes('if(run.boss&&run.v29)run.v29.lastBossSeen=run.boss.id')],
 ['Story loading and battle copy use stage contract',
  gameModes.includes("(rule.firstCampaign?rule.desc:rule.target)+' · '+encounter.hazard.name")
   &&gameModes.includes("target=r.target||('坚持 '")
   &&gameModes.includes('v29EncounterSchedule(r.storyEncounter,r.storyContract)')],
 ['Story settlement copy and title remain stage-specific',
  gameModes.includes('storyStageSuccess(save.selectedStage):storyStageTimeout(save.selectedStage)')
   &&gameModes.includes("if(lastResult.modeId!=='story')document.getElementById('resultTitle').textContent=")],
 ['Story result reward breakdown reconciles tuned gold',
  director.includes('lastResult.directorGoldDelta=tuned-base')
   &&director.includes('难度/表现金币')],
 ['ordinary Story result hides placeholder Boss phase',
  bossInteractions.includes("showBossPhase=!lastResult.storyReward||(storyStageContract(lastResult.stage?.[0])?.bosses.length||0)>0")],
 ['legacy 20-minute settlement excludes Story only',
  [engine,director].every(source=>source.includes("if(run.time>=20*60&&(save.mode||'story')!=='story')"))],
 ['later Story remains 1200 seconds',
  /story:\{[^\r\n]*duration:1200/.test(modeConfigBlock)],
 ['first campaign scope isolation',
  gameModes.includes("function v29IsFirstCampaign(id=save.mode,stage=save.selectedStage){return id==='story'&&stage===WW.config.gameModes.firstCampaign.stage}")
   &&gameModes.includes("if(v29IsFirstCampaign(id)){base={...base,...WW.config.gameModes.firstCampaign,firstCampaign:true}}")],
 ['first campaign enemy pacing and distinct Boss HP',
  gameModes.includes('e.hp*=r.hp;e.maxHp*=r.hp;e.damage*=r.dmg;e.speed*=r.speed')
   &&gameModes.includes('bossHp=r.bossHp??r.hp;run.boss.hp*=bossHp;run.boss.maxHp*=bossHp')],
 ['Story incoming-damage curve isolation',
  gameModes.includes("const _v29HurtPlayer=hurtPlayer;hurtPlayer=function(dmg){let r=run?.v29?.rule;if(Number.isFinite(r?.incoming))dmg*=r.incoming;_v29HurtPlayer(dmg)}")],
 ['first campaign timeout defeat',
  gameModes.includes("if(run.time>=r.duration)return finishRun(false,'首战时限到达 · 黄巾巨将未击败')")],
 ['Boss loot before first campaign victory',
  gameModes.includes("bossLoot=run.drops?.some(drop=>drop.source==='boss')")
   &&gameModes.includes('if(v29FirstCampaignLootResolved()){')
   &&gameModes.includes('run.time-run.v29.lootResolvedAt<.75')
   &&gameModes.includes('run.time-run.v29.settlingAt<.25')
   &&gameModes.includes("return finishRun(true,'黄巾巨将已击败 · Boss战利品已领取并归档')")
   &&gameModes.includes('if(run.bossDefeated&&run.v26BossLootShown===true)return;')],
 ['scoped Boss auto-targeting',
  heroIdentity.includes('function v23AutoTarget(){return v338FirstBossTarget(nearest(),run.boss)}')
   &&heroIdentity.includes('let h=save.hero,t=v23AutoTarget();')],
 ['H002 Boss chain accounting isolation',
  heroIdentity.includes("if(t===run.boss)damageBoss(player.atk*.72,'H002_CHAIN');else v23Chain")],
 ['first campaign truthful copy',
  html.includes('id="homeCampaignLabel"')&&html.includes('id="homeCampaignTime"')&&html.includes('id="battleSchedule"')
   &&gameModes.includes("document.getElementById('v29CurrentDesc').textContent=r.desc")
   &&gameModes.includes("document.getElementById('missionTargetText').textContent=r.target||r.desc")
   &&gameModes.includes('(rule.firstCampaign?rule.desc:rule.target)')&&gameModes.includes('):rule.desc;')
   &&gameModes.includes('首战保护已启用')&&gameModes.includes("tags:['6分钟首战','首战保护','Boss战利品']")&&gameModes.includes("schedule.textContent=r.firstCampaign?'首战保护 ·")
   &&!engine.includes('5/10/15分钟宝箱可触发进化或融合')],
 ['Story pressure beat is visible in battle',
  gameModes.includes('<span>压力节拍</span>')
   &&gameModes.includes("r.storyCurve.beat+' · '+r.storyCurve.budget.toFixed(2)")],
 ['4 daily challenges',(dailyConfigBlock.match(/^\s*\{name:/gm)||[]).length===4],
 ['daily config rotation',
  gameModes.includes('dailyChallenges[n%WW.config.gameModes.dailyChallenges.length]')],
 ['non-story star isolation',
  gameModes.includes("if(id!=='story'||!victory){")
   &&gameModes.includes("lastResult.modeId==='story'?")],
 ['save-manager slot-local total runs',
  renderSaveCardsBlock.includes("runCount=s.data.stats&&typeof s.data.stats==='object'&&!Array.isArray(s.data.stats)&&Number.isFinite(s.data.stats.runs)?s.data.stats.runs:DEFAULT_SAVE.stats.runs")
   &&renderSaveCardsBlock.includes("'<br>天赋点 '+(s.data.talentPoints??0)+'<br>总挑战次数 '+runCount+'<br>总击杀数 '")
   &&(renderSaveCardsBlock.match(/总挑战次数/g)||[]).length===1
   &&!/\bsave\.stats\.runs\b|modeStats|v30NormalizeSave/.test(renderSaveCardsBlock)],
 ['save-manager slot-local total kills',
  renderSaveCardsBlock.includes("killCount=s.data.stats&&typeof s.data.stats==='object'&&!Array.isArray(s.data.stats)&&Number.isFinite(s.data.stats.kills)?s.data.stats.kills:DEFAULT_SAVE.stats.kills")
   &&renderSaveCardsBlock.includes("'<br>总击杀数 '+killCount+'<br>Boss击杀数 '")
   &&(renderSaveCardsBlock.match(/总击杀数/g)||[]).length===1
   &&!/\bsave\.stats\.kills\b|modeStats|v30NormalizeSave/.test(renderSaveCardsBlock)],
 ['save-manager slot-local Boss kills',
  renderSaveCardsBlock.includes("bossKillCount=s.data.stats&&typeof s.data.stats==='object'&&!Array.isArray(s.data.stats)&&Number.isFinite(s.data.stats.bossKills)?s.data.stats.bossKills:DEFAULT_SAVE.stats.bossKills")
   &&renderSaveCardsBlock.includes("'<br>Boss击杀数 '+bossKillCount+'<br>最近访问 '")
   &&(renderSaveCardsBlock.match(/Boss击杀数/g)||[]).length===1
   &&!/\bsave\.stats\.bossKills\b|modeStats|v30NormalizeSave/.test(renderSaveCardsBlock)],
 ['save-manager slot-local account XP',
  renderSaveCardsBlock.includes('accountXp=Number.isFinite(s.data.accountXp)?s.data.accountXp:0')
   &&renderSaveCardsBlock.includes("'<br>账号经验 '+accountXp+' XP<br>英雄 '")
   &&(renderSaveCardsBlock.match(/账号经验/g)||[]).length===1
   &&!/\bsave\.accountXp\b|v28Ensure|v30NormalizeSave|(?:s\.data|save)\.accountXp\s*=|localStorage|saveV20Slots|snapshotActiveSlot|\bpersist\s*\(|\bmerge\s*\(/.test(renderSaveCardsBlock)],
 ['save-manager slot-local account level',
 renderSaveCardsBlock.includes('accountLv=Number.isFinite(s.data.accountLv)?s.data.accountLv:1')
   &&renderSaveCardsBlock.includes("<p>账号 Lv.'+accountLv+'<br>账号经验 ")
   &&!/\bsave\.accountLv\b|v28Ensure|v30NormalizeSave|(?:s\.data|save)\.accountLv\s*=|localStorage|saveV20Slots|snapshotActiveSlot|\bpersist\s*\(|\bmerge\s*\(/.test(renderSaveCardsBlock)],
 ['ordered read-only scene lobby projection',
  scripts.indexOf('assets/js/ui/nexus-hub.js')===scripts.indexOf('assets/js/ui/ui-shell.js')+1
   &&scripts.indexOf('assets/js/core/v31-project.js')===scripts.indexOf('assets/js/ui/nexus-hub.js')+1
   &&nexusHubCode.includes('WW.ui.nexusHub=Object.freeze(')
   &&!/(?:localStorage|sessionStorage|\bpersist\s*\(|\bsave\s*=(?!=)|\bsave\.[\w$]+\s*=(?!=))/.test(nexusHubCode)
   &&['go','continueFlow','startBattle','finishRun','renderResult','updateRun','drawRun'].every(name=>!new RegExp('\\b'+name+'\\s*=').test(nexusHubCode))
   &&(gameDataCode.match(/WW\.ui\?\.nexusHub\?\.render\(\)/g)||[]).length===1],
 ['scene entrance and lobby hierarchy',
  startBlock.includes('data-scene-entrance')
   &&['continueGame()','newGameConfirm()','openSaveManager()','openGlobalSettings()'].every(action=>startBlock.includes('onclick="'+action+'"'))
   &&homeBlock.includes('data-scene-lobby')
   &&['nexusScene','nexusMission','nexusFocus','nexusLoadout'].every(name=>homeBlock.includes('class="'+name+'"'))
   &&(homeBlock.match(/data-primary-action/g)||[]).length===1
   &&homeBlock.includes('data-primary-action onclick="go(\'modes\')"')
   &&['heroBanner','kpis','demoStatusCard','featureGrid'].every(name=>!homeBlock.includes('class="'+name))],
 ['semantic mobile hub navigation',
 navBlock.includes('<nav class="nav" aria-label="游戏主导航">')
   &&(navBlock.match(/<button type="button"[^>]*data-page=/g)||[]).length===9
   &&(mobileNavPanelBlock.match(/data-page=/g)||[]).length===5
   &&JSON.stringify(navTierIds('primary'))===JSON.stringify(['home','heroes','growth','loadout'])
   &&JSON.stringify(navTierIds('secondary'))===JSON.stringify(['build','modes','world'])
   &&JSON.stringify(navTierIds('flow'))===JSON.stringify(['battle','result'])
   &&navButtonTags.filter(item=>item.tag.includes('data-nav-tier="flow"')).every(item=>/\shidden(?:\s|>|=)/.test(item.tag)&&item.tag.includes('aria-hidden="true"')&&item.tag.includes('tabindex="-1"'))
   &&navButtonTags.find(item=>item.id==='home')?.tag.includes('aria-current="page"')
   &&navBlock.includes('id="navMore" aria-expanded="false" aria-controls="mobileNavPanel"')],
 ['desktop sidebar and safe-area five-column phone row',
  css.includes('.mobileNavPanel{display:contents}')
   &&css.includes('.nav>.navMore{display:none}')
   &&css.includes('grid-template-columns:repeat(5,minmax(0,1fr))')
   &&css.includes('height:calc(64px + env(safe-area-inset-bottom))')
   &&css.includes('padding:6px max(8px,env(safe-area-inset-right)) max(6px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))')
   &&css.includes('overflow:visible')
   &&css.includes('.mobileNavPanel.open{display:grid}')
   &&css.includes('min-height:44px')],
 ['compact phone top bar and scene lobby action',
 html.includes('class="pill pillEssential"')&&html.includes('class="pill pillSecondary"')
   &&css.includes('.tleft small,.pillSecondary{display:none}')
   &&css.includes('.nexusScene{grid-template-columns:minmax(0,1fr)}')
   &&css.includes('.nexusCommand{position:fixed')
   &&css.includes('bottom:calc(72px + env(safe-area-inset-bottom))')
   &&css.includes('padding-bottom:calc(152px + env(safe-area-inset-bottom))')
   &&css.includes('.toast{bottom:calc(76px + env(safe-area-inset-bottom))')],
 ['mobile progression page overflow containment',
  openingTag('heroes').includes('class="page"')
   &&html.includes('<section class="page" id="growth">')
   &&openingTag('loadout').includes('class="page"')
   &&html.includes('<section class="page" id="build">')
   &&css.includes('V3.2.34 MOBILE PROGRESSION PAGES')
   &&css.includes('#heroes,#growth,#loadout,#build{min-width:0;overflow-wrap:anywhere}')
   &&css.includes('#heroes .heroGrid,#growth .metaHeroHeader,#loadout .loadoutLayout,#build .buildLayout{grid-template-columns:minmax(0,1fr)}')],
 ['mobile progression one and two column density',
  css.includes('#growth .growthTabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}')
   &&css.includes('#growth .heroGrowthGrid,#growth .metaEffectGrid{grid-template-columns:repeat(2,minmax(0,1fr))')
   &&css.includes('#build .buildSlots{grid-template-columns:repeat(2,minmax(0,1fr))')
   &&css.includes('#build .skillPickGrid{grid-template-columns:repeat(2,minmax(0,1fr))')],
 ['44px mobile progression actions',
  css.includes('#heroes .actions .btn,#growth .actions .btn,#loadout .btn,#build .btn{width:100%;min-width:44px;min-height:44px')
   &&css.includes('#growth .growthTab{min-width:44px;min-height:44px')
   &&css.includes('#growth .talentNode{min-width:44px;min-height:124px')
   &&css.includes('#build .buildSlot{min-width:44px;min-height:76px')
   &&css.includes('#build .pick{min-width:44px;min-height:56px')],
 ['readable phone copy and unchanged desktop progression grids',
 css.includes('#heroes .heroIdentity small,#heroes .heroCombatStrip b{font-size:10px')
   &&css.includes('#growth .talentNode p{font-size:10px')
   &&css.includes('#loadout .itemCard p,#loadout .runeEffect small,#loadout .petCombatHero small,#loadout .petSkillBox{font-size:10px')
   &&css.includes('#build .pick b{font-size:10px')
   &&css.includes('.heroGrid{display:grid;grid-template-columns:repeat(3,1fr)')
   &&css.includes('.buildLayout{display:grid;grid-template-columns:360px minmax(0,1fr)')
   &&css.includes('.skillPickGrid{display:grid;grid-template-columns:repeat(5,1fr)')],
 ['scene-led hero hall structure and selected combat dossier',
  heroesBlock.includes('data-hero-hall')
   &&heroesBlock.includes('id="heroHallTitle"')
   &&heroesBlock.includes('id="heroHallHeroId"')
   &&heroesBlock.includes('id="heroHallHeroName"')
   &&heroesBlock.includes('id="heroHallHeroRole"')
   &&heroesBlock.includes('id="heroHallHeroState"')
   &&heroesBlock.includes('id="heroHallTrait"')
   &&heroesBlock.includes('id="heroHallBasic"')
   &&heroesBlock.includes('id="heroHallSkill"')
   &&heroesBlock.includes('id="heroHallUlt"')
   &&heroesBlock.includes('id="heroHallResource"')],
 ['six native hero preview controls preserve roster states',
  ['H001','H002','H007','H010','H012','H019'].every(id=>gameData.includes(' '+id+':{'))
   &&renderHeroHallBlock.includes('Object.entries(WW.config.hero)')
   &&renderHeroHallBlock.includes("d=document.createElement('button');d.type='button'")
   &&renderHeroHallBlock.includes('d.dataset.heroId=id')
   &&renderHeroHallBlock.includes("d.setAttribute('aria-pressed',String(heroHallFocusId===id))")
   &&renderHeroHallBlock.includes('save.hero===id')
   &&renderHeroHallBlock.includes('!heroSave.unlocked')
   &&renderHeroHallBlock.includes('d.onclick=()=>focusHero(id)')],
 ['hero preview is transient and restores native focus',
  focusHeroBlock.includes("document.activeElement?.classList.contains('heroRosterEntry')")
   &&focusHeroBlock.includes('heroHallFocusId=id;renderHeroHall()')
   &&focusHeroBlock.includes("document.querySelector('#heroGrid .heroRosterEntry[aria-pressed=\"true\"]')?.focus({preventScroll:true})")
   &&!/\bsave\.|\bpersist\s*\(|\bselectHero\s*\(/.test(focusHeroBlock)],
 ['explicit hero and build confirmation preserves preview, purchase and route authority',
  (heroesBlock.match(/data-hero-confirm/g)||[]).length===1
   &&heroesBlock.includes('onclick="confirmHeroSelection()"')
   &&!/startBattle\s*\(/.test(heroesBlock)
   &&heroPreviewBlock.includes('recommendedPreset:')
   &&!/\bsave\.|\bpersist\s*\(|localStorage/.test(heroPreviewBlock)
   &&confirmHeroBlock.includes('v34PendingHeroId=preview.heroId')
   &&confirmHeroBlock.includes("v32OpenLayer('heroConfirmOverlay')")
   &&!/\bsave(?:\.[\w$]+)+\s*(?:[+\-*/]?=|\+\+|--)|\bpersist\s*\(/.test(confirmHeroBlock)
   &&cancelHeroBlock.includes('v34PendingHeroId=null')
   &&applyHeroBlock.includes("choice!=='keep'&&choice!=='recommended'")
   &&applyHeroBlock.includes('save.gold-=price;heroSave.unlocked=true')
   &&applyHeroBlock.includes('save.hero=id')
   &&applyHeroBlock.includes("if(choice==='recommended')")
   &&applyHeroBlock.includes('save.build.active=[...preview.recommendedPreset.active]')
   &&applyHeroBlock.includes('save.build.passive=[...preview.recommendedPreset.passive]')
   &&applyHeroBlock.includes('persist()')
   &&applyHeroBlock.includes('v29ReturnToBriefing()')
   &&applyHeroBlock.includes("go('loadout')")
   &&selectHeroBlock.includes('confirmHeroSelection()')
   &&!/startBattle\s*\(/.test(confirmHeroBlock+applyHeroBlock)],
 ['hero hall survives ordered legacy presentation loading',
  heroesCode.includes("document.addEventListener('ui:view-change'")
   &&heroesCode.includes("event.detail?.id==='heroes'")
   &&heroesCode.includes('renderHeroHall()')],
 ['desktop first-viewport hero hall',
  css.includes('V3.3.5 SCENE HERO HALL')
   &&css.includes('body[data-shell-view="heroes"] .app{display:block')
   &&css.includes('.heroHall{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.heroHallScene{display:grid;grid-template-columns:190px minmax(0,1fr) 320px')
   &&css.includes('.heroHallCommand{position:relative')],
 ['phone hero rail and safe-area appointment action',
 css.includes('body[data-shell-view="heroes"] #heroes{min-width:0;min-height:calc(100dvh - 64px);overflow:visible;overflow-wrap:anywhere}')
   &&css.includes('#heroes .heroGrid{display:flex;overflow-x:auto;overflow-y:hidden')
   &&css.includes('.heroRosterEntry{flex:0 0 92px;min-width:92px;min-height:74px')
   &&css.includes('padding-bottom:calc(154px + env(safe-area-inset-bottom))')
   &&css.includes('.heroHallCommand{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom))')],
 ['scene-led expedition armory preserves all render bindings',
  loadoutBlock.includes('data-expedition-armory')
   &&loadoutBlock.includes('class="armoryHeroBay"')
   &&loadoutBlock.includes('class="armoryConfig"')
   &&loadoutBlock.includes('class="armoryArsenal"')
   &&['loadoutHeroName','loadoutHeroStats','equipSlots','runeSlots','petSlot','v26LoadoutBonuses','v26SetSummary','v27RuneEffects','v27RuneResonance','v27PetLoadout','gearGrid','runeGrid','petGrid'].every(id=>loadoutBlock.includes(`id="${id}"`))],
 ['three native armory category controls target the real same-page bays',
  (loadoutBlock.match(/data-loadout-target=/g)||[]).length===3
   &&['gear','runes','pets'].every((type,index)=>loadoutBlock.includes(`data-loadout-target="${type}" aria-pressed="${index===0?'true':'false'}" aria-controls="armory-${type}" onclick="focusLoadoutBay('${type}')"`))
   &&['gear','runes','pets'].every(type=>loadoutBlock.includes(`id="armory-${type}" class="armoryBay" data-loadout-bay="${type}" tabindex="-1"`))
   &&!/startBattle\s*\(/.test(loadoutBlock)],
 ['armory category navigation is presentation-only',
  focusLoadoutBayBlock.includes("document.querySelector('[data-loadout-bay=\"'+type+'\"]')")
   &&focusLoadoutBayBlock.includes("document.querySelectorAll('[data-loadout-target]')")
   &&focusLoadoutBayBlock.includes("button.setAttribute('aria-pressed',String(active))")
   &&focusLoadoutBayBlock.includes('target.focus({preventScroll:true})')
   &&focusLoadoutBayBlock.includes('Math.max(0,target.offsetTop-scroller.offsetTop-8)')
   &&!/\bsave\b|\bpersist\s*\(|\bequipGear\s*\(|\btoggleRune\s*\(|\bsetPet\s*\(|\bautoBest\s*\(/.test(focusLoadoutBayBlock)],
 ['desktop first-viewport expedition armory',
  css.includes('V3.3.5 SCENE EXPEDITION ARMORY')
   &&css.includes('body[data-shell-view="loadout"] .app{display:block;min-height:100dvh}')
   &&css.includes('.armoryScene{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.armoryDeck{display:grid;grid-template-columns:230px minmax(340px,.86fr) minmax(360px,1.14fr)')
   &&css.includes('.armoryInventoryScroll{min-height:0;overflow-y:auto;overflow-x:hidden')],
 ['phone armory rail, touch targets and safe-area containment',
  css.includes('body[data-shell-view="loadout"]{overflow-x:hidden;overflow-y:auto}')
   &&css.includes('.armoryCategoryRail{display:flex;overflow-x:auto;overflow-y:hidden')
   &&css.includes('.armoryCategory{flex:0 0 112px;min-width:112px;min-height:44px')
   &&css.includes('#loadout .armoryArsenal .itemGrid{grid-template-columns:minmax(0,1fr)}')
   &&css.includes('padding:calc(70px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(84px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))')],
 ['scene-led build sanctum preserves all render bindings',
  buildBlock.includes('data-build-sanctum')
   &&buildBlock.includes('class="buildHeroBay"')
   &&buildBlock.includes('class="buildMatrix"')
   &&buildBlock.includes('class="buildCodex"')
   &&['buildHeroName','activeCount','activeSlots','passiveCount','passiveSlots','presetGrid','skillPickGrid','buildEntityCount','buildEvoCount','buildFusionCount','buildFormPanel'].every(id=>buildBlock.includes(`id="${id}"`))],
 ['three native build codex controls target real same-page sections',
  (buildBlock.match(/data-build-target=/g)||[]).length===3
   &&['active','passive','presets'].every((type,index)=>buildBlock.includes(`data-build-target="${type}" aria-pressed="${index===0?'true':'false'}" aria-controls="build-library-${type}" onclick="focusBuildLibrary('${type}')"`))
   &&['active','passive','presets'].every(type=>buildBlock.includes(`id="build-library-${type}" class="buildLibraryBay" data-build-library="${type}" tabindex="-1"`))
   &&!/startBattle\s*\(/.test(buildBlock)],
 ['armory and build sanctum use configuration-only handoff paths',
  (loadoutBlock.match(/data-build-handoff/g)||[]).length===1
   &&loadoutBlock.includes('data-build-handoff onclick="v29CompleteLoadout()"')
   &&briefingCompleteLoadoutBlock.includes("go('build')")
   &&buildBlock.includes('onclick="go(\'loadout\')"')
   &&briefingCompleteBuildBlock.includes("go('world')")
   &&buildBlock.includes("onclick=\"go('growth');v28SetGrowthTab('presets')\"")
   &&!/startBattle\s*\(/.test(buildBlock)],
 ['build codex navigation is presentation-only',
  focusBuildLibraryBlock.includes("document.querySelector('[data-build-library=\"'+type+'\"]')")
   &&focusBuildLibraryBlock.includes("document.querySelectorAll('[data-build-target]')")
   &&focusBuildLibraryBlock.includes("button.setAttribute('aria-pressed',String(active))")
   &&focusBuildLibraryBlock.includes('target.focus({preventScroll:true})')
   &&focusBuildLibraryBlock.includes('Math.max(0,target.offsetTop-scroller.offsetTop-8)')
   &&!/\bsave\b|\bpersist\s*\(|\bclearBuild\s*\(|\btoggleBuild\s*\(|\bapplyPreset\s*\(/.test(focusBuildLibraryBlock)],
 ['real build skills are native selected controls with established mutation delegation',
  renderBuildBlock.includes("d=document.createElement('button');d.type='button'")
   &&renderBuildBlock.includes("d.setAttribute('aria-pressed',String(active))")
   &&renderBuildBlock.includes('d.onclick=()=>toggleBuild(id)')
   &&renderBuildBlock.includes("document.querySelector('[data-build-picks=\"active\"]')")
   &&renderBuildBlock.includes("document.querySelector('[data-build-picks=\"passive\"]')")
   &&buildCode.includes('function toggleBuild(id)')
   &&buildCode.includes('function applyPreset(i)')
   &&buildCode.includes('function clearBuild()')],
 ['desktop first-viewport build sanctum',
  css.includes('V3.3.5 SCENE BUILD SANCTUM')
   &&css.includes('body[data-shell-view="build"] .app{display:block;min-height:100dvh}')
   &&css.includes('.buildSanctum{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.buildLayout{display:grid;grid-template-columns:220px minmax(380px,.98fr) minmax(400px,1.02fr)')
   &&css.includes('.buildCodexScroll{min-height:0;overflow-y:auto;overflow-x:hidden')
   &&css.includes('.buildFormScroll{min-height:0;overflow-y:auto;overflow-x:hidden')],
 ['phone build rail, touch targets and safe-area containment',
  css.includes('body[data-shell-view="build"]{overflow-x:hidden;overflow-y:auto}')
   &&css.includes('.buildCodexRail{display:flex;overflow-x:auto;overflow-y:hidden')
   &&css.includes('.buildCodexTarget{flex:0 0 124px;min-width:124px;min-height:44px')
   &&css.includes('#build .buildSkillList{grid-template-columns:minmax(0,1fr)}')
   &&css.includes('padding:calc(70px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(84px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))')],
 ['scene-led growth court preserves all render bindings',
  growthBlock.includes('data-growth-court')
   &&growthBlock.includes('class="growthHeroDossier"')
   &&growthBlock.includes('class="growthPractice"')
   &&['v28MetaAvatar','v28MetaHeroId','v28MetaHeroName','v28Gold','v28TalentPts','v28AccountLv','v28HeroGrowthGrid','v28Stars','v28MetaEffects','v28AccountBadge','v28AccountXpFill','v28AccountXpText','v28TalentSummary','v28TalentTree','v28MasteryText','v28MasteryFill','v28MasteryNodes','v28AwakenPanel','v28PresetGrid'].every(id=>growthBlock.includes(`id="${id}"`))],
 ['four native growth paths target real selected panes',
  (growthBlock.match(/data-growth-target=/g)||[]).length===4
   &&['hero','talent','mastery','presets'].every((type,index)=>growthBlock.includes(`data-growth-target="${type}" data-growth="${type}" aria-pressed="${index===0?'true':'false'}" aria-controls="growth-${type}" onclick="v28SetGrowthTab('${type}')"`))
   &&['hero','talent','mastery','presets'].every((type,index)=>growthBlock.includes(`id="growth-${type}" class="growthPane${index===0?' active':''}" data-growth-pane="${type}" tabindex="-1"`))
   &&!/startBattle\s*\(/.test(growthBlock)],
 ['growth and build use preparation-only handoff paths',
  growthBlock.includes('data-growth-handoff onclick="go(\'build\')"')
   &&buildBlock.includes("onclick=\"go('growth');v28SetGrowthTab('presets')\"")
   &&!/startBattle\s*\(/.test(growthBlock)],
 ['growth path navigation is presentation-only',
  setGrowthTabBlock.includes("document.querySelectorAll('[data-growth-target]')")
   &&setGrowthTabBlock.includes("button.setAttribute('aria-pressed',String(active))")
   &&setGrowthTabBlock.includes("document.querySelectorAll('[data-growth-pane]')")
   &&setGrowthTabBlock.includes('pane.hidden=!active')
   &&!/\bsave\b|\bpersist\s*\(|\bv28Invest\s*\(|\bv28SavePreset\s*\(|\bv28LoadPreset\s*\(/.test(setGrowthTabBlock)],
 ['growth talents are native controls with established mutation delegation',
  renderGrowthBlock.includes("n=document.createElement('button');n.type='button'")
   &&renderGrowthBlock.includes("n.setAttribute('aria-disabled',String(!ok||lv>=5))")
   &&renderGrowthBlock.includes('n.onclick=()=>v28Invest(tid)')
   &&metaGrowthCode.includes('function v28LevelUp()')
   &&metaGrowthCode.includes('function v28StarUp()')
   &&metaGrowthCode.includes('function v28Awaken()')
   &&metaGrowthCode.includes('function v28Invest(id)')
   &&metaGrowthCode.includes('function v28SavePreset(i)')
   &&metaGrowthCode.includes('function v28LoadPreset(i)')],
 ['desktop first-viewport growth court',
  css.includes('V3.3.5 SCENE GROWTH COURT')
   &&css.includes('body[data-shell-view="growth"] .app{display:block;min-height:100dvh}')
   &&css.includes('.growthCourt{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.growthCourtLayout{display:grid;grid-template-columns:260px minmax(0,1fr)')
   &&css.includes('.growthPracticeScroll{min-height:0;overflow-y:auto;overflow-x:hidden')],
 ['phone growth rail, touch targets and safe-area containment',
  css.includes('body[data-shell-view="growth"]{overflow-x:hidden;overflow-y:auto}')
   &&css.includes('.growthPathRail{display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden')
   &&css.includes('.growthTab{flex:0 0 126px;min-width:126px;min-height:44px')
   &&css.includes('#growth .talentTree{grid-template-columns:minmax(0,1fr)}')
   &&css.includes('padding:calc(70px + env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) calc(84px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))')],
 ['scene-led mission board structure and selected context',
  modesBlock.includes('data-mission-board')
   &&modesBlock.includes('id="missionBoardTitle"')
   &&modesBlock.includes('id="missionStageName"')
   &&modesBlock.includes('id="missionTargetText"')
   &&modesBlock.includes('id="missionHeroName"')
   &&modesBlock.includes('id="missionBossName"')],
 ['single selected-rule mission start path',
  (modesBlock.match(/data-mission-start/g)||[]).length===1
   &&modesBlock.includes('onclick="v29StartSelected()"')
   &&modesBlock.includes('id="v29StartMode"')
   &&gameModesCode.includes('function v29StartSelected(){v29QuickStart(save.mode)}')
   &&gameModesCode.includes('function v29QuickStart(id)')],
 ['native select-only mode projections',
  renderModesBlock.includes("d=document.createElement('button');d.type='button'")
   &&renderModesBlock.includes("d.setAttribute('aria-pressed',String(mid===id))")
   &&renderModesBlock.includes('d.disabled=!ok')
   &&renderModesBlock.includes('d.onclick=()=>v29SelectMode(mid)')
   &&!/v29QuickStart\(/.test(renderModesBlock)],
 ['semantic expedition briefing preserves all live configuration bindings',
  briefingBlock.includes('data-expedition-briefing')
   &&['briefingTitle','briefingStageCode','briefingStageName','briefingObjective','briefingModeName','briefingHeroName','briefingPower','briefingGearList','briefingRuneList','briefingPetName','briefingActiveList','briefingPassiveList','briefingReadiness','briefingBlockers','briefingConfirm'].every(id=>briefingBlock.includes(`id="${id}"`))
   &&['heroes','loadout','build'].every(page=>briefingBlock.includes(`v29OpenBriefingEditor('${page}')`))],
 ['briefing re-derives valid non-empty active and passive builds plus all readiness inputs',
  briefingStatusBlock.includes('v29Unlocked(save.mode)')
   &&briefingStatusBlock.includes('storyStageUnlocked(save.selectedStage)')
   &&briefingStatusBlock.includes('if(!active.length)')
   &&briefingStatusBlock.includes('if(!passive.length)')
   &&briefingStatusBlock.includes("active.filter(id=>!WW.config.skill?.[id]||String(id).startsWith('P'))")
   &&briefingStatusBlock.includes("passive.filter(id=>!WW.config.skill?.[id]||!String(id).startsWith('P'))")
   &&briefingStatusBlock.includes('Object.entries(slotLabels)')
   &&briefingStatusBlock.includes('if(!runes.length)')
   &&briefingStatusBlock.includes('WW.config.pet?.[save.pet]')
   &&briefingStatusBlock.includes('ready:blockers.length===0')],
 ['blocked briefing items expose direct preparation and route repair actions',
  briefingRenderBlock.includes("action.className='briefingFix'")
   &&briefingRenderBlock.includes('action.onclick=()=>v29OpenBriefingFix(blocker.target)')
   &&briefingFixBlock.includes('V29_BRIEFING_EDITORS[target]')
   &&briefingFixBlock.includes("target!=='modes'&&target!=='world'")
   &&briefingFixBlock.includes('v29ClearBriefingContext();go(target)')],
 ['briefing hero appointment defers mutation and return until explicit build confirmation',
  briefingHeroActionBlock.includes('save.hero===id')
   &&briefingHeroActionBlock.includes('heroSave.unlocked')
   &&briefingHeroActionBlock.includes('gold>=price')
   &&briefingHeroActionBlock.includes('button.disabled=disabled')
   &&briefingCompleteHeroBlock.includes('return confirmHeroSelection()')
   &&!briefingCompleteHeroBlock.includes('selectHero(')
   &&!briefingCompleteHeroBlock.includes('v29ReturnToBriefing()')
   &&applyHeroBlock.includes("v29BriefingContext?.editor==='heroes'")
   &&applyHeroBlock.includes('v29ReturnToBriefing()')],
 ['hero, loadout and build pages return to refreshed briefing with visible focus',
  (html.match(/data-briefing-return/g)||[]).length===3
   &&briefingBeginBlock.includes('window.scrollTo(0,0)')
   &&briefingOpenEditorBlock.includes('window.scrollTo(0,0)')
   &&briefingReturnBlock.includes("go('briefing');v29RenderBriefing()")
   &&briefingReturnBlock.includes("document.getElementById(focusId||'briefingTitle')?.focus()")
   &&!briefingReturnBlock.includes('focus({preventScroll:true})')
   &&briefingKeydownBlock.includes("event.key!=='Escape'")
   &&briefingKeydownBlock.includes('v29ReturnToBriefing()')
   &&briefingCompleteLoadoutBlock.includes("v29BriefingContext?.editor==='loadout'")
   &&briefingCompleteLoadoutBlock.includes('v29ReturnToBriefing()')
   &&briefingCompleteBuildBlock.includes("v29BriefingContext?.editor==='build'")
   &&briefingCompleteBuildBlock.includes('v29ReturnToBriefing()')
   &&briefingSyncBlock.includes("loadoutComplete.textContent=active?")
   &&briefingSyncBlock.includes("buildComplete.setAttribute('aria-label',active?")],
 ['only explicit briefing confirmation owns battle launch once',
  briefingQuickStartBlock.includes('v29BeginBriefing()')
   &&!/startBattle\s*\(/.test(briefingQuickStartBlock)
   &&briefingConfirmBlock.includes('const status=v29BriefingStatus()')
   &&briefingConfirmBlock.includes('if(v29BriefingLaunching||v29LoadingTimer)return')
   &&briefingConfirmBlock.includes('v29BriefingLaunching=true')
   &&(briefingConfirmBlock.match(/startBattle\s*\(/g)||[]).length===1],
 ['phone briefing keeps repair and launch controls reachable without blocked clicks',
  css.includes('body[data-shell-view="briefing"]{overflow-x:hidden;overflow-y:auto}')
   &&css.includes('.briefingBody{grid-template-columns:minmax(0,1fr);gap:10px')
   &&css.includes('.briefingPanelTitle>button{min-width:104px;min-height:44px')
   &&css.includes('.briefingCheck li{grid-template-columns:minmax(0,1fr)}')
   &&css.includes('.briefingFix{width:100%;min-width:0}')
   &&css.includes('.briefingCommand{position:fixed;left:max(12px,env(safe-area-inset-left))')
   &&css.includes('.toast{position:fixed;')
   &&css.includes('pointer-events:none')],
 ['desktop first-viewport mission console',
  css.includes('V3.3.5 SCENE MISSION BOARD')
   &&css.includes('body[data-shell-view="modes"] .app{display:block')
   &&css.includes('.missionBoard{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.missionConsole{display:grid;grid-template-columns:minmax(170px,210px) minmax(0,1fr) minmax(210px,260px)')
   &&css.includes('.missionLaunch{position:relative;min-height:68px')],
 ['phone mission rule rail and safe-area launch action',
  css.includes('body[data-shell-view="modes"] #modes{min-width:0;min-height:calc(100dvh - 64px);overflow:visible;overflow-wrap:anywhere}')
   &&css.includes('#modes .modeGrid{display:flex;overflow-x:auto;overflow-y:hidden')
   &&css.includes('#modes .modeCard{flex:0 0 86px;min-width:86px;min-height:72px')
   &&css.includes('.missionCommand{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom))')],
 ['scene-led rift atlas structure and selected route context',
  worldBlock.includes('data-rift-atlas')
   &&worldBlock.includes('id="riftAtlasTitle"')
   &&worldBlock.includes('id="worldChapterName"')
   &&worldBlock.includes('id="atlasStageId"')
   &&worldBlock.includes('id="atlasStageName"')
   &&worldBlock.includes('id="atlasStageObjective"')
   &&worldBlock.includes('id="atlasBossRoute"')],
 ['single atlas confirmation returns to mission console',
  (worldBlock.match(/data-atlas-confirm/g)||[]).length===1
   &&worldBlock.includes('onclick="go(\'modes\')"')
   &&!/startBattle\(\)/.test(worldBlock)],
 ['native select-only world projections',
  renderWorldBlock.includes("n=document.createElement('button');n.type='button'")
   &&renderWorldBlock.includes("n.setAttribute('aria-pressed',String(save.selectedChapter===id))")
   &&renderWorldBlock.includes('n.disabled=!c.unlock')
   &&renderWorldBlock.includes('n.onclick=()=>selectWorldChapter(id)')],
 ['native select-only stage route projections',
 renderStageListBlock.includes("d=document.createElement('button');d.type='button'")
   &&renderStageListBlock.includes("d.setAttribute('aria-pressed',String(save.selectedStage===st[0]))")
   &&renderStageListBlock.includes('d.disabled=!unlocked')
   &&renderStageListBlock.includes('d.onclick=()=>selectWorldStage(st[0])')],
 ['atlas selection focus survives synchronous rerender',
  selectWorldChapterBlock.includes("document.activeElement?.classList.contains('chapterNode')")
   &&selectWorldChapterBlock.includes("document.querySelector('#worldMap .chapterNode[aria-pressed=\"true\"]')?.focus({preventScroll:true})")
   &&selectWorldStageBlock.includes("document.activeElement?.classList.contains('stageRow')")
   &&selectWorldStageBlock.includes("document.querySelector('#stageList .stageRow[aria-pressed=\"true\"]')?.focus({preventScroll:true})")],
 ['desktop first-viewport rift atlas',
  css.includes('V3.3.5 SCENE RIFT ATLAS')
   &&css.includes('body[data-shell-view="world"] .app{display:block')
   &&css.includes('.riftAtlas{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.atlasScene{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr)')],
 ['phone atlas stage rail and safe-area confirmation',
  css.includes('body[data-shell-view="world"] #world{min-width:0;min-height:calc(100dvh - 64px);overflow:visible;overflow-wrap:anywhere}')
   &&css.includes('#world .stageList{display:flex;overflow-x:auto;overflow-y:hidden')
   &&css.includes('#world .stageRow{flex:0 0 156px;min-width:156px;min-height:112px')
   &&css.includes('.atlasCommand{position:fixed;left:max(12px,env(safe-area-inset-left));right:max(12px,env(safe-area-inset-right));bottom:calc(72px + env(safe-area-inset-bottom))')],
 ['scene-led Result chamber preserves real bindings',
  resultBlock.includes('data-result-chamber')
   &&['resultChamber','resultChamberBackdrop','resultChamberHeader','resultScene','resultVerdict','resultOutcomeSeal','resultMetrics','resultCommands','resultLedger','resultLedgerScroll','resultPanel'].every(name=>resultBlock.includes(`class="${name}`))
   &&['resultState','resultTitle','resultReason','resTime','resKills','resStars','resGold','resultRows','dropGrid','resultDamage'].every(id=>resultBlock.includes(`id="${id}"`))],
 ['Result commands delegate without duplicate settlement',
  (resultBlock.match(/data-result-replay/g)||[]).length===1
   &&(resultBlock.match(/data-result-return/g)||[]).length===1
   &&resultBlock.includes('id="resultHandoffStatus"')
   &&resultBlock.includes('data-result-replay onclick="v29OpenResultHandoff()"')
   &&resultBlock.includes('data-result-return onclick="v29ReturnResultHandoff()"')
   &&!/finishRun\s*\(|startBattle\s*\(/.test(resultBlock)],
 ['Result and lobby project one authoritative campaign handoff',
  gameModesCode.includes('function v29CampaignHandoff(')
   &&gameModesCode.includes('function v29ApplyCampaignHandoff(')
   &&gameModesCode.includes('function v29RenderResultHandoff(')
   &&gameModesCode.includes("event.detail?.id==='result'")
   &&homeBlock.includes('id="nexusMissionState"')
   &&nexusHubCode.includes("handoff.kind==='next'")
   &&nexusHubCode.includes("handoff.kind==='retry'")
   &&nexusHubCode.includes("handoff.kind==='complete'")],
 ['Result outcome projection is presentation-only',
  renderResultBlock.includes("page.dataset.resultOutcome=r.victory?'victory':'defeat'")
   &&!/localStorage|sessionStorage|\bpersist\s*\(|\bfinishRun\s*\(|\bsave(?:\.|\s*=)/.test(renderResultBlock)],
 ['desktop first-viewport Result chamber and internal ledger',
  css.includes('V3.3.5 SCENE RESULT CHAMBER')
   &&css.includes('body[data-shell-view="result"] .app{display:block;min-height:100dvh}')
   &&css.includes('.resultChamber{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.resultScene{display:grid;grid-template-columns:minmax(330px,.82fr) minmax(0,1.18fr)')
   &&css.includes('.resultLedgerScroll{min-height:0;overflow-y:auto;overflow-x:hidden')],
 ['distinct Result victory and defeat identities',
  css.includes('[data-result-outcome="victory"] .resultOutcomeSeal')
   &&css.includes('[data-result-outcome="defeat"] .resultOutcomeSeal')
   &&css.includes('[data-result-outcome="defeat"] .resultChamber')],
 ['phone Result safe-area flow and touch commands',
  css.includes('body[data-shell-view="result"]{overflow-x:hidden;overflow-y:auto}')
   &&css.includes('.resultChamber{height:auto;min-height:calc(100dvh - 64px)')
   &&css.includes('.resultScene{grid-template-columns:minmax(0,1fr)')
   &&css.includes('.resultLedgerScroll{max-height:none;overflow:visible')
   &&css.includes('.resultCommands{grid-template-columns:minmax(0,1fr)')
   &&css.includes('.resultCommands .btn{width:100%;min-width:44px;min-height:44px')
   &&css.includes('calc(84px + env(safe-area-inset-bottom))')],
 ['44px mobile entry actions',
  css.includes('.startScreen{place-items:start center;overflow-x:hidden;overflow-y:auto')
   &&css.includes('.startInner{width:min(100%,560px);grid-template-columns:minmax(0,1fr)')
   &&css.includes('.menuBtn{min-width:44px;min-height:56px')
   &&css.includes('.modalBox{width:100%;max-height:100%')
   &&css.includes('.closeX{flex:0 0 44px;width:44px;height:44px')],
 ['44px mobile modal, story, recovery and settings controls',
  css.includes('.saveCard .actions,.storyIntroCard .actions,.recoveryBox .actions{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}')
   &&css.includes('.saveCard .btn,.storyIntroCard .btn,.recoveryBox .btn{width:100%;min-width:44px;min-height:44px')
   &&css.includes('.settingRow{min-height:44px')
   &&css.includes('.toggle{flex:0 0 44px;width:44px;height:44px')
   &&css.includes('.audioMeter input{min-width:44px;min-height:44px')],
 ['mobile battle overlay scroll, density and touch targets',
  css.includes('.overlay,.lootChoiceOverlay{place-items:start center;overflow-x:hidden;overflow-y:auto')
   &&css.includes('.choiceGrid,.eventGrid,.gearChoiceGrid{grid-template-columns:minmax(0,1fr)}')
   &&css.includes('.choice,.eventCard,.gearChoiceCard{min-width:44px;min-height:44px')
   &&css.includes('.pausePanel .btn{width:100%;min-width:44px;min-height:44px')],
 ['unchanged desktop choice and Start grids',
  css.includes('.choiceGrid{display:grid;grid-template-columns:repeat(3,1fr)')
   &&css.includes('.eventGrid{display:grid;grid-template-columns:repeat(3,1fr)')
   &&css.includes('.gearChoiceGrid{display:grid;grid-template-columns:repeat(3,1fr)')
   &&css.includes('.startInner{position:relative;z-index:2;width:min(980px,92vw);display:grid;grid-template-columns:1.1fr .9fr')],
 ['synchronized navigation state and Escape',
  navigationBlock.includes("b.setAttribute('aria-current','page')")
   &&navigationBlock.includes("navMore.classList.toggle('active',overflowActive)")
   &&navigationBlock.includes("setMobileNavOpen(false)")
   &&navigationBlock.includes("e.key==='Escape'")
   &&navigationBlock.includes('e.stopImmediatePropagation()')
   &&navigationBlock.includes("growth:'长期成长'")
   &&navigationBlock.includes("modes:'游戏模式'")],
 ['semantic mobile combat controls',
  (html.match(/<button type="button" class="mobileAction/g)||[]).length===4
   &&html.includes('<button type="button" class="mobilePause" id="mobilePause"')
   &&!/ontouch(?:start|move|end|cancel)=/.test(html)],
 ['native switch semantics and synchronized state',
  (html.match(/<button\s+type="button"\s+class="toggle(?:\s+on)?"\s+id="[^"]+"\s+role="switch"\s+aria-label="[^"]+"\s+aria-checked="(?:true|false)"/g)||[]).length===9
   &&tutorialSettings.includes("el.setAttribute('aria-checked',String(!!save.settings[key]))")
   &&resultUi.includes("el.setAttribute('aria-checked',String(enabled))")
   &&saveSlots.includes("e.setAttribute('aria-checked',String(enabled))")
   &&qualityPresentation.includes("t.setAttribute('aria-checked',String(enabled))")],
 ['performance profile pressed state',
  saveSlots.includes("b=document.createElement('button');b.type='button'")
   &&saveSlots.includes("b.setAttribute('aria-pressed',String(selected))")],
 ['dialog and status semantics',
  ['saveModal','settingsModal','storyIntro','v26LootOverlay','levelOverlay','chestOverlay','eventOverlay','tutorialOverlay','pauseOverlay'].every(id=>{
   const tag=openingTag(id);return tag.includes('role="dialog"')&&tag.includes('aria-modal="true"')&&tag.includes('aria-labelledby=')
  })
   &&openingTag('v30Recovery').includes('role="alertdialog"')
   &&openingTag('v30Recovery').includes('aria-describedby=')
   &&openingTag('toast').includes('role="status"')
   &&openingTag('toast').includes('aria-live="polite"')
   &&openingTag('loadingScreen').includes('role="status"')
   &&openingTag('loadingScreen').includes('aria-label="正在进入裂隙"')
   &&html.includes('aria-label="关闭存档管理"')
   &&html.includes('aria-label="关闭游戏设置"')
   &&html.includes('id="masterVolume" aria-label="主音量"')],
 ['scene-led Battle Theater with unique live intelligence',
  battleBlock.includes('data-battle-theater')
   &&['battleTheater','battleBackdrop','battleCommandHeader','battleObjectivePanel','battleThreatPanel','battleStage','battleDossier'].every(name=>battleBlock.includes(`class="${name}`))
   &&['v29BattleMode','v29BattleObjective','v29ModeProgress','v29ModeAction','directorWave','directorPressureText','directorPressure','directorNext'].every(id=>(html.match(new RegExp(`id="${id}"`,'g'))||[]).length===1)],
['Battle Theater pause delegates to the existing overlay',
  (battleBlock.match(/data-battle-pause/g)||[]).length===1
   &&battleBlock.includes('data-battle-pause aria-controls="pauseOverlay" onclick="performBattleAction(\'pause\',togglePause)"')],
 ['Battle Theater dossier has one accessible controller',
  (battleBlock.match(/id="battleDossierToggle"/g)||[]).length===1
   &&battleBlock.includes('aria-controls="battleDossier" aria-expanded="false" onclick="toggleBattleDossier()"')
   &&battleBlock.includes('id="battleDossier" aria-label="战术卷宗" aria-hidden="true"')
   &&engine.includes('function setBattleDossierOpen(open)')
   &&engine.includes('function toggleBattleDossier()')],
 ['Battle Theater preserves arena overlays and mobile controls',
  battleBlock.includes('<div class="battleCommandDock"')
   &&['arenaCanvas','v26LootOverlay','levelOverlay','chestOverlay','eventOverlay','tutorialOverlay','pauseOverlay','joystickBase','mobileSkill','mobileDodge','mobileUlt','mobileInteract','mobilePause'].every(id=>battleBlock.includes(`id="${id}"`))],
 ['desktop full-width Battle Theater and overlay tactical dossier',
  css.includes('V3.3.5 SCENE BATTLE THEATER')
   &&css.includes('body[data-shell-view="battle"]{overflow:hidden')
   &&css.includes('.battleTheater{position:relative;min-height:100dvh;height:100dvh')
   &&css.includes('.battleCommandHeader{display:grid;grid-template-columns:minmax(180px,.72fr) minmax(320px,1.35fr) minmax(240px,.93fr)')
   &&css.includes('.battleStage{display:grid;grid-template-columns:minmax(0,1fr);')
   &&css.includes('.battleDossier{position:absolute;inset:0 0 0 auto;')],
 ['compact desktop drawer and full-screen mobile Battle Theater',
  css.includes('@media(min-width:901px) and (max-width:1250px)')
   &&css.includes('.battleDossier{width:min(320px,calc(100% - 48px))')
   &&css.includes('@media(max-width:900px)')
   &&css.includes('body.mobileBattle .battleCommandHeader,body.mobileBattle .battleBackdrop,body.mobileBattle .battleDossier{display:none}')
   &&css.includes('body.mobileBattle .battleTheater,body.mobileBattle .battleStage{width:100%;height:100%;min-height:0')],
 ['expanded desktop live Arena',
  css.includes('grid-template-rows:86px minmax(0,1fr)')
   &&css.includes('.battleStage{display:grid;grid-template-columns:minmax(0,1fr);')
   &&css.includes('.battleStage.dossierOpen .battleDossier{transform:translateX(0);opacity:1;visibility:visible;pointer-events:auto')],
 ['frame-rate-independent movement response and interruption reset',
  engine.includes('function responsiveMovementVector(dt)')
   &&engine.includes('function resetMovementResponse()')
   &&engine.includes('const move=responsiveMovementVector(dt)')
   &&director.includes('const move=responsiveMovementVector(dt)')
   &&startBattleBlock.includes('resetMovementResponse()')
   &&saveSlots.includes("if(typeof resetMovementResponse==='function')resetMovementResponse()")
   &&tutorialSettings.includes("if(run.paused&&typeof v331ClearInputs==='function')v331ClearInputs()")
   &&engine.includes('const input=movementVector()')],
 ['desktop battle viewport containment',
  css.includes('.battleLayout{--battle-stage-height:clamp(520px,calc(100dvh - 164px),740px);')
   &&css.includes('gap:14px;align-items:start}.arena{height:var(--battle-stage-height);min-height:0')
   &&css.includes('#arenaCanvas{width:100%;height:100%;display:block}')
   &&css.includes('.battleSide{display:grid;gap:12px;align-content:start;max-height:var(--battle-stage-height)')
   &&css.includes('overflow-y:auto;scrollbar-color:')],
 ['visible desktop command dock and readiness feedback',
  html.includes('<div class="battleCommandDock" role="group" aria-label="战斗快捷操作">')
   &&html.includes('id="heroSkillAction"')
   &&html.includes('id="dodgeAction"')
   &&html.includes('id="ultAction"')
   &&html.includes('<strong>英雄技</strong>')
   &&html.includes('<strong>闪避</strong>')
   &&html.includes('<strong>终极</strong>')
   &&css.includes('.battleCommandDock{position:absolute;right:14px;bottom:14px')
   &&engine.includes('function updateDesktopActionsHud()')
   &&engine.includes("setDesktopActionState('heroSkillAction','skillCdText'")
   &&engine.includes("setDesktopActionState('dodgeAction','dodgeCdText'")
   &&engine.includes("setDesktopActionState('ultAction','ultText'")
   &&engine.includes('updateDesktopActionsHud();updateMobileControlsHud()')],
 ['native desktop actions and runtime battle choices',
  html.includes('<button type="button" class="actionBtn heroSkill"')
   &&html.includes('<button type="button" class="actionBtn dodge"')
   &&html.includes('<button type="button" class="actionBtn ult"')
   &&(engine.match(/createElement\('button'\)/g)||[]).length>=3
   &&engine.includes("d.className='choice'")
   &&engine.includes("x.className='eventCard'")
   &&gearSystem.includes("const tag=choice?'button':'div',attrs=choice?' type=\"button\"':''")],
 ['overlay focus entry and restoration',
 saveSlots.includes('const v32FocusOrigins=new Map()')
   &&saveSlots.includes("el.querySelector('button:not(:disabled),input:not(:disabled),[tabindex]:not([tabindex=\"-1\"])')")
   &&saveSlots.includes("first.focus({preventScroll:true})")
   &&saveSlots.includes('origin instanceof HTMLElement&&origin.isConnected')
   &&saveSlots.includes("focusTarget.focus({preventScroll:true})")],
['interactive-target gameplay key isolation',
  engine.includes("function v32InteractiveKeyTarget(target){return target instanceof Element&&!!target.closest('button,input,select,textarea,[role=\"button\"],[role=\"switch\"]')}")
   &&engine.includes("if(v32InteractiveKeyTarget(e.target)&&e.key!=='Escape')return")],
 ['dismissible six-action battle onboarding structure',
  battleBlock.includes('id="v30OnboardingTip" role="status" aria-live="polite"')
   &&battleBlock.includes('id="battleOnboardingCount"')
   &&battleBlock.includes('data-onboarding-dismiss')
   &&['move','skill','dodge','ult','interact','pause'].every(action=>(battleBlock.match(new RegExp(`data-onboarding-step="${action}"`,'g'))||[]).length===1)
   &&battleBlock.includes('id="arenaCanvas" tabindex="-1"')],
 ['non-blocking run-local onboarding lifecycle',
  startBattleBlock.includes("if(!save.settings.tutorialSeen)showTutorial()")
   &&!/run\.paused\s*=\s*true|v32OpenLayer\(['\"]tutorialOverlay/.test(startBattleBlock)
   &&tutorialSettings.includes("const BATTLE_ONBOARDING_STEPS=['move','skill','dodge','ult','interact','pause']")
   &&tutorialSettings.includes('run.onboarding={active:true,completed:{}}')
   &&tutorialSettings.includes('function recordBattleOnboarding(action)')
   &&tutorialSettings.includes('function performBattleAction(action,fn)')
   &&tutorialSettings.includes('function completeBattleOnboarding()')],
 ['successful live action onboarding paths',
  engineCode.includes("performBattleAction('skill',castHeroSkill)")
   &&engineCode.includes("performBattleAction('dodge',tryDodge)")
   &&engineCode.includes("performBattleAction('ult',castUltimate)")
   &&engineCode.includes("performBattleAction('pause',togglePause)")
   &&directorCode.includes("recordBattleOnboarding('move')")
   &&bossInteractionsCode.includes("recordBattleOnboarding('interact')")
   &&saveSlotsCode.includes('performBattleAction(action,fn)')],
 ['existing tutorialSeen persistence only',
  tutorialSettings.includes('save.settings.tutorialSeen=true;persist()')
   &&!/(?:onboarding|tutorialProgress|tutorialSteps)\s*:/.test(gameDataCode)
   &&!/(?:save\.settings|save)\.(?:onboarding|tutorialProgress|tutorialSteps)\s*=/.test(tutorialSettings)],
 ['legacy timed onboarding removed',
  !stabilityCode.includes('lastOnboarding')
   &&!/run\.time<12|run\.time<24|run\.time<36|run\.time<48|run\.time<60/.test(stabilityCode)
   &&stabilityCode.includes('function v30Onboarding(){')
   &&stabilityCode.includes('renderBattleOnboarding')],
 ['visible pause focus fallback',
  saveSlotsCode.includes("el.id==='pauseOverlay'")
   &&saveSlotsCode.includes("document.querySelector('[data-battle-pause]')")
   &&saveSlotsCode.includes("document.getElementById('mobilePause')")
   &&saveSlotsCode.includes("document.getElementById('arenaCanvas')")
   &&saveSlotsCode.includes('getClientRects().length')],
 ['non-blocking responsive onboarding presentation',
  css.includes('.onboardingTip{')
   &&css.includes('.onboardingDismiss{')
   &&css.includes('pointer-events:auto')
   &&css.includes('grid-template-columns:repeat(3,minmax(0,1fr))')
   &&css.includes('grid-template-columns:repeat(2,minmax(0,1fr))')
   &&!css.includes('.qualityBadge,body.mobileBattle .modeBadge,body.mobileBattle .onboardingTip,body.mobileBattle .heroStateBadge')],
 ['focus-visible and reduced-motion coverage',
  css.includes(':where(button,input,[role="button"],[role="switch"],[tabindex]):focus-visible')
   &&css.includes('outline:3px solid #fff1a8')
   &&css.includes('@media(prefers-reduced-motion:reduce)')
   &&css.includes('animation:none!important')
   &&css.includes('transition-duration:.01ms!important')
   &&css.includes('scroll-behavior:auto!important')],
 ['pending human-play acceptance pack',
  playtestValidation.valid&&!playtestValidation.accepted
   &&REQUIRED_INPUTS.every(input=>playtestValidation.completedRoutes[input]===0)
   &&REQUIRED_ROUTES.every(route=>playtestProtocol.includes(route.stageId))
   &&playtestProtocol.includes('自动化')&&playtestProtocol.includes('实体手机')],
 ['captured floating-zone Pointer joystick',
  saveSlotsCode.includes("zone.addEventListener('pointerdown'")
   &&saveSlotsCode.includes("zone.addEventListener('pointermove'")
   &&saveSlotsCode.includes("zone.addEventListener('pointercancel'")
   &&saveSlotsCode.includes('zone.setPointerCapture(e.pointerId)')
   &&saveSlotsCode.includes('zone.releasePointerCapture(id)')
   &&saveSlotsCode.includes('v331PositionJoystickBase(e.clientX,e.clientY)')
   &&saveSlotsCode.includes('(Math.min(r.width,r.height)-Math.min(k.width,k.height))/2')
   &&saveSlotsCode.includes("window.addEventListener('orientationchange',()=>v331ResetJoystick())")
   &&!/touch(?:start|move|end|cancel)/.test(saveSlotsCode)],
 ['shared continuous keyboard and analog movement vector',
  engineCode.includes("typeof v331JoystickVector==='function'?v331JoystickVector():null")
   &&directorCode.includes('const move=responsiveMovementVector(dt);if(move){')
   &&saveSlotsCode.includes('function v331JoystickVector()')
   &&saveSlotsCode.includes('const V331_JOYSTICK_DEAD_ZONE=.12')
   &&!/keys\.d=v20Joy|keys\.a=v20Joy|keys\.s=v20Joy|keys\.w=v20Joy/.test(saveSlotsCode)],
 ['independent mobile action pointer ownership',
  saveSlotsCode.includes('const v331ActionPointers=new Map()')
   &&saveSlotsCode.includes('v331ActionPointers.has(id)')
   &&saveSlotsCode.includes("v331ActionPointers.get(id)!==e.pointerId")
   &&saveSlotsCode.includes("button.addEventListener('pointercancel',releasePointer)")
   &&saveSlotsCode.includes("button.addEventListener('lostpointercapture',releasePointer)")],
 ['focus-loss input clearing and safe pause',
  saveSlotsCode.includes('function v331ClearInputs()')
   &&saveSlotsCode.includes('Object.keys(keys).forEach(key=>keys[key]=false)')
   &&saveSlotsCode.includes("document.querySelectorAll('#mobileControls .pressed')")
   &&saveSlotsCode.includes("window.addEventListener('blur',v331HandleFocusLoss)")
   &&saveSlotsCode.includes("document.addEventListener('visibilitychange'")
   &&saveSlotsCode.includes("run?.active&&!run.paused")
   &&saveSlotsCode.includes('v30BlockingOpen')],
['mobile actions reuse gameplay functions',
  saveSlotsCode.includes("['mobileSkill','skill',castHeroSkill]")
   &&saveSlotsCode.includes("['mobileDodge','dodge',tryDodge]")
   &&saveSlotsCode.includes("['mobileUlt','ult',castUltimate]")
   &&saveSlotsCode.includes("['mobileInteract','interact',v25UseInteractable]")
   &&saveSlotsCode.includes("['mobilePause','pause',togglePause]")
   &&saveSlotsCode.includes('performBattleAction(action,fn)')],
 ['mobile action HUD feedback',
  engineCode.includes("setMobileActionState('mobileSkill'")
   &&engineCode.includes("setMobileActionState('mobileDodge'")
   &&engineCode.includes("setMobileActionState('mobileUlt'")
   &&engineCode.includes("setMobileActionState('mobileInteract'")],
 ['persistent world and follow camera',
  engineCode.includes('const BATTLE_WORLD_MIN_W=')
   &&engineCode.includes('WORLD_W=Math.max(BATTLE_WORLD_MIN_W,Math.ceil(AW*BATTLE_WORLD_VIEW_SCALE))')
   &&engineCode.includes('WORLD_H=Math.max(BATTLE_WORLD_MIN_H,Math.ceil(AH*BATTLE_WORLD_VIEW_SCALE))')
   &&engineCode.includes('function updateBattleCamera(dt,instant=false)')
   &&engineCode.includes('function drawBattleFrame(dt)')
   &&engineCode.includes('ctx.translate(-battleCamera.x,-battleCamera.y);drawRun()')
   &&!engineCode.includes('function remapArenaPoint(')
   &&!engineCode.includes('points.forEach(o=>remapArenaPoint(o,sx,sy))')
   &&engineCode.includes('nextH=Math.max(240,r.height)')
   &&engineCode.includes("window.visualViewport?.addEventListener('resize',v331QueueArenaResize)")
   &&engineCode.includes("window.addEventListener('orientationchange'")],
 ['full-viewport safe-area mobile battle',
  gameDataCode.includes('WW.ui.shell.sync(id)')
   &&shellCode.includes("document.body.classList.toggle('shellBattle',battle)")
   &&shellCode.includes("document.body.classList.toggle('mobileBattle',battle)")
   &&css.includes('body.mobileBattle .sidebar,body.mobileBattle .topbar')
   &&css.includes('body.mobileBattle #arenaCanvas{width:100%;height:100%')
   &&css.includes('env(safe-area-inset-left)')&&css.includes('env(safe-area-inset-right)')&&css.includes('env(safe-area-inset-bottom)')
   &&css.includes('@media(max-width:900px) and (max-height:540px)')
   &&css.includes('.mobilePause{top:')&&css.includes('width:44px;height:44px')],
 ['7 modes',/story:\{name:'\u5267\u60c5\u6a21\u5f0f'/],
 ['30 gear',/EQW010/],
 ['20 runes',/R046/],
 ['5 pets',/PET015/],
 ['20 talents',/T020/]
];

let fail=false;
for(const item of aliasAudit){
 const countMatch=item.reads===item.expectedReads&&item.writes===item.expectedWrites;
 console.log(
  (item.directAlias&&countMatch?'PASS':'FAIL')+' config alias '+item.alias
  +' -> WW.config.'+item.formal
  +' runtime R'+item.reads+'/W'+item.writes
  +' tests '+item.tests
  +(item.files.length?' ['+item.files.join(', ')+']':'')
 );
 if(!item.directAlias||!countMatch)fail=true;
}
for(const [name,check] of good){
 const ok=typeof check==='boolean'?check:check.test(code);
 console.log((ok?'PASS':'FAIL')+' '+name);
 if(!ok)fail=true;
}

const permanentAuraSlow=/player\.speed\*=\s*\.997/.test(code);
console.log((permanentAuraSlow?'FAIL':'PASS')+' no permanent aura slow');
if(permanentAuraSlow)fail=true;

const wrappers=[...code.matchAll(/const (_v\d+[A-Za-z0-9_]*)=/g)].length;
console.log('INFO legacy wrapper aliases: '+wrappers);
if(fail)process.exit(1);
console.log('AUDIT OK');
