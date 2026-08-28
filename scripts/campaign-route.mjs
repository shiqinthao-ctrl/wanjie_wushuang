import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const gameData=read('assets/js/config/game-data.js');
const director=read('assets/js/systems/director-balance.js');
const metaGrowth=read('assets/js/systems/meta-growth.js');
const gameModes=read('assets/js/systems/game-modes.js');
const resultUi=read('assets/js/ui/result.js');
const stability=read('assets/js/core/stability-v30.js');

export const CAMPAIGN_STAGE_IDS=[
 'ST001-01','ST001-02','ST001-03','ST001-04',
 'ST003-01','ST003-02','ST003-03','ST003-04',
 'ST004-01','ST004-02','ST004-03','ST004-04'
];

function functionSource(source,name){
 const start=source.indexOf(`function ${name}(`);
 if(start<0)throw new Error(`missing runtime function ${name}`);
 const open=source.indexOf('{',start);
 let depth=0,quote='',escaped=false,lineComment=false,blockComment=false;
 for(let index=open;index<source.length;index++){
  const char=source[index],next=source[index+1];
  if(lineComment){if(char==='\n')lineComment=false;continue}
  if(blockComment){if(char==='*'&&next==='/'){blockComment=false;index++}continue}
  if(quote){if(escaped){escaped=false;continue}if(char==='\\'){escaped=true;continue}if(char===quote)quote='';continue}
  if(char==='/'&&next==='/'){lineComment=true;index++;continue}
  if(char==='/'&&next==='*'){blockComment=true;index++;continue}
  if(char==='\''||char==='"'||char==='`'){quote=char;continue}
  if(char==='{')depth++;
  if(char==='}'&&--depth===0)return source.slice(start,index+1);
 }
 throw new Error(`unterminated runtime function ${name}`);
}

function blockSource(source,startMarker,endMarker){
 const start=source.indexOf(startMarker),end=source.indexOf(endMarker,start);
 if(start<0||end<0)throw new Error(`missing runtime block ${startMarker}`);
 return source.slice(start,end);
}

function makeClassList(){
 const names=new Set();
 return {add:name=>names.add(name),remove:name=>names.delete(name),contains:name=>names.has(name),toggle:(name,on)=>on?names.add(name):names.delete(name)};
}

