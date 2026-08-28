/* ================= V3.0 COMPLETE DEMO / ENGINE CLOSEOUT ================= */
const V30_SCHEMA=30;
const V30_PERF_CAPS={
 low:{enemies:150,shots:170,enemyShots:100,effects:90,numbers:65,traps:55,v24Projectiles:135,v24Fields:16,v24Meteors:18,v24Summons:18},
 balanced:{enemies:230,shots:260,enemyShots:150,effects:160,numbers:110,traps:80,v24Projectiles:220,v24Fields:22,v24Meteors:28,v24Summons:24},
 high:{enemies:320,shots:380,enemyShots:220,effects:240,numbers:170,traps:120,v24Projectiles:310,v24Fields:30,v24Meteors:40,v24Summons:32}
};
let v30ModalQueue=[];

/* ---------- fresh-save definition: V3.0 starts at 0 stars ---------- */
if(DEFAULT_SAVE?.chapters?.ST001){
 DEFAULT_SAVE.chapters.ST001.stars={'ST001-01':0,'ST001-02':0,'ST001-03':0,'ST001-04':0};
 DEFAULT_SAVE.chapters.ST003.stars={};DEFAULT_SAVE.chapters.ST004.stars={};
 DEFAULT_SAVE.selectedChapter='ST001';DEFAULT_SAVE.selectedStage='ST001-01';
 DEFAULT_SAVE.schemaVersion=V30_SCHEMA;
}

/* ---------- schema migration / validation ---------- */
function v30Clone(x){return JSON.parse(JSON.stringify(x))}
function v30NormalizeSave(s){
 s=s&&typeof s==='object'?s:v30Clone(DEFAULT_SAVE);
 s.schemaVersion=V30_SCHEMA;
 s.accountLv=Math.max(1,Math.min(200,Number(s.accountLv)||1));
 s.gold=Math.max(0,Math.floor(Number(s.gold)||0));
 s.hero=WW.config.hero[s.hero]?s.hero:'H001';
 s.settings=s.settings||{};
 if(!['low','balanced','high'].includes(s.settings.performance))s.settings.performance='balanced';
 for(const k of ['shake','numbers','particles','vignette'])if(typeof s.settings[k]!=='boolean')s.settings[k]=true;
 if(typeof s.settings.tutorialSeen!=='boolean')s.settings.tutorialSeen=false;
 if(typeof s.settings.audioEnabled!=='boolean')s.settings.audioEnabled=true;
 s.settings.masterVolume=Math.max(0,Math.min(1,Number(s.settings.masterVolume??.6)));
 s.storySeen=s.storySeen||{ST001:false,ST003:false,ST004:false};
 s.stats=s.stats||{runs:0,kills:0,bossKills:0};
 for(const k of ['runs','kills','bossKills'])s.stats[k]=Math.max(0,Math.floor(Number(s.stats[k])||0));
 s.inventory=s.inventory||{};s.inventory.gear=s.inventory.gear||[];s.inventory.runes=s.inventory.runes||[];s.inventory.pets=s.inventory.pets||[];
 s.build=s.build||{active:[],passive:[]};s.build.active=(s.build.active||[]).filter(id=>WW.config.skill[id]||String(id).startsWith('S')).slice(0,6);s.build.passive=(s.build.passive||[]).filter(id=>WW.config.skill[id]||String(id).startsWith('P')).slice(0,6);
 s.chapters=s.chapters||{};
 for(const cid of Object.keys(WW.config.stage)){
   s.chapters[cid]=s.chapters[cid]||{stars:{}};
   s.chapters[cid].stars=s.chapters[cid].stars||{};
   for(const st of WW.config.stage[cid].stages){let n=Number(s.chapters[cid].stars[st[0]]||0);s.chapters[cid].stars[st[0]]=Math.max(0,Math.min(3,Math.floor(n)))}
 }
 if(!WW.config.stage[s.selectedChapter])s.selectedChapter='ST001';
 const allStages=Object.values(WW.config.stage).flatMap(c=>c.stages.map(x=>x[0]));
 if(!allStages.includes(s.selectedStage))s.selectedStage='ST001-01';
 s.heroes=s.heroes||{};
 for(const id of Object.keys(WW.config.hero)){
   s.heroes[id]=s.heroes[id]||{unlocked:id==='H001',level:1,mastery:0,star:1,awakened:false};
   let h=s.heroes[id];h.level=Math.max(1,Math.min(30,Math.floor(Number(h.level)||1)));h.mastery=Math.max(0,Math.floor(Number(h.mastery)||0));h.star=Math.max(1,Math.min(6,Math.floor(Number(h.star)||1)));h.awakened=!!h.awakened;h.unlocked=!!h.unlocked;
 }
 if(typeof v27EnsureInventory==='function'){/* runtime will complete rune/pet inventory after assigning save */}
 if(typeof WW.config.mode!=='undefined'&&!WW.config.mode[s.mode])s.mode='story';else s.mode=s.mode||'story';
 s.talentPoints=Math.max(0,Math.floor(Number(s.talentPoints)||0));s.talents=s.talents||{};s.customPresets=s.customPresets||{};s.modeStats=s.modeStats||{};s.modeTokens=Math.max(0,Math.floor(Number(s.modeTokens)||0));
 return s
}
function v30MigrateAll(){
 save=v30NormalizeSave(save);
 if(typeof v20Slots!=='undefined'){
   for(let i=1;i<=3;i++)if(v20Slots[i]?.exists&&v20Slots[i].data)v20Slots[i].data=v30NormalizeSave(v20Slots[i].data);
   saveV20Slots();
 }
 localStorage.setItem(SAVE_KEY,JSON.stringify(save));
}

/* migration wrappers */
const _v30Persist=persist;
persist=function(){save=v30NormalizeSave(save);_v30Persist()}
const _v30LoadSlot=loadSlot;
loadSlot=function(i){_v30LoadSlot(i);save=v30NormalizeSave(save);localStorage.setItem(SAVE_KEY,JSON.stringify(save));snapshotActiveSlot();refreshContinueSummary();renderSaveCards();renderAll()}
const _v30Continue=continueGame;
continueGame=function(){_v30Continue();save=v30NormalizeSave(save);localStorage.setItem(SAVE_KEY,JSON.stringify(save));snapshotActiveSlot();renderAll()}
const _v30CreateSlot=createSlot;
createSlot=function(i){_v30CreateSlot(i);save=v30NormalizeSave(save);save.schemaVersion=V30_SCHEMA;localStorage.setItem(SAVE_KEY,JSON.stringify(save));snapshotActiveSlot();renderAll()}
const _v30NewGame=newGameConfirm;
newGameConfirm=function(){_v30NewGame();save=v30NormalizeSave(save);localStorage.setItem(SAVE_KEY,JSON.stringify(save));snapshotActiveSlot();renderAll()}

/* safe active-slot reset */
resetSlot=function(i){
 if(!confirm('确定重置存档槽 '+i+'？'))return;
 v20Slots[i]={exists:false,label:'存档 '+i,data:null,updated:0};
 if(i===v20ActiveSlot){
   const next=[1,2,3].find(n=>n!==i&&v20Slots[n]?.exists&&v20Slots[n].data);
   v20ActiveSlot=next||i;
   if(next){save=v30NormalizeSave(v30Clone(v20Slots[next].data));localStorage.setItem(SAVE_KEY,JSON.stringify(save))}
 }
 saveV20Slots();renderSaveCards();refreshContinueSummary();renderAll()
}

/* ---------- Q alias + improved first-run tutorial ---------- */
if(Array.isArray(TUTORIAL)){
 TUTORIAL.splice(0,TUTORIAL.length,
  ['移动','使用 WASD / 方向键，移动端使用左侧摇杆。保持移动可以避开怪潮包围。'],
  ['闪避','按 Space 闪避，拥有短暂无敌时间；Boss红圈、直线和扇形预警都可以主动规避。'],
  ['英雄技','按 Q 或 E 使用英雄专属技能。六名英雄的E技能、资源与战斗节奏不同。'],
  ['终极','击杀敌人积累终极能量，达到100%后按 R。'],
  ['地图互动','靠近地图装置按 F：炸药桶、治疗点、祭坛、机关和补给箱都能改变战局。'],
  ['Build','升级三选一；主动+被动触发进化，进化技能之间可继续融合。'],
  ['长期成长','结算后使用金币、装备、符文、宠物、天赋、星级与觉醒继续强化英雄。']
 )
}
window.addEventListener('keydown',e=>{if(!v32InteractiveKeyTarget(e.target)&&e.key.toLowerCase()==='q'&&run?.active&&!run.paused)performBattleAction('skill',castHeroSkill)});