function createSandbox(){
 const nodes=new Map(),storage=new Map();
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,{classList:makeClassList(),style:{},textContent:'',innerHTML:''});return nodes.get(id)}};
 const sandbox={
  window:{WW:{config:{}}},document,console,AW:900,AH:740,WORLD_W:2400,WORLD_H:1800,SAVE_KEY:'campaign-route-isolated',
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))},
  setTimeout:callback=>{callback();return 0},clearTimeout:()=>{},
  renderResult:()=>{},renderAll:()=>{},go:()=>{},hint:()=>{},log:()=>{},shake:()=>{},toast:()=>{},v28Render:()=>{},snapshotActiveSlot:()=>{},
  spawnBoss:()=>{},lastResult:null,run:null,baseSettlements:0
 };
 sandbox.clampValue=(value,min,max)=>Math.max(min,Math.min(max,value));
 sandbox.WW=sandbox.window.WW;
 sandbox.save={
  schemaVersion:30,accountLv:12,accountXp:0,gold:6000,hero:'H001',difficulty:'normal',mode:'story',modeTokens:0,
  heroes:{H001:{unlocked:true,level:6,mastery:40,star:1,awakened:false}},
  equip:{weapon:'EQW001',armor:'EQA001',accessory:'EQX001'},runes:['R031','R012','R043'],pet:'PET001',
  build:{active:['A011','A021','A026','A027','A003','A054'],passive:['P026','P017','P030','P019','P016','P018']},
  chapters:{ST001:{stars:{}},ST003:{stars:{}},ST004:{stars:{}}},selectedChapter:'ST001',selectedStage:'ST001-01',
  stats:{runs:0,kills:0,bossKills:0},settings:{tutorialSeen:false},modeStats:{tower:{floor:1,bestFloor:1}},talentPoints:6,talents:{},customPresets:{}
 };
 sandbox.player={hp:800,maxHp:1000,atk:130};
 sandbox.finalizeDrops=()=>{sandbox.baseSettlements++};
 vm.createContext(sandbox);

 vm.runInContext(blockSource(gameData,'window.WW=','const ELITE_AFFIXES='),sandbox);
 vm.runInContext("function fmt(sec){let m=Math.floor(sec/60),s=Math.floor(sec%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}",sandbox);
 for(const name of ['storyStageEntry','storyStageContract','storyStageEncounter','storyStageRecord','storyStageUnlocked','storyStarAward','storyBestStars','storyBossNames','storyStageReward','storyStageSuccess','storyStageTimeout','chapterStars','totalStars','recomputeWorldUnlocks','selectedStageInfo','heroStats'])vm.runInContext(functionSource(gameData,name),sandbox);
 vm.runInContext('persist=function(){recomputeWorldUnlocks()}',sandbox);

 vm.runInContext(blockSource(gameModes,'window.WW=','function v29DateKey'),sandbox);
 for(const name of ['v29Ensure','v29IsFirstCampaign','v29Rule','v29CampaignHandoff','v29ApplyCampaignHandoff','v29RecordActiveBoss','storyBossGoalComplete','v29FirstCampaignPhase','v29Progress','v29SpawnBossId','v29BossForStage','v29FirstCampaignMilestone','v29FirstCampaignLootResolved','v29Update'])vm.runInContext(functionSource(gameModes,name),sandbox);
 sandbox.v29BattleUI=()=>{};
 sandbox.showEvent=()=>{};
 sandbox.showChest=()=>{};

 vm.runInContext(blockSource(director,'const V19_DIFFICULTIES','function setDifficulty'),sandbox);
 for(const name of ['v19SpawnInterval','v19EliteChance','v19StatCurve'])vm.runInContext(functionSource(director,name),sandbox);
 vm.runInContext(blockSource(director,'const _v18_spawnBoss','/* Reward economy tuned'),sandbox);
 vm.runInContext(blockSource(gameModes,'const _v29Interval','const _v29Enemy'),sandbox);
 vm.runInContext(blockSource(stability,'const _v30SpawnBoss','/* ---------- performance'),sandbox);

 vm.runInContext(blockSource(metaGrowth,'/* ================= V2.8','function v28Tier'),sandbox);
 vm.runInContext(functionSource(metaGrowth,'v28LevelUp'),sandbox);
 vm.runInContext('v28Ensure()',sandbox);

 vm.runInContext(functionSource(resultUi,'finishRun'),sandbox);
 vm.runInContext(blockSource(director,'const _v18_finishRun','/* Extend result with director'),sandbox);
 vm.runInContext(blockSource(metaGrowth,'const _v28Finish','const _v28Result'),sandbox);
 vm.runInContext(blockSource(gameModes,'const _v29Finish','const _v29Result'),sandbox);
 vm.runInContext(blockSource(stability,'const _v30Finish','/* ---------- first 60s'),sandbox);
 return sandbox;
}

function runtimeValue(sandbox,expression){return vm.runInContext(expression,sandbox)}

function saveWithoutSelection(save){
 const copy=JSON.parse(JSON.stringify(save));
 delete copy.selectedChapter;delete copy.selectedStage;
 return JSON.stringify(copy);
}

function makeRun(rule,{time=0,hpRatio=.78,boss=null,bossDefeated=false,dualBossPhase=0,pendingLoot=[]}={}){
 const duration=rule.duration||1200,kills=Math.round(duration*.72*rule.spawn),eliteKills=Math.max(3,Math.round((rule.storyEncounter?.elite||1)*6)),eventAt=rule.eventAt||rule.storyEncounter?.eventAt||[],chestAt=rule.chestAt||rule.storyEncounter?.chestAt||[];
 return {
  active:true,paused:false,time,kills,eliteKills,maxCombo:84,drops:[],evolved:{E011:true,E021:true},fused:{F001:true},damageBy:{AUTO:1200},level:45,
  boss,bossDefeated,events:eventAt.map(at=>time>=at),chests:chestAt.map(at=>time>=at),v26BossLootShown:false,v26PendingLoot:pendingLoot,spawn:0,dps:220,totalDamage:0,lastDps:0,dpsClock:0,
  v29:{id:'story',rule,bossesKilled:rule.storyContract?.bosses.length||0,lastBossSeen:null,countedBoss:null,endlessBossMilestone:0,score:0,daily:null,lootResolvedAt:null,settlingAt:null,encounterEvidence:null},
  v30:{finalizing:false,dualBossPhase,lastOnboarding:-1}
 };
}

function firstCampaignPhaseEvidence(sandbox){
 sandbox.save.mode='story';sandbox.save.selectedStage='ST001-01';
 const rule=runtimeValue(sandbox,"v29Rule('story')"),phases=[],capture=()=>phases.push(runtimeValue(sandbox,'v29FirstCampaignPhase().id'));
 sandbox.run=makeRun(rule,{time:0});capture();
 sandbox.run.time=rule.bossAt-10;capture();
 sandbox.run.boss={id:rule.bossId,hp:60,maxHp:100};capture();
 sandbox.run.boss=null;sandbox.run.bossDefeated=true;sandbox.run.v26BossLootShown=true;capture();
 sandbox.run.v26PendingLoot=[{uid:'choice'}];capture();
 sandbox.run.v26PendingLoot=[];sandbox.run.drops.push({id:'EQW002',name:'裂军战刃',source:'boss'});capture();
 sandbox.run.v29.settlingAt=sandbox.run.time;capture();
 return phases;
}

function bossRouteEvidence(sandbox,stageId,rule){
 const oldRun=sandbox.run,bosses=[];
 for(const [index,bossId] of (rule.storyContract?.bosses||[]).entries()){
  sandbox.save.selectedStage=stageId;
  sandbox.run=makeRun(rule,{time:rule.bossAt||0,dualBossPhase:stageId==='ST004-03'&&index===1?2:0});
  runtimeValue(sandbox,`v29SpawnBossId('${bossId}')`);
  bosses.push({id:bossId,name:sandbox.WW.config.boss[bossId].name,hp:Math.round(sandbox.run.boss?.maxHp||0)});
 }
 sandbox.run=oldRun;
 sandbox.save.selectedStage=stageId;
 return bosses;
}

function pressureEvidence(sandbox,stageId,index){
 sandbox.save.selectedStage=stageId;
 const rule=runtimeValue(sandbox,"v29Rule('story')"),encounter=rule.storyEncounter;
 const peak=encounter.waves.filter(wave=>wave.type!=='end').reduce((best,wave)=>{
  const load=wave.budget*(wave.type==='horde'?encounter.horde:1)*(wave.type==='elite'?encounter.elite:1);
  return !best||load>best.load?{...wave,load}:best;
 },null);
 const probeTime=Math.min(rule.duration-1,peak.at+30),heroAtk=runtimeValue(sandbox,"heroStats('H001').atk");
 sandbox.player={hp:780,maxHp:1000,atk:heroAtk};
 sandbox.run=makeRun(rule,{time:probeTime});
 sandbox.run.kills=Math.round(probeTime*.72);
 sandbox.run.dps=heroAtk*1.2;
 const spawnInterval=runtimeValue(sandbox,'v19SpawnInterval()'),eliteChance=runtimeValue(sandbox,'v19EliteChance()');
 const statCurve=runtimeValue(sandbox,`v19StatCurve(${probeTime})`),bosses=bossRouteEvidence(sandbox,stageId,rule);
 const referenceDps=Math.round(heroAtk*4.7),referenceTtk=bosses.length?Number((bosses.reduce((sum,boss)=>sum+boss.hp,0)/referenceDps).toFixed(1)):null;
 const completionMargin=referenceTtk==null?null:Number((rule.duration-rule.bossAt-referenceTtk).toFixed(1)),hazard=encounter.hazard;
 return {
  stage:stageId,index:index+1,budget:rule.storyCurve.budget,beat:rule.storyCurve.beat,spawn:rule.spawn,peakWave:peak.name,peakType:peak.type,
  effectiveSpawn:Number((1/spawnInterval).toFixed(2)),spawnInterval:Number(spawnInterval.toFixed(3)),eliteChance:Number(eliteChance.toFixed(3)),horde:encounter.horde,
  hazard:`${hazard.type}:${hazard.name}`,hazardLoad:Number((hazard.damage*hazard.life/hazard.interval).toFixed(2)),hp:rule.hp,dmg:rule.dmg,speed:rule.speed,incoming:rule.incoming,
  directorHp:Number(statCurve.hp.toFixed(2)),bosses,referenceDps,referenceTtk,completionMargin,reward3:runtimeValue(sandbox,`storyStageReward('${stageId}',3).total`),heroLevel:sandbox.save.heroes.H001.level,
  model:'deterministic-reference-not-human-play'
 };
}