/* ---------- modal state machine ---------- */
function v30BlockingOpen(){
 return !!document.querySelector('#levelOverlay.show,#chestOverlay.show,#eventOverlay.show,#tutorialOverlay.show,#v26LootOverlay.show,.modalLayer.show');
}
const _v30TogglePause=togglePause;
togglePause=function(){
 if(!run?.active)return;
 if(v30BlockingOpen()){document.getElementById('pauseOverlay')?.classList.remove('show');return}
 _v30TogglePause()
}
function v30Queue(type,fn){
 if(v30BlockingOpen()){if(!v30ModalQueue.some(x=>x.type===type))v30ModalQueue.push({type,fn});return true}
 return false
}
function v30FlushQueue(){
 if(!run?.active||run.paused||v30BlockingOpen()||!v30ModalQueue.length)return;
 const next=v30ModalQueue.shift();setTimeout(()=>{if(run?.active&&!v30BlockingOpen())next.fn()},0)
}
const _v30ShowChest=showChest;
showChest=function(){if(v30Queue('chest',()=>_v30ShowChest()))return;_v30ShowChest()}
const _v30ShowEvent=showEvent;
showEvent=function(){if(v30Queue('event',()=>_v30ShowEvent()))return;_v30ShowEvent()}
const _v30PickChest=pickChest;
pickChest=function(r){_v30PickChest(r);setTimeout(v30FlushQueue,0)}
const _v30PickEvent=pickEvent;
pickEvent=function(code,ev){
 _v30PickEvent(code,ev);
 if(code==='riftFight'){run.riftEliteStart=run.eliteKills;run.riftEliteTarget=run.riftEliteStart+3;hint('时空裂缝 · 再击败3只精英')}
 setTimeout(v30FlushQueue,0)
}
const _v30PickLevel=pickLevel;
pickLevel=function(o){_v30PickLevel(o);setTimeout(v30FlushQueue,0)}

/* ---------- stable aura slow, no permanent speed decay ---------- */
const _v30EnemyAI=enemyAI;
enemyAI=function(e,dt){
 const keep=player.speed;_v30EnemyAI(e,dt);player.speed=keep
}

/* ---------- ST004-03 actually becomes 炎雷双王 in Story ---------- */
const _v30SpawnBoss=spawnBoss;
spawnBoss=function(){
 if(run?.active&&run?.v29?.id==='story'&&save.selectedStage==='ST004-03'&&(run.v30?.dualBossPhase||0)<2){
   run.v30=run.v30||{};const phase=run.v30.dualBossPhase||0;
   if(phase===0){
     const old=save.selectedStage;save.selectedStage='ST004-01';_v30SpawnBoss();save.selectedStage=old;
     if(run.boss){run.v30.dualBossPhase=1;run.bossDefeated=false;hint('炎雷双王 · 炎狱忍王先阵')}
     return
   }
 }
 _v30SpawnBoss()
}