function settleAttempt(sandbox,stageId,{victory=true,hpRatio=.78,dualBossPhase=0,firstLoot=false}={}){
 sandbox.save.mode='story';sandbox.save.selectedStage=stageId;
 const rule=runtimeValue(sandbox,"v29Rule('story')"),contract=rule.storyContract,beforeRuns=sandbox.save.stats.runs,beforeGold=sandbox.save.gold,beforeBase=sandbox.baseSettlements;
 let boss=null,bossDefeated=victory&&contract.bosses.length>0;
 if(!victory&&contract.bosses.length)boss={id:contract.bosses.at(-1),hp:1,maxHp:100};
 sandbox.player={hp:1000*hpRatio,maxHp:1000,atk:runtimeValue(sandbox,"heroStats('H001').atk")};
 sandbox.run=makeRun(rule,{time:firstLoot?Math.min(rule.duration-10,rule.bossAt+50):rule.duration,hpRatio,boss,bossDefeated,dualBossPhase,pendingLoot:firstLoot?[{id:'pending'}]:[]});
 sandbox.run.v26BossLootShown=firstLoot;
 let firstCampaignLootDelay=null;
 if(firstLoot){
  runtimeValue(sandbox,'v29Update(0)');
  const openedWithoutSettlement=sandbox.run.active&&sandbox.save.stats.runs===beforeRuns;
  sandbox.run.v26PendingLoot=[];sandbox.run.drops.push({id:'EQW002',templateId:'EQW002',name:'裂军战刃',rarity:'gold',source:'boss'});
  runtimeValue(sandbox,'v29Update(0)');
  const confirmedAt=sandbox.run.v29.lootResolvedAt,confirmedWithoutSettlement=sandbox.run.active&&confirmedAt===sandbox.run.time&&sandbox.save.stats.runs===beforeRuns;
  sandbox.run.time+=.74;runtimeValue(sandbox,'v29Update(0)');
  const beforeDelayWithoutSettlement=sandbox.run.active&&sandbox.run.v29.settlingAt==null&&sandbox.save.stats.runs===beforeRuns;
  sandbox.run.time+=.02;runtimeValue(sandbox,'v29Update(0)');
  const settlingVisible=sandbox.run.active&&sandbox.run.v29.settlingAt===sandbox.run.time&&runtimeValue(sandbox,"v29FirstCampaignPhase().id")==='settling';
  sandbox.run.time+=.24;runtimeValue(sandbox,'v29Update(0)');
  const settlingStillGuarded=sandbox.run.active&&sandbox.save.stats.runs===beforeRuns;
  sandbox.run.time+=.02;runtimeValue(sandbox,'v29Update(0)');
  firstCampaignLootDelay={openedWithoutSettlement,confirmedWithoutSettlement,beforeDelayWithoutSettlement,settlingVisible,settlingStillGuarded,settledAfterDelay:!sandbox.run.active&&sandbox.save.stats.runs===beforeRuns+1,elapsed:Number((sandbox.run.time-confirmedAt).toFixed(2))};
 }else{
  runtimeValue(sandbox,'v29Update(0)');
 }
 runtimeValue(sandbox,`finishRun(${victory},'duplicate settlement probe')`);
 const result=sandbox.lastResult;
 return {
  stage:stageId,victory,stars:result?.stars??null,record:runtimeValue(sandbox,`storyStageRecord('${stageId}')`),goldEarned:sandbox.save.gold-beforeGold,
  balance:sandbox.save.gold,settlements:sandbox.save.stats.runs-beforeRuns,baseSettlements:sandbox.baseSettlements-beforeBase,reason:result?.reason||'',accountXp:result?.accountXpGain||0,firstCampaignLootDelay
 };
}