/* ---------- performance + run-state normalization ---------- */
function v30Cap(arr,n){if(Array.isArray(arr)&&arr.length>n)arr.splice(0,arr.length-n)}
function v30ApplyCaps(){
 const c=V30_PERF_CAPS[save.settings.performance]||V30_PERF_CAPS.balanced;
 v30Cap(enemies,c.enemies);v30Cap(shots,c.shots);v30Cap(enemyShots,c.enemyShots);v30Cap(effects,c.effects);v30Cap(numbers,c.numbers);v30Cap(traps,c.traps);
 if(run?.v24){v30Cap(run.v24.projectiles,c.v24Projectiles);v30Cap(run.v24.fields,c.v24Fields);v30Cap(run.v24.meteors,c.v24Meteors);v30Cap(run.v24.summons,c.v24Summons);v30Cap(run.v24.mirrors,12);v30Cap(run.v24.vortices,10)}
}
function v30RunInit(){
 run.v30=run.v30||{finalizing:false,dualBossPhase:0};
 run.bossDefeated=!!run.bossDefeated;
 run.riftEliteStart=run.eliteKills||0;run.riftEliteTarget=run.riftEliteStart+3;
 run.v30AuraNear=false;
}
const _v30Update=updateRun;
updateRun=function(dt){
 if(!run?.active)return _v30Update(dt);
 if(!run.v30)v30RunInit();
 const stableSpeed=player.speed,slow=run.v30AuraNear?.82:1;run.v30AuraNear=false;player.speed=stableSpeed*slow;
 try{
   _v30Update(dt);
   /* story dual boss second phase */
   if(run?.active&&run?.v29?.id==='story'&&save.selectedStage==='ST004-03'&&run.v30.dualBossPhase===1&&!run.boss&&run.bossDefeated){
     run.bossDefeated=false;run.v30.dualBossPhase=2;setTimeout(()=>{if(run?.active&&!run.boss){_v30SpawnBoss();if(run.boss&&run.v29)run.v29.lastBossSeen=run.boss.id;hint('炎雷双王 · 雷瞬忍王登场')}},180)
   }
   v30ApplyCaps();v30Onboarding()
 }finally{
   if(run?.active)player.speed=stableSpeed
 }
}

/* ---------- one-run one-settlement guard ---------- */
const _v30Finish=finishRun;
finishRun=function(victory,reason){
 if(!run?.active)return;
 run.v30=run.v30||{};
 if(run.v30.finalizing)return;
 run.v30.finalizing=true;
 try{_v30Finish(victory,reason)}
 catch(err){run.v30.finalizing=false;throw err}
}

/* ---------- first 60s onboarding retired; live battle projection ---------- */
function v30Onboarding(){if(typeof renderBattleOnboarding==='function')renderBattleOnboarding()}

/* ---------- graceful runtime recovery ---------- */
function v30RecoverHome(){
 try{save=v30NormalizeSave(save);localStorage.setItem(SAVE_KEY,JSON.stringify(save));snapshotActiveSlot()}catch(e){}
 v32CloseLayer('v30Recovery');
 if(run){run.active=false;run.paused=true}
 go('home');renderAll()
}
window.addEventListener('error',e=>{
 if(!run?.active)return;
 try{
   run.paused=true;const el=document.getElementById('v30Recovery'),meta=document.getElementById('v30RecoveryMeta');
   if(meta)meta.textContent='战斗状态已保存，可安全返回主大厅';
   v32OpenLayer(el);snapshotActiveSlot()
 }catch(_){}
});

/* ---------- UI/status ---------- */
const _v30RenderGlobalSettings=renderGlobalSettings;
renderGlobalSettings=function(){
 _v30RenderGlobalSettings();
 let box=document.getElementById('v30PerfInfo');
 if(!box){
   const root=document.querySelector('#settingsModal .modalBox');if(root){box=document.createElement('div');box.id='v30PerfInfo';box.className='settingsSection';root.appendChild(box)}
 }
 if(box){const c=V30_PERF_CAPS[save.settings.performance]||V30_PERF_CAPS.balanced;box.innerHTML='<h4>当前画面承载</h4><div class="v30Perf"><div><span>同屏敌人</span><b>'+c.enemies+'</b></div><div><span>投射/特效</span><b>'+c.shots+' / '+c.effects+'</b></div><div><span>技能效果</span><b>'+c.v24Projectiles+'</b></div></div>'}
}
const _v30RenderTop=renderTop;
renderTop=function(){_v30RenderTop();const chip=document.querySelector('.versionChip');if(chip)chip.textContent='三界十二关 · 七大挑战模式'}
const _v30Boot=v20Boot;
v20Boot=function(){
 v30MigrateAll();v27EnsureInventory?.();v28Ensure?.();v29Ensure?.();
 localStorage.setItem(SAVE_KEY,JSON.stringify(save));if(typeof snapshotActiveSlot==='function')snapshotActiveSlot();
 _v30Boot();renderTop();renderGlobalSettings()
}