export function runCampaignRoute(){
 const sandbox=createSandbox(),failures=[],checks={};
 const check=(condition,message)=>{if(!condition)failures.push(message);return !!condition};
 const initiallyUnlocked=CAMPAIGN_STAGE_IDS.filter(id=>runtimeValue(sandbox,`storyStageUnlocked('${id}')`));
 checks.freshSchema=sandbox.save.schemaVersion===30;
 checks.initialEntry=JSON.stringify(initiallyUnlocked)===JSON.stringify(['ST001-01']);
 check(checks.freshSchema,'isolated route is not Schema30');
 check(checks.initialEntry,'fresh route exposes more than ST001-01');
 const firstCampaignPhases=firstCampaignPhaseEvidence(sandbox),expectedFirstCampaignPhases=['advance','boss-warning','boss-fight','loot-opening','loot-choice','loot-confirmed','settling'];
 checks.firstCampaignPhaseSequence=JSON.stringify(firstCampaignPhases)===JSON.stringify(expectedFirstCampaignPhases);
 check(checks.firstCampaignPhaseSequence,'first campaign phases are missing or out of order');

 const curve=[],route=[],upgrades=[];
 let campaignEarned=0;
 for(const [index,stageId] of CAMPAIGN_STAGE_IDS.slice(0,-1).entries()){
  check(runtimeValue(sandbox,`storyStageUnlocked('${stageId}')`),`${stageId} did not unlock in route order`);
  curve.push(pressureEvidence(sandbox,stageId,index));

  if(stageId==='ST003-03'){
   const defeat=settleAttempt(sandbox,stageId,{victory:false});route.push({...defeat,attempt:'defeat'});
   check(defeat.stars===0&&defeat.record===0,'defeat awarded Story stars');
   check(!runtimeValue(sandbox,"storyStageUnlocked('ST003-04')"),'defeat unlocked the next Story stage');
   check(defeat.settlements===1&&defeat.baseSettlements===1,'defeat did not settle exactly once');
   const defeatBefore=saveWithoutSelection(sandbox.save),defeatHandoff=runtimeValue(sandbox,'v29CampaignHandoff()');
   runtimeValue(sandbox,'v29ApplyCampaignHandoff()');
   checks.defeatHandoff=defeatHandoff.kind==='retry'&&defeatHandoff.stageId==='ST003-03'&&sandbox.save.selectedChapter==='ST003'&&sandbox.save.selectedStage==='ST003-03';
   checks.defeatHandoffSelectionOnly=saveWithoutSelection(sandbox.save)===defeatBefore;
   check(checks.defeatHandoff,'Story defeat did not hand off to a retry of the settled stage');
   check(checks.defeatHandoffSelectionOnly,'Story defeat handoff mutated save data beyond mission selection');
  }

  const attempt=settleAttempt(sandbox,stageId,{victory:true,dualBossPhase:stageId==='ST004-03'?2:0,firstLoot:stageId==='ST001-01'});
  campaignEarned+=attempt.goldEarned;
  route.push({...attempt,attempt:stageId==='ST003-03'?'retry':'clear',campaignEarned});
  check(attempt.record===3,`${stageId} victory did not record three stars`);
  check(attempt.settlements===1&&attempt.baseSettlements===1,`${stageId} settled more than once`);
  if(stageId==='ST001-01'){
   const evidence=attempt.firstCampaignLootDelay;
   checks.firstCampaignLootDelay=!!evidence&&evidence.openedWithoutSettlement&&evidence.confirmedWithoutSettlement&&evidence.beforeDelayWithoutSettlement&&evidence.settlingVisible&&evidence.settlingStillGuarded&&evidence.settledAfterDelay&&evidence.elapsed>=1;
   check(checks.firstCampaignLootDelay,'first campaign did not preserve the loot gate, visible archival delay, or single settlement');
   const victoryBefore=saveWithoutSelection(sandbox.save),victoryHandoff=runtimeValue(sandbox,'v29CampaignHandoff()');
   runtimeValue(sandbox,'v29ApplyCampaignHandoff()');
   checks.firstVictoryHandoff=victoryHandoff.kind==='next'&&victoryHandoff.stageId==='ST001-02'&&sandbox.save.selectedChapter==='ST001'&&sandbox.save.selectedStage==='ST001-02';
   checks.victoryHandoffSelectionOnly=saveWithoutSelection(sandbox.save)===victoryBefore;
   check(checks.firstVictoryHandoff,'ST001-01 victory did not hand off to unlocked uncleared ST001-02');
   check(checks.victoryHandoffSelectionOnly,'Story victory handoff mutated save data beyond mission selection');
  }

  const cost=runtimeValue(sandbox,"v28LevelCost('H001')");
  if(sandbox.save.gold>=cost&&sandbox.save.heroes.H001.level<30){
   const beforeLevel=sandbox.save.heroes.H001.level,beforeGold=sandbox.save.gold;
   runtimeValue(sandbox,'v28LevelUp()');
   upgrades.push({afterStage:stageId,cost:beforeGold-sandbox.save.gold,level:`${beforeLevel}->${sandbox.save.heroes.H001.level}`});
  }
 }

 checks.dualBossPhase1Rejected=(()=>{sandbox.save.selectedStage='ST004-03';sandbox.run={boss:null,bossDefeated:true,v30:{dualBossPhase:1}};return !runtimeValue(sandbox,"storyBossGoalComplete(storyStageContract('ST004-03'))")})();
 checks.dualBossPhase2Accepted=(()=>{sandbox.run={boss:null,bossDefeated:true,v30:{dualBossPhase:2}};return runtimeValue(sandbox,"storyBossGoalComplete(storyStageContract('ST004-03'))")})();
 checks.finalUnlock=runtimeValue(sandbox,"storyStageUnlocked('ST004-04')");
 check(checks.dualBossPhase1Rejected,'ST004-03 accepts only the first Boss phase');
 check(checks.dualBossPhase2Accepted,'ST004-03 rejects the completed dual-Boss state');
 check(checks.finalUnlock,'ST004-03 completion did not unlock ST004-04');

 curve.push(pressureEvidence(sandbox,'ST004-04',11));
 const finalEntryRule=runtimeValue(sandbox,"v29Rule('story')");
 checks.allStageEntries=curve.length===12&&finalEntryRule.storyContract===sandbox.WW.config.stage.ST004.stages[3][5];
 check(checks.allStageEntries,'all 12 Story entries were not exercised');

 const replay=settleAttempt(sandbox,'ST001-02',{victory:true,hpRatio:.50});
 checks.replayMonotonic=replay.stars===2&&replay.record===3&&replay.settlements===1;
 check(checks.replayMonotonic,'two-star replay lowered a three-star record or settled twice');

 sandbox.save.mode='clear';
 const nonStoryRule=runtimeValue(sandbox,"v29Rule('clear')");
 checks.nonStoryIsolation=!('storyCurve' in nonStoryRule)&&!('incoming' in nonStoryRule)&&!('storyEncounter' in nonStoryRule);
 check(checks.nonStoryIsolation,'non-Story rule consumed Story pressure data');
 checks.growthAttainable=upgrades.length>=3&&sandbox.save.heroes.H001.level>6;
 check(checks.growthAttainable,'campaign rewards did not fund representative real level upgrades');
 checks.bossMargins=curve.filter(row=>row.bosses.length).every(row=>row.referenceTtk>0&&row.completionMargin>0);
 check(checks.bossMargins,'deterministic reference model found a negative Boss completion margin');
 checks.routeMonotonic=CAMPAIGN_STAGE_IDS.slice(0,-1).every(id=>runtimeValue(sandbox,`storyStageRecord('${id}')`)===3)&&runtimeValue(sandbox,"storyStageRecord('ST004-04')")===0;
 check(checks.routeMonotonic,'route records are not monotonic through ST004-03');

 const completeSandbox=createSandbox();
 for(const id of CAMPAIGN_STAGE_IDS){const entry=runtimeValue(completeSandbox,`storyStageEntry('${id}')`);completeSandbox.save.chapters[entry.chapter].stars[id]=3}
 completeSandbox.save.selectedChapter='ST004';completeSandbox.save.selectedStage='ST004-04';completeSandbox.lastResult={victory:true,storyReward:true,chapter:'ST004',stage:completeSandbox.WW.config.stage.ST004.stages[3]};
 const completeHandoff=runtimeValue(completeSandbox,'v29CampaignHandoff()');
 checks.campaignComplete=completeHandoff.kind==='complete'&&completeHandoff.stageId==='ST004-04'&&completeHandoff.nextStageId==null;
 check(checks.campaignComplete,'completed Story route fabricated a next mission');

 return {
  ok:failures.length===0,failures,checks,curve,route,upgrades,
  summary:{schemaVersion:sandbox.save.schemaVersion,initiallyUnlocked,clearedThrough:'ST004-03',finalUnlocked:'ST004-04',finalStageSettled:false,campaignEarned,endingGold:sandbox.save.gold,endingHeroLevel:sandbox.save.heroes.H001.level,settledAttempts:route.length+1,model:'deterministic isolated runtime evidence; not human-play evidence'}
 };
}

if(path.resolve(process.argv[1]||'')===path.resolve(fileURLToPath(import.meta.url))){
 const report=runCampaignRoute();
 console.log(`CAMPAIGN ROUTE ${report.ok?'OK':'FAIL'}: ${report.summary.clearedThrough} -> ${report.summary.finalUnlocked}, ${report.curve.length} entries, H001 Lv.${report.summary.endingHeroLevel}`);
 for(const row of report.curve)console.log(`${row.stage} budget ${row.budget.toFixed(2)} interval ${row.spawnInterval.toFixed(3)}s elite ${(row.eliteChance*100).toFixed(1)}% bosses ${row.bosses.map(b=>`${b.id}:${b.hp}`).join('->')||'-'} margin ${row.completionMargin??'-'}s`);
 if(report.failures.length){for(const failure of report.failures)console.error(`- ${failure}`);process.exitCode=1}
}
